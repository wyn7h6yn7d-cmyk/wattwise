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

export function IndustrialMoneyBreakdown({
  selfConsumptionEur,
  exportEur,
  demandChargeEur,
  tone = "dark",
}: {
  selfConsumptionEur: number;
  exportEur: number;
  demandChargeEur: number;
  tone?: IndustrialChartTone;
}) {
  const palette = chartPalette(tone);
  const bars = [
    { label: "Omatarbe sääst", value: Math.max(selfConsumptionEur, 0), color: palette.zinc },
    { label: "Võrku müügi tulu", value: Math.max(exportEur, 0), color: palette.sky },
    { label: "Võimsustasu sääst", value: Math.max(demandChargeEur, 0), color: palette.amber },
  ];
  const total = bars.reduce((sum, item) => sum + item.value, 0);
  const max = Math.max(...bars.map((item) => item.value), 1);
  const w = 680;
  const h = 248;
  const padL = 52;
  const padR = 20;
  const padT = 24;
  const padB = 56;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const groupW = chartW / bars.length;
  const barW = Math.min(groupW * 0.46, 88);

  return (
    <ChartCard
      title="Rahalise mõju jaotus"
      description="Aastane kogumõju osade kaupa: omatarve, võrku müük ja võimsustasu."
      className={
        tone === "light"
          ? "!rounded-none border-zinc-300 bg-white"
          : "!rounded-none border-zinc-800 bg-zinc-950"
      }
      chartClassName="min-h-[228px] md:min-h-[248px]"
      tone={tone}
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-[228px] w-full md:h-[248px]"
        role="img"
        aria-label="Rahalise mõju jaotus"
      >
        <GridY left={padL} right={w - padR} top={padT} height={chartH} stroke={palette.grid} />
        {bars.map((bar, index) => {
          const barH = (bar.value / max) * chartH;
          const x = padL + index * groupW + (groupW - barW) / 2;
          const y = padT + chartH - barH;
          return (
            <g key={bar.label}>
              <rect x={x} y={y} width={barW} height={Math.max(barH, bar.value > 0 ? 2 : 0)} fill={bar.color} />
              <text x={x + barW / 2} y={y - 8} textAnchor="middle" fontSize="12" fill={palette.ink}>
                {fmtEt(bar.value, 0)} €
              </text>
              <text x={x + barW / 2} y={h - 22} textAnchor="middle" fontSize="12" fill={palette.muted}>
                {bar.label}
              </text>
            </g>
          );
        })}
        <text x={8} y={padT + 4} fontSize="10" fill={palette.muted}>
          {fmtEt(max, 0)} €
        </text>
        <text x={padL} y={h - 6} fontSize="12" fill={palette.ink}>
          Kokku {fmtEt(total, 0)} €/a
        </text>
      </svg>
    </ChartCard>
  );
}
