
import { PropertyType, Owner, Tenant, Property, Lease, PaymentStatus, AsaasPayment, Maintenance, Visit } from './types';

export const MOCK_OWNERS: Owner[] = [
  // Fix: Add missing userId to Owner objects
  { id: 'o1', userId: 'mock-user-id', name: 'João Silva', email: 'joao@proprietario.com', phone: '(11) 98888-7777' },
  { id: 'o2', userId: 'mock-user-id', name: 'Maria Santos', email: 'maria@proprietario.com', phone: '(11) 97777-6666' }
];

export const MOCK_TENANTS: Tenant[] = [
  // Fix: Add missing userId to Tenant objects
  { id: 't1', userId: 'mock-user-id', name: 'Carlos Oliveira', email: 'carlos@inquilino.com', phone: '(11) 91111-2222', asaasId: 'cus_0001' },
  { id: 't2', userId: 'mock-user-id', name: 'Ana Pereira', email: 'ana@inquilino.com', phone: '(11) 93333-4444', asaasId: 'cus_0002' }
];

export const MOCK_PROPERTIES: Property[] = [
  { 
    id: 'p1', 
    // Fix: Add missing userId to Property objects
    userId: 'mock-user-id',
    title: 'Kitnet Central A1', 
    type: PropertyType.KITNET, 
    address: 'Rua das Flores, 123', 
    price: 1200, 
    ownerId: 'o1', 
    status: 'rented',
    description: 'Excelente kitnet mobiliada próxima ao metrô. Ideal para estudantes ou profissionais solteiros.',
    rentalRules: '1. Proibido animais de estimação.\n2. Horário de silêncio após as 22h.\n3. Máximo de 1 ocupante.',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80'
    ]
  },
  { 
    id: 'p2', 
    // Fix: Add missing userId to Property objects
    userId: 'mock-user-id',
    title: 'Casa de Verão com Piscina', 
    type: PropertyType.CASA, 
    address: 'Av. Litorânea, 500', 
    price: 3500, 
    ownerId: 'o1', 
    status: 'available',
    description: 'Linda casa de praia com piscina privativa e churrasqueira. Pé na areia.',
    rentalRules: '1. Permitido pets de pequeno porte.\n2. Proibido festas com som alto.\n3. Caução de 3 meses obrigatória.',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80'
    ]
  },
  { 
    id: 'p3', 
    // Fix: Add missing userId to Property objects
    userId: 'mock-user-id',
    title: 'Apto Vista Mar - Loft', 
    type: PropertyType.APARTAMENTO, 
    address: 'Rua Marítima, 10', 
    price: 2800, 
    ownerId: 'o2', 
    status: 'rented',
    description: 'Loft moderno com vista panorâmica para o mar. Prédio com infraestrutura completa.',
    rentalRules: '1. Vaga de garagem inclusa.\n2. Limpeza semanal disponível por taxa extra.\n3. Contrato mínimo de 12 meses.',
    images: [
      'https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=800&q=80'
    ]
  },
  { 
    id: 'p4', 
    // Fix: Add missing userId to Property objects
    userId: 'mock-user-id',
    title: 'Galpão Industrial X3', 
    type: PropertyType.GALPAO, 
    address: 'Rodovia Anhanguera, KM 20', 
    price: 15000, 
    ownerId: 'o2', 
    status: 'maintenance',
    description: 'Galpão com pé direito duplo, entrada para caminhões e área administrativa.',
    rentalRules: '1. Manutenção preventiva de telhado inclusa.\n2. Seguro contra incêndio obrigatório.\n3. Possibilidade de expansão.',
    images: [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80'
    ]
  }
];

export const MOCK_LEASES: Lease[] = [
  // Fix: Add missing userId to Lease objects
  { id: 'l1', userId: 'mock-user-id', propertyId: 'p1', tenantId: 't1', startDate: '2023-01-01', endDate: '2024-01-01', monthlyRent: 1200, dueDay: 5, active: true },
  { id: 'l2', userId: 'mock-user-id', propertyId: 'p3', tenantId: 't2', startDate: '2023-05-15', endDate: '2024-05-15', monthlyRent: 2800, dueDay: 10, active: true }
];

export const MOCK_PAYMENTS: AsaasPayment[] = [
  // Fix: Add missing userId to AsaasPayment objects
  { id: 'pay1', userId: 'mock-user-id', leaseId: 'l1', tenantId: 't1', amount: 1200, dueDate: '2024-05-05', status: PaymentStatus.RECEIVED, invoiceUrl: 'https://asaas.com/i/123' },
  { id: 'pay2', userId: 'mock-user-id', leaseId: 'l1', tenantId: 't1', amount: 1200, dueDate: '2024-06-05', status: PaymentStatus.PENDING, invoiceUrl: 'https://asaas.com/i/456' },
  { id: 'pay3', userId: 'mock-user-id', leaseId: 'l2', tenantId: 't2', amount: 2800, dueDate: '2024-06-15', status: PaymentStatus.OVERDUE, invoiceUrl: 'https://asaas.com/i/789' }
];

export const MOCK_MAINTENANCE: Maintenance[] = [
  { id: 'm1', propertyId: 'p1', description: 'Reparo hidráulico no banheiro', startDate: '2023-03-10', endDate: '2023-03-12', cost: 350, status: 'completed' },
  { id: 'm2', propertyId: 'p1', description: 'Pintura de teto e paredes', startDate: '2023-12-20', endDate: '2023-12-23', cost: 1200, status: 'completed' },
  { id: 'm3', propertyId: 'p4', description: 'Revisão elétrica industrial', startDate: '2024-05-20', cost: 2500, status: 'in_progress' },
  { id: 'm4', propertyId: 'p4', description: 'Troca de telhas cerâmicas', startDate: '2024-06-01', cost: 4500, status: 'pending' }
];

export const MOCK_VISITS: Visit[] = [
  {
    id: 'v1',
    userId: 'mock-user-id',
    propertyId: 'p2',
    visitorName: 'Ricardo Almeida',
    visitorEmail: 'ricardo@email.com',
    visitorPhone: '(11) 95555-4444',
    date: '2024-06-15',
    time: '14:00',
    status: 'pending'
  },
  {
    id: 'v2',
    userId: 'mock-user-id',
    propertyId: 'p2',
    visitorName: 'Juliana Costa',
    visitorEmail: 'juliana@email.com',
    visitorPhone: '(11) 96666-5555',
    date: '2024-06-16',
    time: '10:30',
    status: 'confirmed'
  }
];
