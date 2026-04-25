"use client";

import { useEffect, useState } from "react";

type AnimatedEnergyBackgroundProps = {
  intensity?: "hero" | "subtle";
};

export function AnimatedEnergyBackground({ intensity = "hero" }: AnimatedEnergyBackgroundProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.matchMedia("(max-width: 768px)").matches);
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

  const lineCount = isMobile ? 2 : 4;
  const particleCount = isMobile ? 3 : 8;
  const opacityFactor = intensity === "subtle" ? 0.72 : 1;

  return (
    <div
      className={`aeb-root ${reducedMotion ? "aeb-reduced" : ""}`}
      style={{ contain: "layout paint style" }}
      aria-hidden="true"
    >
      <div className="aeb-base" />
      <div className="aeb-aurora aeb-aurora-a" style={{ opacity: 0.34 * opacityFactor }} />
      <div className="aeb-aurora aeb-aurora-b" style={{ opacity: 0.3 * opacityFactor }} />

      <svg className="aeb-lines" viewBox="0 0 1200 700" preserveAspectRatio="none" style={{ opacity: opacityFactor }}>
        <defs>
          <linearGradient id="aeb_line_grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgba(16,185,129,0.0)" />
            <stop offset="0.38" stopColor="rgba(16,185,129,0.65)" />
            <stop offset="0.7" stopColor="rgba(45,212,191,0.6)" />
            <stop offset="1" stopColor="rgba(16,185,129,0.0)" />
          </linearGradient>
        </defs>

        <g>
          <path className="aeb-line aeb-line-1" d="M-80,540 C180,450 260,600 460,500 C650,405 760,540 960,450 C1090,395 1160,420 1280,360" />
          <path className="aeb-line aeb-line-2" d="M-70,250 C130,185 260,320 430,242 C590,170 760,292 910,220 C1070,155 1160,210 1280,180" />
          {lineCount > 2 ? (
            <path className="aeb-line aeb-line-3" d="M-90,410 C130,330 240,530 430,420 C620,322 760,452 940,372 C1075,320 1160,350 1280,300" />
          ) : null}
          {lineCount > 3 ? (
            <path className="aeb-line aeb-line-4" d="M-100,130 C120,75 270,228 450,168 C620,115 790,230 960,162 C1080,122 1160,152 1280,122" />
          ) : null}
        </g>
      </svg>

      <div className="aeb-particles" style={{ opacity: opacityFactor }}>
        {Array.from({ length: particleCount }).map((_, i) => (
          <span
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            className={`aeb-dot aeb-dot-${(i % 4) + 1}`}
            style={{
              left: `${(i * 11 + 12) % 92}%`,
              top: `${(i * 13 + 18) % 74}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

