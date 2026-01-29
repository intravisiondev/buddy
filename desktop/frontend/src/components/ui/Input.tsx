import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function Input({ label, error, icon, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary">
            {icon}
          </div>
        )}
        <input
          className={`w-full px-4 py-2.5 ${icon ? 'pl-10' : ''} bg-light-card dark:bg-dark-card border border-light-text-secondary/20 dark:border-dark-border rounded-button text-light-text-primary dark:text-dark-text-primary placeholder:text-light-text-secondary dark:placeholder:text-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-error">{error}</p>
      )}
    </div>
  );
}
