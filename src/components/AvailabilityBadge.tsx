import React from 'react';
import type { AvailabilityStatus } from '../types';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

interface Props {
  status: AvailabilityStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const AvailabilityBadge: React.FC<Props> = ({ status, size = 'md', showIcon = true }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs sm:text-sm px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  if (status === 'disponivel') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs ${sizeClasses[size]}`}
      >
        {showIcon && <CheckCircle2 size={iconSizes[size]} className="text-emerald-500 shrink-0" />}
        <span>Disponível</span>
      </span>
    );
  }

  if (status === 'indisponivel') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs ${sizeClasses[size]}`}
      >
        {showIcon && <XCircle size={iconSizes[size]} className="text-rose-500 shrink-0" />}
        <span>Indisponível</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 shadow-xs ${sizeClasses[size]}`}
    >
      {showIcon && <Clock size={iconSizes[size]} className="text-amber-500 shrink-0" />}
      <span>Pendente</span>
    </span>
  );
};
