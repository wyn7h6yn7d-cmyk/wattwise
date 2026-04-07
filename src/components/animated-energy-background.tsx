"use client";

import { useEffect, useMemo, useState } from "react";

type Intensity = "hero" | "page";

export function AnimatedEnergyBackground({ intensity = "page" }: { intensity?: Intensity }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const k = intensity === "hero" ? 1 : 0.65;
  const seed = useMemo(() => (mounted ? Math.floor(Math.random() * 1_000_000) : 1), [mounted]);

  // SVG “energy flow” jooned: väga peen, aeglane liikumine + aurora glow (CSS)
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 energy-aurora" style={{ opacity: 0.9 * k }} />
      <div className="absolute inset-0 energy-grid" style={{ opacity: 0.55 * k }} />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1200 700"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`g_${seed}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgba(16,185,129,0.0)" />
            <stop offset="0.4" stopColor="rgba(16,185,129,0.35)" />
            <stop offset="0.7" stopColor="rgba(20,184,166,0.28)" />
            <stop offset="1" stopColor="rgba(16,185,129,0.0)" />
          </linearGradient>
          <filter id={`blur_${seed}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={2.6 * k} />
          </filter>
        </defs>

        <g filter={`url(#blur_${seed})`} opacity={0.9 * k}>
          <path
            className="energy-line energy-line-1"
            d="M-50,540 C180,430 240,610 420,520 C610,420 680,560 860,470 C1030,385 1100,470 1250,380"
            stroke={`url(#g_${seed})`}
            strokeWidth={2.2}
            fill="none"
          />
          <path
            className="energy-line energy-line-2"
            d="M-60,240 C130,190 260,310 410,250 C600,175 690,295 860,230 C1040,160 1100,260 1260,210"
            stroke={`url(#g_${seed})`}
            strokeWidth={1.8}
            fill="none"
          />
          <path
            className="energy-line energy-line-3"
            d="M-80,410 C130,340 220,520 390,430 C560,340 710,450 880,380 C1040,315 1120,390 1270,330"
            stroke={`url(#g_${seed})`}
            strokeWidth={1.6}
            fill="none"
          />
        </g>
      </svg>
    </div>
  );
}

