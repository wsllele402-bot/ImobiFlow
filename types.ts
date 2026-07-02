
export enum PropertyType {
  KITNET = 'Kitnet',
  CASA = 'Casa',
  APARTAMENTO = 'Apartamento',
  GALPAO = 'Galpão'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED',
  OVERDUE = 'OVERDUE'
}

export enum ExpenseCategory {
  MAINTENANCE = 'Manutenção',
  TAX = 'Impostos/IPTU',
  UTILITIES = 'Utilidades (Água/Luz)',
  ADMIN = 'Taxas Adm',
  INSURANCE = 'Seguro',
  CLEANING = 'Limpeza',
  DEPOSIT_REFUND = 'Devolução Calção',
  GIGANTE_ONLINE = 'Gigante Online',
  FUEL = 'Combustivel',
  OTHER = 'Outros'
}

export interface User {
  id: string;
  name: string;
  email: string;
  document?: string; // Campo para CPF/CNPJ
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  subscriptionActive: boolean;
}

export interface DocumentFile {
  id: string;
  name: string;
  url: string;
  type: 'contract' | 'iptu' | 'id' | 'other' | 'image';
  uploadDate: string;
  size?: string;
}

export interface Owner {
  id: string;
  userId: string; // Vínculo com o usuário
  name: string;
  email: string;
  phone: string;
  pixKey?: string;
  pixType?: 'CPF' | 'CNPJ' | 'Email' | 'Telefone' | 'Aleatória';
}

export interface Tenant {
  id: string;
  userId: string; // Vínculo com o usuário
  name: string;
  email: string;
  phone: string;
  document?: string; // CPF/CNPJ do inquilino
  asaasId?: string;
  notes?: string; // Observações sobre o inquilino
  documents?: DocumentFile[];
}

export interface Property {
  id: string;
  userId: string; // Vínculo com o usuário
  title: string;
  type: PropertyType;
  address: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;
  area?: number;
  iptu?: number;
  condo?: number;
  ownerId: string;
  status: 'available' | 'rented' | 'maintenance';
  description?: string;
  rentalRules?: string;
  images?: string[];
  documents?: DocumentFile[];
}

export interface Lease {
  id: string;
  userId: string; // Vínculo com o usuário
  propertyId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  dueDay: number;
  active: boolean;
  deposit?: number; // Valor da caução
  contractUrl?: string;
  documents?: DocumentFile[];
  entryChecklist?: { label: string; status: 'ok' | 'fail' }[]; 
  exitChecklist?: { label: string; status: 'ok' | 'fail' }[]; // Novo campo para salvar vistoria de saída
}

export interface AsaasPayment {
  id: string;
  userId: string; // Vínculo com o usuário
  leaseId: string;
  tenantId: string;
  amount: number;
  interest?: number; // Campo de juros
  dueDate: string;
  status: PaymentStatus;
  invoiceUrl?: string;
}

export interface Expense {
  id: string;
  userId: string; // Vínculo com o usuário
  propertyId?: string;
  ownerId: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  description: string;
}

export interface Maintenance {
  id: string;
  propertyId: string;
  description: string;
  startDate: string;
  endDate?: string;
  cost: number;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface InspectionItem {
  id: string;
  label: string;
  status: 'ok' | 'fail' | null;
}

export interface Visit {
  id: string;
  userId: string;
  propertyId: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}
