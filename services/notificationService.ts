
import { AsaasPayment, PaymentStatus, Tenant } from "../types";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'upcoming' | 'overdue' | 'info';
  date: string;
  paymentId?: string;
}

export const generatePaymentAlerts = (payments: AsaasPayment[], tenants: Tenant[]): AppNotification[] => {
  const now = new Date();
  const alerts: AppNotification[] = [];

  payments.forEach(pay => {
    if (pay.status === PaymentStatus.RECEIVED) return;

    const dueDate = new Date(pay.dueDate);
    const tenant = tenants.find(t => t.id === pay.tenantId);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      alerts.push({
        id: `alert-overdue-${pay.id}`,
        title: 'Pagamento Atrasado!',
        message: `O aluguel de ${tenant?.name || 'Inquilino'} venceu em ${pay.dueDate}.`,
        type: 'overdue',
        date: pay.dueDate,
        paymentId: pay.id
      });
    } else if (diffDays <= 5) {
      alerts.push({
        id: `alert-upcoming-${pay.id}`,
        title: 'Vencimento Próximo',
        message: `O aluguel de ${tenant?.name || 'Inquilino'} vence em ${diffDays === 0 ? 'hoje' : diffDays + ' dias'}.`,
        type: 'upcoming',
        date: pay.dueDate,
        paymentId: pay.id
      });
    }
  });

  return alerts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const simulateSendReminder = async (tenantName: string, type: 'email' | 'whatsapp') => {
  // Simulação de delay de rede
  await new Promise(resolve => setTimeout(resolve, 800));
  console.log(`[Notification System] Enviando lembrete via ${type} para ${tenantName}`);
  return true;
};
