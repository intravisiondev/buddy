import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className = '', hover = false, onClick }: CardProps) {
  const hoverStyles = hover
    ? 'hover:shadow-strong hover:scale-[1.02] hover:-translate-y-1 cursor-pointer transition-all duration-300 hover:border-primary/30 dark:hover:border-primary/40'
    : 'transition-all duration-300';
  const clickableStyles = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`bg-light-card dark:bg-dark-card backdrop-blur-sm rounded-card shadow-soft border border-transparent ${hoverStyles} ${clickableStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
