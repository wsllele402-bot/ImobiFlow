
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Property, PropertyType } from '../types';

interface PropertyCardProps {
  property: Property;
  onEdit?: (p: Property) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (p: Property) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onEdit, onDelete, onDuplicate }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = (property.images && property.images.filter(img => !!img).length > 0) 
    ? property.images.filter(img => !!img) 
    : [`https://picsum.photos/seed/${property.id}/400/200`];

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getBadgeColor = (type: PropertyType) => {
    switch (type) {
      case PropertyType.KITNET: return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case PropertyType.CASA: return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case PropertyType.APARTAMENTO: return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case PropertyType.GALPAO: return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      default: return 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rented': return 'text-red-500 dark:text-red-400';
      case 'available': return 'text-emerald-600 dark:text-emerald-400';
      case 'maintenance': return 'text-amber-600 dark:text-amber-400';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="glass-card rounded-[32px] overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 group border-gray-200 dark:border-white/5">
      <div className="relative h-56 overflow-hidden">
        <img 
          src={images[currentImageIndex]} 
          alt={property.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 dark:block hidden" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent opacity-60 dark:hidden block" />

        {images.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/80 dark:bg-black/40 backdrop-blur-md hover:bg-white dark:hover:bg-black/60 text-gray-900 dark:text-white rounded-full transition-all opacity-0 group-hover:opacity-100 border border-gray-200 dark:border-white/10 shadow-lg"
            >
              <i className="fas fa-chevron-left text-xs"></i>
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/80 dark:bg-black/40 backdrop-blur-md hover:bg-white dark:hover:bg-black/60 text-gray-900 dark:text-white rounded-full transition-all opacity-0 group-hover:opacity-100 border border-gray-200 dark:border-white/10 shadow-lg"
            >
              <i className="fas fa-chevron-right text-xs"></i>
            </button>
          </>
        )}

        <span className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getBadgeColor(property.type)} backdrop-blur-md`}>
          {property.type}
        </span>
        
        <div className="absolute top-4 right-4 flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-all md:translate-y-2 md:group-hover:translate-y-0 opacity-100 translate-y-0">
           <button 
             onClick={(e) => {
               e.preventDefault();
               e.stopPropagation();
               const url = `${window.location.origin}/#/share/${property.id}`;
               if (navigator.share) {
                 navigator.share({ title: property.title, url });
               } else {
                 navigator.clipboard.writeText(url);
                 alert('Link copiado!');
               }
             }}
             className="bg-indigo-500/20 backdrop-blur-md p-2.5 rounded-xl text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all border border-indigo-500/20"
             title="Compartilhar"
           >
             <i className="fas fa-share-alt text-xs"></i>
           </button>
           <button 
             onClick={() => onDelete?.(property.id)}
             className="bg-red-500/20 backdrop-blur-md p-2.5 rounded-xl text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
             title="Excluir Imóvel"
           >
             <i className="fas fa-trash-alt text-xs"></i>
           </button>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-bold text-xl text-gray-900 dark:text-white tracking-tight truncate flex-1">{property.title}</h4>
          <span className={`text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-widest ${getStatusColor(property.status)}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${property.status === 'available' ? 'bg-emerald-400' : property.status === 'rented' ? 'bg-red-400' : 'bg-amber-400'}`}></span>
            {property.status === 'available' ? 'Disponível' : property.status === 'rented' ? 'Alugado' : 'Manutenção'}
          </span>
        </div>

        <p className="text-gray-500 text-sm mb-6 flex items-center font-medium">
          <i className="fas fa-map-marker-alt mr-2 text-indigo-500 dark:text-indigo-400/60"></i> {property.address}
        </p>

        <div className="flex items-center gap-6 mb-8 py-4 border-y border-gray-200 dark:border-white/5">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Quartos</span>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-bold">
              <i className="fas fa-bed text-indigo-500 dark:text-indigo-400/40"></i> {property.bedrooms || 0}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Banheiros</span>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-bold">
              <i className="fas fa-bath text-indigo-500 dark:text-indigo-400/40"></i> {property.bathrooms || 0}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Área</span>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-bold">
              <i className="fas fa-expand-arrows-alt text-indigo-500 dark:text-indigo-400/40"></i> {property.area || 0}m²
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Valor Mensal</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">R$ {formatCurrency(property.price)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Link 
            to={`/properties/${property.id}`}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all text-center shadow-lg shadow-indigo-600/20"
          >
            Ver Detalhes
          </Link>
          <div className="flex gap-2">
            <button 
              onClick={() => onEdit?.(property)}
              className="p-3.5 bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-all"
              title="Editar"
            >
              <i className="fas fa-edit"></i>
            </button>
            <button 
              onClick={() => onDuplicate?.(property)}
              className="p-3.5 bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-all"
              title="Duplicar"
            >
              <i className="fas fa-copy"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;