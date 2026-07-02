
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  light?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = '', showText = true, size = 'md', light }) => {
  const sizeMap = {
    sm: 'h-6',
    md: 'h-10',
    lg: 'h-16',
    xl: 'h-24'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeMap[size]} aspect-square`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
          {/* Hexágono de Fundo */}
          <path d="M50 5L89 27.5V72.5L50 95L11 72.5V27.5L50 5Z" className="fill-gray-100 dark:fill-white/10" />
          
          {/* Estrutura do Prédio (Indigo) */}
          <rect x="30" y="40" width="15" height="35" rx="2" fill="#4F46E5" />
          <rect x="50" y="30" width="15" height="45" rx="2" fill="#4338CA" />
          
          {/* Linha de Fluxo (Verde) */}
          <path d="M20 75C20 75 35 65 50 65C65 65 80 55 80 55" stroke="#10B981" strokeWidth="6" strokeLinecap="round" />
          <path d="M74 55L80 55L80 61" stroke="#10B981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Detalhe de Brilho */}
          <circle cx="70" cy="25" r="5" fill="#10B981" className="animate-pulse" />
        </svg>
      </div>
      
      {showText && (
        <div className={`${textSizes[size]} font-black tracking-tighter flex items-center`}>
          <span className="text-indigo-900 dark:text-white">Imobi</span>
          <span className="text-emerald-500 font-medium">Flow</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
