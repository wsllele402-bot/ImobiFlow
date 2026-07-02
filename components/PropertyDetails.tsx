
import React, { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MOCK_PROPERTIES, MOCK_TENANTS } from '../constants';
import { PaymentStatus, Owner, Lease, Tenant, AsaasPayment, DocumentFile, Property } from '../types';
import { createAsaasCharge } from '../services/asaasService';
import { dbService } from '../src/services/dbService';

interface PropertyDetailsProps {
  properties?: Property[];
  owners?: Owner[];
  leases?: Lease[];
  tenants?: Tenant[];
  payments?: AsaasPayment[];
  onTerminateLease?: (propertyId: string, exitChecklist?: any[]) => void;
  onAddPayment?: (payment: AsaasPayment) => void;
}

const DEFAULT_CHECKLIST_ITEMS = [
  "Pintura das paredes e teto",
  "Funcionamento de lâmpadas e tomadas",
  "Estado das torneiras e registros (hidráulica)",
  "Integridade de vidros e janelas",
  "Limpeza geral do imóvel",
  "Entrega/Conferência das chaves e controles"
];

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ properties = [], owners = [], leases = [], tenants = [], payments = [], onTerminateLease, onAddPayment }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getPaymentStatus = (payment: any) => {
    const today = new Date().toISOString().split('T')[0];
    if (payment.status === PaymentStatus.RECEIVED) return PaymentStatus.RECEIVED;
    if (payment.status === PaymentStatus.OVERDUE || payment.dueDate < today) return PaymentStatus.OVERDUE;
    return PaymentStatus.PENDING;
  };
  const [isGeneratingCharge, setIsGeneratingCharge] = useState(false);
  
  // Estados para o Modal de Vistoria
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionType, setInspectionType] = useState<'entry' | 'exit' | null>(null);
  const [dynamicItems, setDynamicItems] = useState<string[]>(DEFAULT_CHECKLIST_ITEMS);
  const [newItemText, setNewItemText] = useState('');
  const [checkedItems, setCheckedItems] = useState<Record<number, 'ok' | 'fail' | null>>({});

  const property = useMemo(() => properties.find(p => p.id === id), [id, properties]);
  const activeLease = useMemo(() => (leases || []).find(l => l.propertyId === id && l.active), [id, leases]);
  const tenant = useMemo(() => activeLease ? tenants.find(t => t.id === activeLease.tenantId) : null, [activeLease, tenants]);
  const owner = useMemo(() => property ? owners.find(o => o.id === property.ownerId) : null, [property, owners]);
  
  // Histórico de locações para este imóvel
  const leaseHistory = useMemo(() => (leases || []).filter(l => l.propertyId === id && !l.active).sort((a,b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()), [id, leases]);

  const financialHistory = useMemo(() => {
    const propertyLeasesIds = (leases || []).filter(l => l.propertyId === id).map(l => l.id);
    return payments.filter(p => propertyLeasesIds.includes(p.leaseId))
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  }, [id, leases, payments]);

  const allDocuments = useMemo(() => {
    const docs: DocumentFile[] = [...(property?.documents || [])];
    if (activeLease?.documents) docs.push(...activeLease.documents);
    if (tenant?.documents) docs.push(...tenant.documents);
    return docs;
  }, [property, activeLease, tenant]);

  const images = useMemo(() => {
    const validImages = property?.images?.filter(img => !!img) || [];
    return validImages.length > 0 ? validImages : [`https://picsum.photos/seed/${property?.id}/800/400`];
  }, [property]);

  const handleShare = async () => {
    const url = `${window.location.origin}/#/share/${property?.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: property?.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setNotification({ message: 'Link copiado!', type: 'success' });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) { console.error(err); }
  };

  const handleWhatsAppBilling = (targetTenant: Tenant | null | undefined, payment: AsaasPayment) => {
    if (!targetTenant) return;
    const cleanPhone = targetTenant.phone.replace(/\D/g, '');
    const message = `Olá ${targetTenant.name}, segue o link para pagamento do seu aluguel (${property?.title}) com vencimento em ${payment.dueDate}: ${payment.invoiceUrl || 'Link pendente'}`;
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const setItemStatus = (index: number, status: 'ok' | 'fail') => {
    setCheckedItems(prev => ({ ...prev, [index]: status }));
  };

  const openInspection = (type: 'entry' | 'exit') => {
    setInspectionType(type);
    setCheckedItems({});
    // Se for saída, carrega os itens do contrato ativo para garantir que os mesmos itens sejam avaliados
    if (type === 'exit' && activeLease?.entryChecklist) {
      setDynamicItems(activeLease.entryChecklist.map(i => i.label));
    } else {
      setDynamicItems(DEFAULT_CHECKLIST_ITEMS);
    }
    setShowInspectionModal(true);
  };

  const handleConfirmInspection = () => {
    // Monta o checklist atual
    const checklistData = dynamicItems.map((label, idx) => ({
      label,
      status: checkedItems[idx] as 'ok' | 'fail'
    }));

    if (inspectionType === 'entry') {
      setShowInspectionModal(false);
      // Passa o checklist via state para o formulário de contrato
      navigate(`/leases/new/${property?.id}`, { state: { entryChecklist: checklistData } });
    } else if (inspectionType === 'exit') {
      // Comparação com o checklist de entrada salvo no contrato
      const entryChecklist = activeLease?.entryChecklist;
      if (entryChecklist) {
        const discrepancies = checklistData.filter(exitItem => {
          const entryItem = entryChecklist.find(e => e.label === exitItem.label);
          // Alerta se o item estava OK na entrada e agora falhou na saída
          return entryItem && entryItem.status === 'ok' && exitItem.status === 'fail';
        });

        if (discrepancies.length > 0) {
          const names = discrepancies.map(d => d.label).join(', ');
          alert(`ALERTA DE DIVERGÊNCIA: Os seguintes itens foram entregues OK e agora possuem falhas: ${names}`);
        }
      }
      
      setShowInspectionModal(false);
      onTerminateLease?.(property!.id, checklistData); // Passa o checklist para salvar no histórico
    }
    setInspectionType(null);
  };

  const handleAddItem = () => {
    if (newItemText.trim()) {
      setDynamicItems([...dynamicItems, newItemText.trim()]);
      setNewItemText('');
    }
  };

  const handleRemoveItem = (index: number) => {
    setDynamicItems(dynamicItems.filter((_, i) => i !== index));
    setCheckedItems({});
  };

  if (!property) return null;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-16">
      {notification && (
        <div className={`fixed top-4 right-4 md:top-20 md:right-8 z-50 p-4 rounded-xl shadow-2xl border ${notification.type === 'success' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-red-600 border-red-400 text-white'}`}>
          <div className="flex items-center gap-3"><i className="fas fa-info-circle"></i><p className="text-sm font-bold">{notification.message}</p></div>
        </div>
      )}

      {/* Modal de Vistoria */}
      {showInspectionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border dark:border-gray-800">
            <div className="p-6 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-white">
                  {inspectionType === 'entry' ? 'Vistoria de Entrada' : 'Vistoria de Saída'}
                </h3>
                <p className="text-[10px] font-bold text-indigo-500 uppercase mt-1">Checklist Dinâmico</p>
              </div>
              <button onClick={() => setShowInspectionModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><i className="fas fa-times"></i></button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto scrollbar-hide">
              {dynamicItems.map((item, idx) => (
                <div key={idx} className="group flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl transition-colors border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30">
                  <div className="flex-1 min-w-0 pr-2">
                    <span className={`text-[10px] font-bold uppercase block truncate ${checkedItems[idx] ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      {item}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setItemStatus(idx, 'ok')}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${checkedItems[idx] === 'ok' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 hover:bg-emerald-100'}`}
                    >
                      <i className="fas fa-check text-[10px]"></i>
                    </button>
                    <button 
                      onClick={() => setItemStatus(idx, 'fail')}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${checkedItems[idx] === 'fail' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 hover:bg-red-100'}`}
                    >
                      <i className="fas fa-times text-[10px]"></i>
                    </button>
                    <button 
                      onClick={() => handleRemoveItem(idx)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all ml-1"
                      title="Remover Item"
                    >
                      <i className="fas fa-trash-alt text-[10px]"></i>
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Opção para adicionar novo item */}
              <div className="pt-2">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Novo item de vistoria..." 
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                    className="flex-1 p-3 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <button 
                    onClick={handleAddItem}
                    className="bg-indigo-600 text-white px-4 rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-800">
              <button 
                onClick={handleConfirmInspection}
                disabled={Object.keys(checkedItems).length < dynamicItems.length || dynamicItems.length === 0}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:grayscale"
              >
                {dynamicItems.length === 0 
                  ? 'Adicione itens ao checklist'
                  : Object.keys(checkedItems).length < dynamicItems.length 
                    ? `Faltam ${dynamicItems.length - Object.keys(checkedItems).length} avaliações` 
                    : 'Finalizar Vistoria e Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Cover Section */}
      <div className="relative h-64 md:h-[400px] rounded-[40px] overflow-hidden shadow-2xl group border-4 border-white dark:border-gray-800">
        <img 
          src={images[0]} 
          alt={property.title} 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          loading="eager"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
          <div className="space-y-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-md text-white border border-white/30`}>
              {property.type}
            </span>
            <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter drop-shadow-lg">{property.title}</h1>
            <p className="text-xs md:text-sm text-white/80 font-bold flex items-center gap-2">
              <i className="fas fa-map-marker-alt text-indigo-400"></i> {property.address}
            </p>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Valor Mensal</p>
            <p className="text-3xl font-black text-white tracking-tight">R$ {formatCurrency(property.price)}</p>
          </div>
        </div>

        <div className="absolute top-6 right-6 flex gap-2">
          <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest backdrop-blur-xl border ${
            property.status === 'available' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
            property.status === 'rented' ? 'bg-red-500/20 border-red-500/30 text-red-400' :
            'bg-amber-500/20 border-amber-500/30 text-amber-400'
          }`}>
            {property.status === 'available' ? 'Disponível' : property.status === 'rented' ? 'Alugado' : 'Manutenção'}
          </span>
        </div>
      </div>

      {/* Header (Simplified since hero has info) */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <Link to="/properties" className="p-3 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"><i className="fas fa-arrow-left text-gray-600 dark:text-gray-400"></i></Link>
          <div className="md:hidden">
            <h2 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tighter leading-none">{property.title}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button onClick={handleShare} className="flex-1 md:flex-none px-4 py-3 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-2"><i className="fas fa-share-alt text-blue-500"></i> Compartilhar</button>
          <Link to={`/properties/edit/${property.id}`} className="flex-1 md:flex-none px-4 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"><i className="fas fa-edit"></i> Editar</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        <div className="lg:col-span-8 space-y-6 md:space-y-8">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {images.map((img, idx) => (<div key={idx} className="aspect-video rounded-xl md:rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 bg-gray-100 dark:bg-gray-800"><img src={img} loading="lazy" className="w-full h-full object-cover" /></div>))}
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6 transition-all">
            <div><h3 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">Sobre este imóvel</h3><p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{property.description || "Sem descrição disponível."}</p></div>
          </div>

          {/* Central de Documentos / GED */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-all">
             <div className="p-5 md:p-6 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex justify-between items-center">
                <div className="flex items-center gap-3"><div className="w-1.5 h-5 bg-indigo-500 rounded-full"></div><h3 className="text-[10px] font-black text-gray-800 dark:text-white uppercase tracking-widest">Pasta Digital</h3></div>
                <span className="text-[8px] font-black text-gray-400 uppercase">{allDocuments.length} arquivos</span>
             </div>
             <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {allDocuments.length > 0 ? allDocuments.map(doc => (
                  <div key={doc.id} className="group p-3 md:p-4 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 hover:border-indigo-100 dark:hover:border-indigo-900/50 hover:bg-white dark:hover:bg-gray-700 rounded-2xl transition-all flex items-center justify-between shadow-sm">
                     <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${doc.type === 'contract' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'}`}><i className="fas fa-file-alt"></i></div>
                        <div className="min-w-0">
                           <p className="text-[10px] md:text-xs font-black text-gray-800 dark:text-gray-200 truncate leading-tight">{doc.name}</p>
                           <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">{new Date(doc.uploadDate).toLocaleDateString('pt-BR')}</p>
                        </div>
                     </div>
                     <button onClick={async () => {
                       const link = await dbService.getSignedUrl('documents', doc.url);
                       if (link) window.open(link, '_blank');
                       else setNotification({ message: 'Não foi possível abrir o documento. Tente novamente.', type: 'error' });
                     }} className="p-2 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg transition-all"><i className="fas fa-eye"></i></button>
                  </div>
                )) : <div className="col-span-full py-10 text-center text-gray-300 dark:text-gray-600 uppercase text-[9px] font-black tracking-widest">Nenhum documento</div>}
             </div>
          </div>

          {!activeLease ? (
            <div className="bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between shadow-sm gap-4">
              <div className="flex items-center gap-4 text-center sm:text-left"><div className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center flex-shrink-0"><i className="fas fa-key"></i></div><div><h3 className="font-black text-amber-900 dark:text-amber-400 uppercase text-[10px] tracking-widest">Status: Disponível</h3><p className="text-[10px] text-amber-800/80 dark:text-amber-300/80 mt-1">Pronto para locar.</p></div></div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={() => navigate(`/properties/${property.id}/schedule`)} className="flex-1 sm:flex-none bg-white dark:bg-gray-800 text-indigo-600 border border-indigo-100 dark:border-indigo-900/30 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-indigo-50 transition-all">Agendar Visita</button>
                <button onClick={() => openInspection('entry')} className="flex-1 sm:flex-none bg-amber-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-amber-700 transition-all">Alugar Agora</button>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border-l-4 border-emerald-500 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between shadow-sm gap-4">
              <div className="flex items-center gap-4 text-center sm:text-left"><div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center flex-shrink-0"><i className="fas fa-check"></i></div><div><h3 className="font-black text-emerald-900 dark:text-emerald-400 uppercase text-[10px] tracking-widest">Contrato Ativo</h3><p className="text-xs font-black text-emerald-800 dark:text-emerald-300 mt-1 truncate max-w-[150px]">{tenant?.name}</p></div></div>
              <button onClick={() => openInspection('exit')} className="w-full sm:w-auto bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all">Encerrar</button>
            </div>
          )}

          {/* Histórico de Vistorias / Locações */}
          {leaseHistory.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-all">
               <div className="p-5 md:p-6 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex justify-between items-center">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-5 bg-amber-500 rounded-full"></div><h3 className="text-[10px] font-black text-gray-800 dark:text-white uppercase tracking-widest">Histórico de Vistorias</h3></div>
                  <i className="fas fa-history text-amber-400"></i>
               </div>
               <div className="p-4 md:p-6 space-y-4">
                  {leaseHistory.map(l => (
                    <div key={l.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border dark:border-gray-700">
                       <div className="flex justify-between items-start mb-3">
                          <div>
                             <p className="text-[10px] font-black text-gray-800 dark:text-gray-200 uppercase">{tenants.find(t=>t.id === l.tenantId)?.name}</p>
                             <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">Período: {new Date(l.startDate).toLocaleDateString('pt-BR')} até {new Date(l.endDate).toLocaleDateString('pt-BR')}</p>
                          </div>
                          <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-500 rounded text-[7px] font-black uppercase">Finalizado</span>
                       </div>
                       <div className="grid grid-cols-2 gap-4 pt-3 border-t dark:border-gray-700">
                          <div>
                             <p className="text-[8px] font-black text-indigo-500 uppercase mb-1">Vistoria de Entrada</p>
                             <div className="flex gap-1 flex-wrap">
                                {l.entryChecklist?.map((item, idx) => (
                                  <div key={idx} className={`w-2 h-2 rounded-full ${item.status === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}`} title={item.label}></div>
                                ))}
                             </div>
                          </div>
                          <div>
                             <p className="text-[8px] font-black text-amber-500 uppercase mb-1">Vistoria de Saída</p>
                             <div className="flex gap-1 flex-wrap">
                                {l.exitChecklist ? l.exitChecklist.map((item, idx) => (
                                  <div key={idx} className={`w-2 h-2 rounded-full ${item.status === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}`} title={item.label}></div>
                                )) : <span className="text-[7px] text-gray-400 uppercase italic">Não realizada</span>}
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-all">
             <div className="p-5 md:p-6 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex justify-between items-center">
               <h3 className="text-[10px] font-black text-gray-800 dark:text-white uppercase tracking-widest">Faturamento</h3>
               <div className="flex gap-2">
                 <button onClick={() => navigate('/finance/new')} className="text-[9px] font-black text-indigo-600 uppercase hover:underline">+ Nova Parcela</button>
                 <i className="fas fa-money-check-alt text-indigo-400"></i>
               </div>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left text-xs min-w-[500px]"><thead><tr className="bg-gray-50 dark:bg-gray-800 text-[9px] font-black uppercase text-gray-400"><th className="px-6 py-3">Mês</th><th className="px-6 py-3">Valor</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Ações</th></tr></thead><tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {financialHistory.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">{p.dueDate.split('-')[1]}/{p.dueDate.split('-')[0]}</td>
                      <td className="px-6 py-4 font-black dark:text-white">R$ {formatCurrency(p.amount + (p.interest || 0))}</td>
                      <td className="px-6 py-4">
                        {(() => {
                          const currentStatus = getPaymentStatus(p);
                          return (
                            <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${currentStatus === PaymentStatus.RECEIVED ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : currentStatus === PaymentStatus.OVERDUE ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                              {currentStatus === PaymentStatus.RECEIVED ? 'RECEBIDO' : currentStatus === PaymentStatus.OVERDUE ? 'ATRASADO' : 'PENDENTE'}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => navigate(`/finance/edit/${p.id}`)} className="text-indigo-400 hover:text-indigo-600 p-1.5 rounded-lg transition-colors" title="Editar Parcela">
                            <i className="fas fa-edit"></i>
                          </button>
                          {p.status !== 'RECEIVED' ? <button onClick={() => handleWhatsAppBilling(tenant, p)} className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 transition-all"><i className="fab fa-whatsapp"></i></button> : <i className="fas fa-check text-emerald-600"></i>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all">
             <h4 className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest flex items-center gap-2"><i className="fas fa-user-tie"></i> Proprietário</h4>
             {owner ? (
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-lg">{owner.name.charAt(0)}</div>
                 <div className="min-w-0">
                   <p className="text-xs font-black text-gray-800 dark:text-gray-200 truncate">{owner.name}</p>
                   <p className="text-[9px] text-gray-400 font-bold">{owner.phone}</p>
                 </div>
               </div>
             ) : <p className="text-xs text-gray-400 italic text-[10px] uppercase font-bold">Nenhum vínculo</p>}
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all">
             <h4 className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest flex items-center gap-2"><i className="fas fa-coins"></i> Finanças</h4>
             <div className="space-y-4">
                <div className="flex justify-between items-end pb-3 border-b border-gray-50 dark:border-gray-800"><span className="text-[10px] font-black text-gray-500 uppercase">Aluguel</span><span className="text-base md:text-lg font-black text-indigo-600 dark:text-indigo-400">R$ {formatCurrency(property.price)}</span></div>
                {property.iptu ? <div className="flex justify-between items-end pb-3 border-b border-gray-50 dark:border-gray-800"><span className="text-[10px] font-black text-gray-500 uppercase">IPTU</span><span className="text-xs font-black text-gray-600 dark:text-gray-400">R$ {formatCurrency(property.iptu)}</span></div> : null}
                {property.condo ? <div className="flex justify-between items-end pb-3 border-b border-gray-50 dark:border-gray-800"><span className="text-[10px] font-black text-gray-500 uppercase">Condomínio</span><span className="text-xs font-black text-gray-600 dark:text-gray-400">R$ {formatCurrency(property.condo)}</span></div> : null}
                <div className="flex justify-between items-end"><span className="text-[10px] font-black text-gray-500 uppercase">Anual (Est.)</span><span className="text-xs md:text-sm font-black text-emerald-600 dark:text-emerald-400">R$ {formatCurrency((property.price + (property.iptu || 0) + (property.condo || 0)) * 12)}</span></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
