import { AsaasPayment, PaymentStatus, Tenant } from "../types";

/**
 * Placeholder temporário do Asaas.
 * A integração real (com confirmação automática) será configurada no Firebase
 * numa próxima etapa. Por enquanto, gera uma cobrança "de mentira" só para o
 * app não quebrar ao clicar em gerar cobrança.
 */
export const createAsaasCharge = async (
  leaseId: string,
  tenantId: string,
  amount: number,
  dueDate: string,
  userId?: string
): Promise<AsaasPayment> => {
  await new Promise((r) => setTimeout(r, 500));
  return {
    id: "pay_" + Math.random().toString(36).slice(2, 10),
    userId: userId || "",
    leaseId,
    tenantId,
    amount,
    dueDate,
    status: PaymentStatus.PENDING,
    invoiceUrl: "#",
  };
};

export const createAsaasCustomer = async (tenant: Omit<Tenant, "id">) => tenant;

export const syncPaymentStatus = async (_paymentId?: string): Promise<PaymentStatus> =>
  PaymentStatus.PENDING;
