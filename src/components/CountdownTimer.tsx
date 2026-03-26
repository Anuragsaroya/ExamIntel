import { useEffect, useState } from "react";

interface Props {
  targetDate: string;
  compact?: boolean;
}

export default function CountdownTimer({ targetDate, compact }: Props) {
  const [timeLeft, setTimeLeft] = useState(calcTimeLeft());

  function calcTimeLeft() {
    const diff = new Date(targetDate).getTime() - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  }

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (compact) {
    return (
      <span className="font-mono text-sm font-bold tabular-nums text-primary">
        {timeLeft.d}d {timeLeft.h}h {timeLeft.m}m
      </span>
    );
  }

  const units = [
    { value: timeLeft.d, label: "DAYS" },
    { value: timeLeft.h, label: "HRS" },
    { value: timeLeft.m, label: "MIN" },
    { value: timeLeft.s, label: "SEC" },
  ];

  return (
    <div className="flex gap-3">
      {units.map((u) => (
        <div key={u.label} className="flex flex-col items-center">
          <div className="glass-card px-2.5 py-1.5 rounded-lg min-w-[44px]">
            <span className="font-mono text-xl font-bold tabular-nums text-primary block text-center">
              {String(u.value).padStart(2, "0")}
            </span>
          </div>
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1 font-mono">
            {u.label}
          </span>
        </div>
      ))}
    </div>
  );
}
