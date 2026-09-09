import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  icon: Icon,
  ...props
}) => {
  const baseClasses = 'btn inline-flex items-center justify-center gap-2 font-medium transition-all rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantMap = {
    primary: 'btn-primary bg-accent text-white hover:brightness-110 shadow-sm',
    secondary: 'btn-secondary bg-surface-card border border-border text-foreground hover:bg-surface-elevated',
    outline: 'btn-outline border border-border text-foreground hover:bg-surface-elevated',
    danger: 'btn-danger bg-danger text-white hover:brightness-110',
    ghost: 'btn-ghost text-muted hover:text-foreground hover:bg-surface-elevated',
  };

  const sizeMap = {
    sm: 'text-xs px-2.5 py-1.5 h-8',
    md: 'text-sm px-3.5 py-2 h-9',
    lg: 'text-base px-5 py-2.5 h-11',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${variantMap[variant] || variantMap.primary} ${sizeMap[size] || sizeMap.md} ${className}`}
      {...props}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
};
