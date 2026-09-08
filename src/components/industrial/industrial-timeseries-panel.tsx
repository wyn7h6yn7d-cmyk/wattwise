"use client";

import { ChartCard } from "@/components/charts/ChartCard";
import type { IndustrialTimeseriesResult } from "@/lib/calculators/industrial-timeseries";
import type { MatchPriceSeriesResult } from "@/lib/market/match-price-series";

function fmt(value: number, digits: number): string {
  return new Intl.NumberFormat("et-EE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
}

function DualSeriesChart({
  title,
  description,
  steps,
  seriesA,
  seriesB,
  labelA,
  labelB,
  unit,
}: {
  title: string;
  description: string;
  steps: IndustrialTimeseriesResult["chartSteps"];
  seriesA: (step: IndustrialTimeseriesResult["chartSteps"][number]) => number;
  seriesB: (step: IndustrialTimeseriesResult["chartSteps"][number]) => number;
  labelA: string;
  labelB: string;
  unit: string;
}) {
  if (steps.length === 0) {
    return <p className="text-sm text-zinc-400">Graafiku jaoks pole andmeid.</p>;
  }

  const valuesA = steps.map(seriesA);
  const valuesB = steps.map(seriesB);
  const max = Math.max(...valuesA, ...valuesB, 1e-6);
  const min = 0;
  const w = 1000;
  const h = 220;
  const leftPad = 48;
  const rightPad = 12;
  const topPad = 12;
  const bottomPad = 30;
  const chartW = w - leftPad - rightPad;
  const chartH = h - topPad - bottomPad;

  const toCoords = (values: number[]) =>
    values.map((v, i) => {
      const x = leftPad + (i * chartW) / Math.max(values.length - 1, 1);
      const y = topPad + (1 - (v - min) / (max - min)) * chartH;
      return { x, y };
    });

  const coordsA = toCoords(valuesA);
  const coordsB = toCoords(valuesB);
  const line = (coords: { x: number; y: number }[]) =>
    coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");

  return (
    <ChartCard
      title={title}
      description={description}
      className="!rounded-none border-zinc-800 bg-zinc-950"
      chartClassName="min-h-[180px] md:min-h-[220px]"
    >
      <div className="mb-2 flex flex-wrap gap-4 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-zinc-300" />
          {labelA}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-sky-300/80" />
          {labelB}
        </span>
        <span>
          max {fmt(max, 1)} {unit}
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-[180px] w-full md:h-[220px]" role="img" aria-label={title}>
        {[0, 0.5, 1].map((g) => {
          const y = topPad + (1 - g) * chartH;
          return (
            <line key={g} x1={leftPad} x2={w - rightPad} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" />
          );
        })}
        <path d={line(coordsA)} fill="none" stroke="rgba(212,212,216,0.9)" strokeWidth="2" />
        <path d={line(coordsB)} fill="none" stroke="rgba(125,211,252,0.85)" strokeWidth="2" />
        <text x={8} y={topPad + 4} fontSize="10" fill="rgba(161,161,170,0.9)">
          {fmt(max, 0)}
        </text>
        <text x={8} y={topPad + chartH} fontSize="10" fill="rgba(161,161,170,0.9)">
          0
        </text>
        <text x={leftPad} y={h - 8} fontSize="10" fill="rgba(161,161,170,0.9)">
          {steps[0]?.label ?? ""}
        </text>
        <text x={w - rightPad} y={h - 8} textAnchor="end" fontSize="10" fill="rgba(161,161,170,0.9)">
          {steps[steps.length - 1]?.label ?? ""}
        </text>
      </svg>
    </ChartCard>
  );
}

function SocChart({ result }: { result: IndustrialTimeseriesResult }) {
  const steps = result.chartSteps;
  if (steps.length === 0 || result.usableBatteryCapacityKwh <= 0) {
    return (
      <p className="text-sm text-zinc-400">
        Aku laetuse graafikut ei kuvata, sest aku mahtu ei ole sisestatud.
      </p>
    );
  }

  const values = steps.map((s) => s.batterySocKwh);
  const max = Math.max(result.usableBatteryCapacityKwh, ...values, 1e-6);
  const w = 1000;
  const h = 220;
  const leftPad = 48;
  const rightPad = 12;
  const topPad = 12;
  const bottomPad = 30;
  const chartW = w - leftPad - rightPad;
  const chartH = h - topPad - bottomPad;
  const coords = values.map((v, i) => {
    const x = leftPad + (i * chartW) / Math.max(values.length - 1, 1);
    const y = topPad + (1 - v / max) * chartH;
    return { x, y };
  });
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");

  return (
    <ChartCard
      title="Aku laetuse tase ajas"
      description={`Kasutatav maht ${fmt(result.usableBatteryCapacityKwh, 0)} kWh · min ${fmt(result.minSocKwh, 0)} · max ${fmt(result.maxSocKwh, 0)} kWh.`}
      className="!rounded-none border-zinc-800 bg-zinc-950"
      chartClassName="min-h-[180px] md:min-h-[220px]"
    >
      <svg viewBox={`0 0 ${w} ${h}`} className="h-[180px] w-full md:h-[220px]" role="img" aria-label="Aku SOC">
        {[0, 0.5, 1].map((g) => {
          const y = topPad + (1 - g) * chartH;
          return (
            <line key={g} x1={leftPad} x2={w - rightPad} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" />
          );
        })}
        <path d={line} fill="none" stroke="rgba(251,191,36,0.85)" strokeWidth="2" />
        <text x={8} y={topPad + 4} fontSize="10" fill="rgba(161,161,170,0.9)">
          {fmt(max, 0)}
        </text>
        <text x={8} y={topPad + chartH} fontSize="10" fill="rgba(161,161,170,0.9)">
          0
        </text>
      </svg>
    </ChartCard>
  );
}

export function IndustrialTimeseriesPanel({
  result,
  priceModeLabel,
  priceMatch,
}: {
  result: IndustrialTimeseriesResult;
  priceModeLabel: string;
  priceMatch: MatchPriceSeriesResult | null;
}) {
  const { economics } = result;

  return (
    <article className="card">
      <h2 className="section-title">Ajapõhine simulatsioon</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Lihtsustatud PV + aku käitumine CSV tarbimisprofiili peal. PV jaotatakse päevakõvera ja kuuteguri järgi;
        aku töötab endiselt ahnusloogika järgi (börsihinna optimeerimist ei ole).
      </p>
      <p className="mt-2 border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs leading-relaxed text-zinc-400">
        Hinnarežiim: <span className="text-zinc-200">{priceModeLabel}</span>. Hinnaseeria sidub hinnad
        rahalise arvestusega; aku dispetšerit börsihinna järgi ei optimeerita.
      </p>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
          <dt className="text-zinc-400">Simuleeritud periood</dt>
          <dd className="text-right text-zinc-100">
            {result.periodStartLabel} → {result.periodEndLabel}
          </dd>
        </div>
        <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
          <dt className="text-zinc-400">PV toodang perioodil</dt>
          <dd className="font-mono tabular-nums text-zinc-100">{fmt(result.pvProductionKwh / 1000, 2)} MWh</dd>
        </div>
        <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
          <dt className="text-zinc-400">Otsene omatarve</dt>
          <dd className="font-mono tabular-nums text-zinc-100">
            {fmt(result.directSelfConsumptionKwh / 1000, 2)} MWh
          </dd>
        </div>
        <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
          <dt className="text-zinc-400">Aku kaudu kasutatud</dt>
          <dd className="font-mono tabular-nums text-zinc-100">
            {fmt(result.batteryDischargedToLoadKwh / 1000, 2)} MWh
          </dd>
        </div>
        <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
          <dt className="text-zinc-400">Võrku müüdud</dt>
          <dd className="font-mono tabular-nums text-zinc-100">{fmt(result.gridExportKwh / 1000, 2)} MWh</dd>
        </div>
        <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
          <dt className="text-zinc-400">Võrgust ostetud</dt>
          <dd className="font-mono tabular-nums text-zinc-100">{fmt(result.gridImportKwh / 1000, 2)} MWh</dd>
        </div>
        <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
          <dt className="text-zinc-400">Omatarbe osakaal</dt>
          <dd className="font-mono tabular-nums text-zinc-100">{fmt(result.selfConsumptionSharePercent, 0)}%</dd>
        </div>
        <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
          <dt className="text-zinc-400">Aku tsüklid (ligikaudne)</dt>
          <dd className="font-mono tabular-nums text-zinc-100">{fmt(result.approxBatteryCycles, 1)}</dd>
        </div>
        <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
          <dt className="text-zinc-400">Aku SOC min / max</dt>
          <dd className="font-mono tabular-nums text-zinc-100">
            {fmt(result.minSocKwh, 0)} / {fmt(result.maxSocKwh, 0)} kWh
          </dd>
        </div>
      </dl>

      <div className="mt-6 border-t border-zinc-800 pt-4">
        <h3 className="text-sm font-medium text-zinc-100">Ajapõhise simulatsiooni majandus</h3>
        {priceMatch ? (
          <p className="mt-2 text-xs text-zinc-400">
            Hinnaga seotud ridu: {priceMatch.matchedFromSeriesCount} / {result.rowCount}
            {priceMatch.unmatchedCount > 0 ? ` · sidumata ${priceMatch.unmatchedCount}` : ""}.
          </p>
        ) : null}
        {priceMatch?.warning ? (
          <p className="mt-2 border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-xs leading-relaxed text-amber-50">
            {priceMatch.warning}
          </p>
        ) : null}
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
            <dt className="text-zinc-400">Perioodi sääst</dt>
            <dd className="font-mono tabular-nums text-zinc-100">{fmt(economics.periodImpactEur, 0)} €</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
            <dt className="text-zinc-400">Aastaks skaleeritud</dt>
            <dd className="font-mono tabular-nums text-zinc-100">{fmt(economics.annualizedImpactEur, 0)} €/a</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
            <dt className="text-zinc-400">Võrguenergia vähenemine</dt>
            <dd className="font-mono tabular-nums text-zinc-100">
              {fmt(economics.gridImportReductionMwh, 2)} MWh
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
            <dt className="text-zinc-400">PV omatarbe väärtus</dt>
            <dd className="font-mono tabular-nums text-zinc-100">
              {fmt(economics.selfConsumptionValueEur, 0)} €
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
            <dt className="text-zinc-400">Võrku müügi tulu</dt>
            <dd className="font-mono tabular-nums text-zinc-100">{fmt(economics.exportRevenueEur, 0)} €</dd>
          </div>
          {result.batteryPurpose === "peak_shaving" ? (
            <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
              <dt className="text-zinc-400">Võimsustasu sääst</dt>
              <dd className="font-mono tabular-nums text-zinc-100">
                {fmt(economics.demandChargeSavingsEur, 0)} €
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
            <dt className="text-zinc-400">Aku läbiv energia</dt>
            <dd className="font-mono tabular-nums text-zinc-100">
              {fmt(economics.batteryThroughputMwh, 2)} MWh
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
            <dt className="text-zinc-400">Aku tsüklid</dt>
            <dd className="font-mono tabular-nums text-zinc-100">{fmt(economics.approxBatteryCycles, 1)}</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5 sm:col-span-2 lg:col-span-3">
            <dt className="text-zinc-400">Võrgust ost enne / pärast</dt>
            <dd className="font-mono tabular-nums text-zinc-100">
              {fmt(economics.gridImportBeforeKwh / 1000, 2)} → {fmt(economics.gridImportAfterKwh / 1000, 2)}{" "}
              MWh
            </dd>
          </div>
        </dl>
        {!economics.isFullYearEstimate ? (
          <p className="mt-3 border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-xs leading-relaxed text-amber-50">
            Perioodi tulemused põhinevad üles laaditud andmetel. Aastane mõju on lihtsustatud hinnang ja sõltub
            andmestiku pikkusest ning esinduslikkusest.
          </p>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4">
        <DualSeriesChart
          title="Tarbimine vs PV tootmine"
          description={
            result.chartSteps.length < result.rowCount
              ? `Kuvatud ${result.chartSteps.length} punkti ${result.rowCount} reast.`
              : `Kuvatud ${result.rowCount} mõõtepunkti.`
          }
          steps={result.chartSteps}
          seriesA={(s) => (s.durationHours > 0 ? s.consumptionKwh / s.durationHours : s.consumptionKwh)}
          seriesB={(s) => (s.durationHours > 0 ? s.pvProductionKwh / s.durationHours : s.pvProductionKwh)}
          labelA="Tarbimine"
          labelB="PV tootmine"
          unit="kW"
        />
        <SocChart result={result} />
      </div>

      <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-zinc-500">
        {result.assumptions.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}
