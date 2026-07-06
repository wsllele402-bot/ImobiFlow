// functions/index.js — Integração Asaas do ImobiFlow (Firebase Cloud Functions)
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

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

// Garante um cliente no Asaas para o inquilino (cria e guarda o asaasId)
async function ensureCustomer(tenantId, tenant, apiKey) {
  if (tenant.asaasId) return tenant.asaasId;
  const customer = await asaas("/customers", "POST", {
    name: tenant.name,
    cpfCnpj: String(tenant.document || "").replace(/\D/g, "") || undefined,
    mobilePhone: String(tenant.phone || "").replace(/\D/g, "") || undefined,
    email: tenant.email || undefined,
  }, apiKey);
  await db.collection("tenants").doc(tenantId).update({ asaasId: customer.id });
  return customer.id;
}

async function refsDaLocacao(lease) {
  let propertyId = lease.propertyId || null, ownerId = null;
  if (propertyId) {
    const pSnap = await db.collection("properties").doc(propertyId).get();
    ownerId = pSnap.data()?.ownerId || null;
  }
  return { propertyId, ownerId };
}

// Cria a cobrança no Asaas e registra o pagamento no banco
async function criarCobranca(o) {
  const customerId = await ensureCustomer(o.tenantId, o.tenant, o.apiKey);
  const charge = await asaas("/payments", "POST", {
    customer: customerId,
    billingType: o.billingType || "BOLETO",
    value: Number(o.amount) + BOLETO_FEE, // inquilino paga aluguel + taxa do boleto
    dueDate: o.dueDate,
    description: o.description || "Aluguel",
    externalReference: o.leaseId || o.tenantId,
  }, o.apiKey);
  await db.collection("asaas_payments").add({
    userId: o.userId || null, leaseId: o.leaseId || null, tenantId: o.tenantId,
    propertyId: o.propertyId || null, ownerId: o.ownerId || null,
    amount: Number(o.amount), competencia: String(o.dueDate).slice(0, 7), dueDate: o.dueDate,
    status: "PENDING", asaasPaymentId: charge.id, invoiceUrl: charge.invoiceUrl,
    asaasFee: BOLETO_FEE, kind: o.kind || "rent", description: o.description || "Aluguel",
    createdAt: new Date().toISOString(),
  });
  return charge;
}

// -------- Gera a cobrança sob demanda (botão do app) --------
exports.createAsaasCharge = onCall(
  { secrets: [ASAAS_API_KEY], region: REGION },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Faça login para gerar cobranças.");
    const { tenantId, leaseId, amount, dueDate, billingType = "BOLETO", kind = "rent", description = "Aluguel" } = request.data || {};
    if (!tenantId || !amount || !dueDate) throw new HttpsError("invalid-argument", "Dados incompletos.");

    const apiKey = ASAAS_API_KEY.value();
    const tSnap = await db.collection("tenants").doc(tenantId).get();
    const tenant = tSnap.data();
    if (!tenant || tenant.userId !== uid) throw new HttpsError("not-found", "Inquilino não encontrado.");

    let propertyId = null, ownerId = null;
    if (leaseId) {
      const lSnap = await db.collection("leases").doc(leaseId).get();
      const lease = lSnap.data();
      if (lease) ({ propertyId, ownerId } = await refsDaLocacao(lease));
    }

    const charge = await criarCobranca({ apiKey, userId: uid, tenantId, tenant, leaseId, propertyId, ownerId, amount, dueDate, kind, description, billingType });
    return { id: charge.id, invoiceUrl: charge.invoiceUrl, bankSlipUrl: charge.bankSlipUrl || null };
  }
);

// -------- Gera as cobranças do mês automaticamente (todo dia 1º, 09h) --------
exports.gerarCobrancasMensais = onSchedule(
  { schedule: "0 9 1 * *", timeZone: "America/Sao_Paulo", secrets: [ASAAS_API_KEY], region: REGION },
  async () => {
    const apiKey = ASAAS_API_KEY.value();
    const comp = new Date().toISOString().slice(0, 7); // mês atual YYYY-MM
    const leasesSnap = await db.collection("leases").where("active", "==", true).get();
    for (const lDoc of leasesSnap.docs) {
      const lease = lDoc.data();
      const leaseId = lDoc.id;
      try {
        // pula se já existe cobrança de aluguel neste mês para esta locação
        const existing = await db.collection("asaas_payments").where("leaseId", "==", leaseId).get();
        const jaTem = existing.docs.some((d) => {
          const x = d.data();
          return x.competencia === comp && (x.kind || "rent") !== "deposit";
        });
        if (jaTem) continue;

        const tSnap = await db.collection("tenants").doc(lease.tenantId).get();
        const tenant = tSnap.data();
        if (!tenant) continue;

        const { propertyId, ownerId } = await refsDaLocacao(lease);
        const dueDate = `${comp}-${String(lease.dueDay || 5).padStart(2, "0")}`;
        await criarCobranca({
          apiKey, userId: lease.userId, tenantId: lease.tenantId, tenant,
          leaseId, propertyId, ownerId, amount: Number(lease.monthlyRent) || 0,
          dueDate, kind: "rent", description: "Aluguel", billingType: "BOLETO",
        });
        console.log("Cobrança mensal gerada para locação", leaseId, comp);
      } catch (err) {
        console.error("Falha ao gerar cobrança da locação", leaseId, err);
      }
    }
  }
);

// -------- Webhook: o Asaas avisa quando o pagamento muda --------
exports.asaasWebhook = onRequest(
  { secrets: [ASAAS_WEBHOOK_TOKEN], region: REGION },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).send("Method not allowed");

    const token = req.get("asaas-access-token");
    if (!token || token.trim() !== ASAAS_WEBHOOK_TOKEN.value().trim()) return res.status(401).send("Unauthorized");

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
        await snap.docs[0].ref.update({ status, ...(status === "RECEIVED" ? { receivedAt: new Date().toISOString() } : {}) });
      }
    } catch (err) {
      console.error("Erro ao atualizar pagamento:", err);
    }
    return res.status(200).send("ok");
  }
);
