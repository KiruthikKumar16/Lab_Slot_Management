import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hover = true }) => {
  return (
    <div
      className={`
        bg-white/60 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl
        ${hover ? 'hover:shadow-2xl hover:bg-white/70 hover:-translate-y-1' : ''}
        transition-all duration-500 ease-out
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassCard;