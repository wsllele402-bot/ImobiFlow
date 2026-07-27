import React from 'react';
import { useParams, Link } from 'react-router-dom';

// Página pública de apresentação de imóvel — em reconstrução.
// Será refeita de forma segura (mostrando só o imóvel escolhido, sem expor
// dados do proprietário) numa próxima etapa.
const PropertyPresentation: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ fontSize: 44 }}>🏠</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Página em atualização</h1>
      <p style={{ color: '#6b7280', maxWidth: 420, margin: 0 }}>
        A apresentação pública deste imóvel está sendo reformulada e voltará em breve.
      </p>
      <Link to="/" style={{ color: '#4f46e5', fontWeight: 700, textDecoration: 'none' }}>Voltar ao início</Link>
    </div>
  );
};

export default PropertyPresentation;
