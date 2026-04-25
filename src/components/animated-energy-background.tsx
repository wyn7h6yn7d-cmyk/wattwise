"use client";

import { useEffect, useState } from "react";

type Intensity = "hero" | "subtle";

export function AnimatedEnergyBackground({ intensity = "subtle" }: { intensity?: Intensity }) {
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const seed = intensity === "hero" ? 11 : 22;
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

  const particleCount = reducedMotion ? 0 : isMobile ? (intensity === "hero" ? 8 : 4) : intensity === "hero" ? 20 : 8;
  const baseOpacity = intensity === "hero" ? 1.08 : 0.42;
  const mobileFactor = isMobile ? 0.52 : 1;
  const motionFactor = reducedMotion ? 0.35 : 1;
  const k = baseOpacity * mobileFactor * motionFactor;
  const strokeA = intensity === "hero" ? 2.5 : 1.25;
  const strokeB = intensity === "hero" ? 2.05 : 1.05;
  const strokeC = intensity === "hero" ? 1.75 : 0.95;

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${intensity === "hero" ? "energy-scene-hero" : "energy-scene-subtle"}`}>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(4,11,9,0.96) 0%, rgba(6,18,16,0.88) 58%, rgba(4,11,9,0.96) 100%)",
          opacity: 0.96,
        }}
      />
      <div className="absolute inset-0 energy-aurora" style={{ opacity: 0.9 * k }} />
      <div className="absolute inset-0 energy-aurora energy-aurora-2" style={{ opacity: 0.65 * k }} />
      <div className="absolute inset-0 energy-grid" style={{ opacity: 0.45 * k }} />
      <div className={`absolute inset-0 energy-pulse ${intensity === "hero" ? "energy-pulse-hero" : "energy-pulse-subtle"}`} style={{ opacity: 0.55 * k }} />
      <div
        className="absolute inset-0 energy-glow-cloud"
        style={{ opacity: 0.55 * k }}
      />

      {particleCount > 0 ? (
        <div className="absolute inset-0" style={{ opacity: 0.55 * k }}>
          {Array.from({ length: particleCount }).map((_, i) => (
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
            <feGaussianBlur stdDeviation={2.2 * k} />
          </filter>
        </defs>

        <g filter={`url(#blur_${seed})`} opacity={0.9 * k}>
          <path
            className="energy-line energy-line-1"
            d="M-50,540 C180,430 240,610 420,520 C610,420 680,560 860,470 C1030,385 1100,470 1250,380"
            stroke={`url(#g_${seed})`}
            strokeWidth={strokeA}
            fill="none"
          />
          <path
            className="energy-line energy-line-2"
            d="M-60,240 C130,190 260,310 410,250 C600,175 690,295 860,230 C1040,160 1100,260 1260,210"
            stroke={`url(#g_${seed})`}
            strokeWidth={strokeB}
            fill="none"
          />
          {intensity === "hero" && !isMobile ? (
            <path
              className="energy-line energy-line-3"
              d="M-80,410 C130,340 220,520 390,430 C560,340 710,450 880,380 C1040,315 1120,390 1270,330"
              stroke={`url(#g_${seed})`}
              strokeWidth={strokeC}
              fill="none"
            />
          ) : null}
          {intensity === "hero" && !reducedMotion ? (
            <path
              className="energy-line energy-line-4"
              d="M-90,120 C100,80 250,220 430,170 C580,130 760,210 900,160 C1030,120 1120,170 1260,130"
              stroke={`url(#g_${seed})`}
              strokeWidth={1.2}
              fill="none"
            />
          ) : null}
        </g>
      </svg>
    </div>
  );
}

