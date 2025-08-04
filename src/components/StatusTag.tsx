import React from 'react';

interface StatusTagProps {
  status: string;
  className?: string;
}

const StatusTag: React.FC<StatusTagProps> = ({ status, className = '' }) => {
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-emerald-100/80 text-emerald-700 border-emerald-200';
      case 'booked':
        return 'bg-blue-100/80 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-green-100/80 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-100/80 text-red-700 border-red-200';
      case 'no-show':
        return 'bg-orange-100/80 text-orange-700 border-orange-200';
      case 'full':
        return 'bg-gray-100/80 text-gray-700 border-gray-200';
      case 'closed':
        return 'bg-slate-100/80 text-slate-700 border-slate-200';
      default:
        return 'bg-gray-100/80 text-gray-700 border-gray-200';
    }
  };

  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border
        backdrop-blur-sm transition-all duration-300
        ${getStatusStyle(status)} ${className}
      `}
    >
      {status}
    </span>
  );
};

export default StatusTag;