interface Props {
  days: number;
  maxDays: number;
  size?: number;
}

export default function CountdownRing({ days, maxDays, size = 48 }: Props) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, Math.max(0, 1 - days / maxDays));
  const offset = circumference * (1 - progress);

  const isUrgent = days <= 7;
  const isWarning = days <= 30;
  const color = isUrgent ? 'hsl(0, 72%, 55%)' : isWarning ? 'hsl(38, 92%, 55%)' : 'hsl(152, 60%, 42%)';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(222, 40%, 16%)"
          strokeWidth={3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
          style={{
            filter: isUrgent ? `drop-shadow(0 0 4px ${color})` : undefined,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-mono font-bold text-foreground tabular-nums">{days}d</span>
      </div>
    </div>
  );
}
