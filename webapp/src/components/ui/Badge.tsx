import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'accent' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export default function Badge({ children, variant = 'primary', size = 'md', className = '' }: BadgeProps) {
  const variantStyles = {
    primary: 'bg-primary/15 text-primary border-primary/30 shadow-sm backdrop-blur-sm',
    success: 'bg-success/15 text-success-dark dark:text-success border-success/30 shadow-sm backdrop-blur-sm',
    warning: 'bg-warning/15 text-warning-dark dark:text-warning border-warning/30 shadow-sm backdrop-blur-sm',
    error: 'bg-error/15 text-error-dark dark:text-error border-error/30 shadow-sm backdrop-blur-sm',
    accent: 'bg-accent/15 text-accent-dark dark:text-accent border-accent/30 shadow-sm backdrop-blur-sm',
    neutral: 'bg-light-text-secondary/10 dark:bg-dark-text-secondary/10 text-light-text-secondary dark:text-dark-text-secondary border-light-text-secondary/30 dark:border-dark-text-secondary/30 backdrop-blur-sm',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
}
