interface ProgressBarProps {
  progress: number;
  variant?: 'primary' | 'success' | 'warning' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function ProgressBar({
  progress,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  className = '',
}: ProgressBarProps) {
  const variantColors = {
    primary: 'bg-gradient-primary shadow-soft',
    success: 'bg-gradient-success shadow-soft',
    warning: 'bg-gradient-warning shadow-soft',
    accent: 'bg-gradient-accent shadow-soft',
  };

  const sizeStyles = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between mb-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
          <span className="font-medium">Progress</span>
          <span className="font-semibold">{clampedProgress}%</span>
        </div>
      )}
      <div className={`w-full bg-light-bg dark:bg-dark-bg rounded-full overflow-hidden ${sizeStyles[size]} border border-light-text-secondary/10 dark:border-dark-border`}>
        <div
          className={`${variantColors[variant]} ${sizeStyles[size]} rounded-full transition-all duration-500 ease-out relative overflow-hidden`}
          style={{ width: `${clampedProgress}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
