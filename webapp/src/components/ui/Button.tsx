import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-button transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95';

  const variantStyles = {
    primary: 'bg-gradient-primary text-white shadow-soft hover:shadow-glow relative overflow-hidden group',
    secondary: 'bg-light-card dark:bg-dark-card border-2 border-primary/20 dark:border-primary/30 text-light-text-primary dark:text-dark-text-primary hover:border-primary/40 dark:hover:border-primary/50 hover:bg-gradient-card dark:hover:bg-gradient-card-dark shadow-soft',
    ghost: 'text-light-text-primary dark:text-dark-text-primary hover:bg-gradient-card dark:hover:bg-gradient-card-dark hover:text-primary',
    success: 'bg-gradient-success text-white shadow-soft hover:shadow-glow-success',
    warning: 'bg-gradient-warning text-white shadow-soft hover:shadow-medium',
    error: 'bg-error text-white shadow-soft hover:shadow-medium hover:bg-error-dark',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
