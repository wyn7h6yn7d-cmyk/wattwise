"use client";

import { ChartCard } from "@/components/charts/ChartCard";
import { chartPalette, fmtEt, type IndustrialChartTone } from "@/components/industrial/format-et";

function GridY({
  left,
  right,
  top,
  height,
  stroke,
}: {
  left: number;
  right: number;
  top: number;
  height: number;
  stroke: string;
}) {
  return (
    <>
      {[0, 0.5, 1].map((g) => {
        const y = top + (1 - g) * height;
        return <line key={g} x1={left} x2={right} y1={y} y2={y} stroke={stroke} />;
      })}
    </>
  );
}

export function IndustrialPeakChart({
  beforeKw,
  afterKw,
  tone = "dark",
}: {
  beforeKw: number;
  afterKw: number;
  tone?: IndustrialChartTone;
}) {
  const palette = chartPalette(tone);
  const max = Math.max(beforeKw, afterKw, 1);
  const reduced = afterKw < beforeKw - 0.05;
  const w = 640;
  const h = 240;
  const padL = 52;
  const padR = 24;
  const padT = 28;
  const padB = 48;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const bars = [
    { label: "Enne lahendust", value: beforeKw, color: palette.slate },
    { label: "Pärast lahendust", value: afterKw, color: reduced ? palette.highlight : palette.zinc },
  ];
  const barW = chartW / 4.2;
  const gap = chartW / 5.2;

  return (
    <ChartCard
      title="Tipukoormus enne / pärast"
      description="Võrgust võetav tipp enne süsteemi ja pärast PV + akut. Peak shaving profiilis on vahe tavaliselt suurem."
      className={
        tone === "light"
          ? "!rounded-none border-zinc-300 bg-white"
          : "!rounded-none border-zinc-800 bg-zinc-950"
      }
      chartClassName="min-h-[220px] md:min-h-[240px]"
      tone={tone}
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-[220px] w-full md:h-[240px]"
        role="img"
        aria-label="Tipukoormus enne ja pärast"
      >
        <GridY left={padL} right={w - padR} top={padT} height={chartH} stroke={palette.grid} />
        {bars.map((bar, index) => {
          const barH = (bar.value / max) * chartH;
          const x = padL + gap + index * (barW + gap * 1.15);
          const y = padT + chartH - barH;
          return (
            <g key={bar.label}>
              <rect x={x} y={y} width={barW} height={Math.max(barH, 2)} fill={bar.color} />
              <text x={x + barW / 2} y={h - 18} textAnchor="middle" fontSize="12" fill={palette.muted}>
                {bar.label}
              </text>
              <text x={x + barW / 2} y={y - 8} textAnchor="middle" fontSize="13" fill={palette.ink}>
                {fmtEt(bar.value, 0)} kW
              </text>
            </g>
          );
        })}
        <text x={8} y={padT + 4} fontSize="10" fill={palette.muted}>
          {fmtEt(max, 0)} kW
        </text>
      </svg>
    </ChartCard>
  );
}
