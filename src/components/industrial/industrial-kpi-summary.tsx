"use client";

import { fmtEt } from "@/components/industrial/format-et";
import type { IndustrialResult } from "@/lib/calculators/industrial";

function KpiCard({
  label,
  value,
  unit,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0 border border-zinc-800/90 bg-zinc-950/85 px-4 py-4 sm:px-5 sm:py-5">
      <p className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-3 flex min-w-0 flex-wrap items-baseline gap-1.5">
        <span
          className={`font-mono text-[1.65rem] font-semibold leading-none tabular-nums tracking-tight sm:text-[2.05rem] ${
            accent ? "text-emerald-400" : "text-zinc-50"
          }`}
        >
          {value}
        </span>
        {unit ? <span className="font-mono text-sm text-zinc-500 sm:text-base">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-2 text-[0.72rem] leading-snug text-zinc-500">{hint}</p> : null}
    </div>
  );
}

export function IndustrialKpiSummary({ result }: { result: IndustrialResult }) {
  const peakHint =
    result.peakReductionKw > 0
      ? `Väheneb ${fmtEt(result.peakReductionKw, 0)} kW.`
      : "Selles režiimis tippu ei lõigata.";
  const paybackHint =
    result.paybackYears != null
      ? `Investeering ${fmtEt(result.investmentEur, 0)} €.`
      : result.investmentEur > 0
        ? `Investeering ${fmtEt(result.investmentEur, 0)} €; tasuvust ei saa veel arvutada.`
        : "Investeeringuta stsenaarium.";

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Aastane kogumõju"
        value={fmtEt(result.annualSavingsEur, 0)}
        unit="€/a"
        hint="Omatarve, võrku müük ja vajadusel võimsustasu."
        accent={result.annualSavingsEur > 0}
      />
      <KpiCard
        label="Omatarbe osakaal"
        value={fmtEt(result.selfConsumptionSharePercent, 0)}
        unit="%"
        hint={`${fmtEt(result.selfConsumedPvMwh, 1)} MWh kohapeal kasutatud PV.`}
      />
      <KpiCard
        label="Tipukoormus enne → pärast"
        value={`${fmtEt(result.peakLoadBeforeKw, 0)} → ${fmtEt(result.peakLoadAfterKw, 0)}`}
        unit="kW"
        hint={peakHint}
      />
      <KpiCard
        label="Lihtsustatud tasuvusaeg"
        value={result.paybackYears != null ? fmtEt(result.paybackYears, 1) : "—"}
        unit={result.paybackYears != null ? "a" : undefined}
        hint={paybackHint}
      />
    </div>
  );
}
