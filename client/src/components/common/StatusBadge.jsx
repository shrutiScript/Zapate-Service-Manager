import React from 'react';

export const StatusBadge = ({ status, className = '' }) => {
  const getBadgeStyle = (s = '') => {
    const text = String(s).toLowerCase();
    if (text.includes('ready') || text.includes('completed') || text.includes('active') || text.includes('paid') || text.includes('delivered') || text.includes('in stock')) {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
    if (text.includes('progress') || text.includes('repair') || text.includes('diagnosis')) {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
    if (text.includes('received') || text.includes('approval') || text.includes('waiting') || text.includes('low stock') || text.includes('partial')) {
      return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
    }
    if (text.includes('inactive') || text.includes('cancelled') || text.includes('failed') || text.includes('unpaid') || text.includes('out of stock')) {
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    }
    return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${getBadgeStyle(status)} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status || 'Unknown'}
    </span>
  );
};
