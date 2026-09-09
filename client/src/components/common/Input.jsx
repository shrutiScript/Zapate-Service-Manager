import React from 'react';

export const Input = ({
  label,
  error,
  icon: Icon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="input-group flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="input-label text-xs font-semibold uppercase tracking-wider text-muted">
          {label}
        </label>
      )}
      <div className="input-wrapper relative flex items-center">
        {Icon && (
          <div className="input-icon-left absolute left-3 text-muted pointer-events-none">
            <Icon size={16} />
          </div>
        )}
        <input
          id={inputId}
          className={`input-field w-full rounded-lg border border-border bg-surface-card px-3.5 py-2 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all ${Icon ? 'pl-9' : ''} ${error ? 'border-danger focus:border-danger focus:ring-danger' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="input-error text-xs text-danger">{error}</span>}
    </div>
  );
};
