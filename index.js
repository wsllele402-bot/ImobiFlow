// functions/index.js — Integração Asaas do ImobiFlow (Firebase Cloud Functions)
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// Segredos (definidos no deploy, nunca no código)
const ASAAS_API_KEY = defineSecret("ASAAS_API_KEY");
const ASAAS_WEBHOOK_TOKEN = defineSecret("ASAAS_WEBHOOK_TOKEN");

// Ambiente do Asaas. Sandbox (teste) por padrão.
// Para produção, troque para "https://api.asaas.com/v3".
const ASAAS_BASE = "https://api-sandbox.asaas.com/v3";
const REGION = "southamerica-east1";
const BOLETO_FEE = 2.0; // taxa do boleto Asaas, repassada ao inquilino

async function asaas(path, method, body, apiKey) {
  const res = await fetch(ASAAS_BASE + path, {
    method,
    headers: { "Content-Type": "application/json", access_token: apiKey },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.errors?.[0]?.description || `Asaas respondeu ${res.status}`);
  return data;
}

// -------- Gera a cobrança (boleto/PIX) --------
exports.createAsaasCharge = onCall(
  { secrets: [ASAAS_API_KEY], region: REGION },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Faça login para gerar cobranças.");

    const { tenantId, leaseId, amount, dueDate, billingType = "BOLETO" } = request.data || {};
    if (!tenantId || !amount || !dueDate) throw new HttpsError("invalid-argument", "Dados incompletos.");

    const apiKey = ASAAS_API_KEY.value();

    // Inquilino (e confere que é do usuário)
    const tSnap = await db.collection("tenants").doc(tenantId).get();
    const tenant = tSnap.data();
    if (!tenant || tenant.userId !== uid) throw new HttpsError("not-found", "Inquilino não encontrado.");

    // Cliente no Asaas (cria na 1ª vez e guarda o asaasId)
    let customerId = tenant.asaasId;
    if (!customerId) {
      const customer = await asaas("/customers", "POST", {
        name: tenant.name,
        cpfCnpj: String(tenant.document || "").replace(/\D/g, "") || undefined,
        mobilePhone: String(tenant.phone || "").replace(/\D/g, "") || undefined,
        email: tenant.email || undefined,
      }, apiKey);
      customerId = customer.id;
      await db.collection("tenants").doc(tenantId).update({ asaasId: customerId });
    }

    // Cobrança — o inquilino paga o aluguel + a taxa do boleto
    const charge = await asaas("/payments", "POST", {
      customer: customerId,
      billingType,
      value: Number(amount) + BOLETO_FEE,
      dueDate,
      description: "Aluguel",
      externalReference: leaseId || tenantId,
    }, apiKey);

    // Descobre imóvel/proprietário pela locação
    let propertyId = null, ownerId = null;
    if (leaseId) {
      const lSnap = await db.collection("leases").doc(leaseId).get();
      const lease = lSnap.data();
      if (lease) {
        propertyId = lease.propertyId || null;
        if (propertyId) {
          const pSnap = await db.collection("properties").doc(propertyId).get();
          ownerId = pSnap.data()?.ownerId || null;
        }
      }
    }

    // Registra o pagamento. amount = aluguel líquido (base do repasse);
    // o boleto cobrado do inquilino foi amount + BOLETO_FEE.
    await db.collection("asaas_payments").add({
      userId: uid, leaseId: leaseId || null, tenantId, propertyId, ownerId,
      amount: Number(amount), competencia: String(dueDate).slice(0, 7), dueDate,
      status: "PENDING", asaasPaymentId: charge.id, invoiceUrl: charge.invoiceUrl,
      asaasFee: BOLETO_FEE, createdAt: new Date().toISOString(),
    });

    return { id: charge.id, invoiceUrl: charge.invoiceUrl, bankSlipUrl: charge.bankSlipUrl || null };
  }
);

// -------- Webhook: o Asaas avisa quando o pagamento muda --------
exports.asaasWebhook = onRequest(
  { secrets: [ASAAS_WEBHOOK_TOKEN], region: REGION },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).send("Method not allowed");

    const token = req.get("asaas-access-token");
    if (!token || token !== ASAAS_WEBHOOK_TOKEN.value()) return res.status(401).send("Unauthorized");

    const event = req.body?.event;
    const payment = req.body?.payment;
    if (!event || !payment?.id) return res.status(200).send("ok");

    const map = {
      PAYMENT_RECEIVED: "RECEIVED", PAYMENT_CONFIRMED: "RECEIVED",
      PAYMENT_OVERDUE: "OVERDUE", PAYMENT_DELETED: "PENDING", PAYMENT_REFUNDED: "PENDING",
    };
    const status = map[event];
    if (!status) return res.status(200).send("ok");

    try {
      const snap = await db.collection("asaas_payments").where("asaasPaymentId", "==", payment.id).limit(1).get();
      if (!snap.empty) {
        await snap.docs[0].ref.update({
          status,
          ...(status === "RECEIVED" ? { receivedAt: new Date().toISOString() } : {}),
        });
      }
    } catch (err) {
      console.error("Erro ao atualizar pagamento:", err);
    }
    return res.status(200).send("ok");
  }
);
