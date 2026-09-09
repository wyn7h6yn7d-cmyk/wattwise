"use client";

import { ChartCard } from "@/components/charts/ChartCard";
import { chartPalette, fmtEt, type IndustrialChartTone } from "@/components/industrial/format-et";

export function IndustrialEnergyFlowChart({
  pvProductionMwh,
  selfConsumedMwh,
  exportedMwh,
  batteryImpactMwh,
  gridImportMwh,
  tone = "dark",
}: {
  pvProductionMwh: number;
  selfConsumedMwh: number;
  exportedMwh: number;
  batteryImpactMwh: number;
  gridImportMwh: number;
  tone?: IndustrialChartTone;
}) {
  const palette = chartPalette(tone);
  const rows = [
    { label: "PV toodang", value: Math.max(pvProductionMwh, 0), color: palette.sky },
    { label: "Kohapeal kasutatud PV", value: Math.max(selfConsumedMwh, 0), color: palette.zinc },
    { label: "Võrku müüdav PV", value: Math.max(exportedMwh, 0), color: palette.highlight },
    { label: "Aku kaudu kasutatud", value: Math.max(batteryImpactMwh, 0), color: palette.amber },
    { label: "Võrgust ostetud energia", value: Math.max(gridImportMwh, 0), color: palette.slate },
  ];
  const max = Math.max(...rows.map((row) => row.value), 1);
  const w = 720;
  const h = 268;
  const padL = 188;
  const padR = 92;
  const padT = 16;
  const rowH = 44;
  const barMaxW = w - padL - padR;

  return (
    <ChartCard
      title="Energiavoogude jaotus"
      description="Aastane jaotus: PV toodang, omatarve, müük, aku ja võrgust ost."
      className={
        tone === "light"
          ? "!rounded-none border-zinc-300 bg-white"
          : "!rounded-none border-zinc-800 bg-zinc-950"
      }
      chartClassName="min-h-[240px] md:min-h-[268px]"
      tone={tone}
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-[240px] w-full md:h-[268px]"
        role="img"
        aria-label="Energiavoogude jaotus"
      >
        {rows.map((row, index) => {
          const y = padT + index * rowH;
          const width = (row.value / max) * barMaxW;
          return (
            <g key={row.label}>
              <text x={12} y={y + 18} fontSize="13" fill={palette.muted}>
                {row.label}
              </text>
              <rect x={padL} y={y} width={barMaxW} height={22} fill={palette.track} />
              <rect
                x={padL}
                y={y}
                width={Math.max(width, row.value > 0 ? 3 : 0)}
                height={22}
                fill={row.color}
              />
              <text x={w - padR + 10} y={y + 17} fontSize="13" fill={palette.ink}>
                {fmtEt(row.value, 1)} MWh
              </text>
            </g>
          );
        })}
      </svg>
    </ChartCard>
  );
}
