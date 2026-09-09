import React from 'react';

export const Select = ({
  label,
  error,
  options = [],
  className = '',
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="input-group flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={selectId} className="input-label text-xs font-semibold uppercase tracking-wider text-muted">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`input-field w-full rounded-lg border border-border bg-surface-card px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all ${error ? 'border-danger' : ''} ${className}`}
        {...props}
      >
        {options.map((opt) => {
          const value = typeof opt === 'object' ? opt.value : opt;
          const labelText = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={value} value={value}>
              {labelText}
            </option>
          );
        })}
      </select>
      {error && <span className="input-error text-xs text-danger">{error}</span>}
    </div>
  );
};
