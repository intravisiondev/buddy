interface ProgressDonutProps {
  value: number; // 0-100
  size?: number; // px
  strokeWidth?: number;
  label?: string;
}

export default function ProgressDonut({ value, size = 120, strokeWidth = 12, label }: ProgressDonutProps) {
  const v = Math.max(0, Math.min(100, value));
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - v / 100);

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className="text-light-border dark:text-dark-border"
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className="text-light-primary dark:text-dark-primary"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="fill-light-text-primary dark:fill-dark-text-primary"
          style={{ fontSize: 22, fontWeight: 700 }}
        >
          {Math.round(v)}%
        </text>
      </svg>
      {label && (
        <div className="mt-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
          {label}
        </div>
      )}
    </div>
  );
}

