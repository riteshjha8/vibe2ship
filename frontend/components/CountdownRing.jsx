"use client";
import { useEffect, useState } from "react";
import { msUntil, formatCountdown } from "@/lib/dayjs";

// The signature visual of the app: a literal "ring" that depletes as a
// deadline approaches, and changes color through the same tiers that trigger
// the voice alerts (teal -> amber -> red). It is both decoration and status.
export default function CountdownRing({ deadline, createdAt, size = 56 }) {
  const [ms, setMs] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMs(msUntil(deadline));
    const id = setInterval(() => setMs(msUntil(deadline)), 30000);
    return () => clearInterval(id);
  }, [deadline]);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted || ms === null) {
    return <div className="relative shrink-0" style={{ width: size, height: size }} />;
  }

  const hoursLeft = ms / 3600000;
  let color = "#C9982A"; // gold: plenty of time
  if (hoursLeft <= 1 / 3) color = "#EF4444"; // <=20min: red
  else if (hoursLeft <= 1) color = "#F59E0B"; // <=1h: amber
  else if (hoursLeft <= 24) color = "#FBBF24"; // <=24h: warm amber-yellow

  const total = Math.max(new Date(deadline).getTime() - new Date(createdAt || Date.now() - 86400000).getTime(), 1);
  const fraction = Math.min(Math.max(1 - ms / total, 0), 1);

  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - fraction);
  const isUrgent = hoursLeft <= 1 / 3 && ms > 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className={isUrgent ? "animate-ringPulse" : ""}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ffffff14" strokeWidth="4" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-[9px] leading-none text-center px-1" style={{ color }}>
          {ms <= 0 ? "Due" : formatCountdown(ms).replace(" left", "")}
        </span>
      </div>
    </div>
  );
}
