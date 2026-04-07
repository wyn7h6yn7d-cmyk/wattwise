"use client";

import { useEffect, useMemo, useState } from "react";

type Intensity = "hero" | "page";

export function AnimatedEnergyBackground({ intensity = "page" }: { intensity?: Intensity }) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const update = () => setIsMobile(window.matchMedia("(max-width: 640px)").matches);
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  const kBase = intensity === "hero" ? 1 : 0.65;
  const k = reducedMotion ? 0.25 : isMobile ? kBase * 0.55 : kBase;
  const seed = useMemo(() => (mounted ? Math.floor(Math.random() * 1_000_000) : 1), [mounted]);

  // SVG “energy flow” jooned: väga peen, aeglane liikumine + aurora glow (CSS)
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 energy-aurora" style={{ opacity: 0.9 * k }} />
      <div className="absolute inset-0 energy-grid" style={{ opacity: 0.55 * k }} />

      {/* Floating light points (desktop rohkem, mobile vähem) */}
      {!reducedMotion ? (
        <div className="absolute inset-0" style={{ opacity: 0.55 * k }}>
          {Array.from({ length: isMobile ? 6 : intensity === "hero" ? 16 : 10 }).map((_, i) => (
            <span
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              className={`energy-dot energy-dot-${(i % 6) + 1}`}
              style={{
                left: `${(i * 7 + 13) % 92}%`,
                top: `${(i * 11 + 17) % 78}%`,
              }}
            />
          ))}
        </div>
      ) : null}

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
          {!isMobile ? (
            <path
              className="energy-line energy-line-3"
              d="M-80,410 C130,340 220,520 390,430 C560,340 710,450 880,380 C1040,315 1120,390 1270,330"
              stroke={`url(#g_${seed})`}
              strokeWidth={1.6}
              fill="none"
            />
          ) : null}
        </g>
      </svg>
    </div>
  );
}

