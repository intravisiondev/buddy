import { X } from 'lucide-react';
import { useEffect } from 'react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full ${sizeClasses[size]} bg-light-card dark:bg-dark-card rounded-2xl shadow-2xl border border-light-border/60 dark:border-dark-border max-h-[90vh] overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card">
          <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
            {title}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-light-card dark:bg-dark-card">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
