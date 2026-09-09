"use client";

import { fmtEt } from "@/components/industrial/format-et";
import type { IndustrialTimeseriesResult } from "@/lib/calculators/industrial-timeseries";
import type { MatchPriceSeriesResult } from "@/lib/market/match-price-series";

const LINE = {
  zinc: "rgba(212,212,216,0.92)",
  zincFill: "rgba(148,163,184,0.16)",
  sky: "rgba(186,230,253,0.92)",
  skyFill: "rgba(125,211,252,0.14)",
  slate: "rgba(148,163,184,0.88)",
  muted: "rgba(161,161,170,0.88)",
  grid: "rgba(255,255,255,0.07)",
} as const;

function toLine(coords: { x: number; y: number }[]): string {
  return coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
}

function toArea(coords: { x: number; y: number }[], baselineY: number): string {
  if (coords.length === 0) return "";
  const first = coords[0];
  const last = coords[coords.length - 1];
  return `${toLine(coords)} L${last.x.toFixed(1)},${baselineY.toFixed(1)} L${first.x.toFixed(1)},${baselineY.toFixed(1)} Z`;
}

function GridY({
  left,
  right,
  top,
  height,
}: {
  left: number;
  right: number;
  top: number;
  height: number;
}) {
  return (
    <>
      {[0, 0.25, 0.5, 0.75, 1].map((g) => {
        const y = top + (1 - g) * height;
        return <line key={g} x1={left} x2={right} y1={y} y2={y} stroke={LINE.grid} />;
      })}
    </>
  );
}

function LoadPvChart({ result }: { result: IndustrialTimeseriesResult }) {
  const steps = result.chartSteps;
  if (steps.length === 0) {
    return <p className="industrial-chart-card-note">Graafiku jaoks pole andmeid.</p>;
  }

  const load = steps.map((s) => (s.durationHours > 0 ? s.consumptionKwh / s.durationHours : s.consumptionKwh));
  const pv = steps.map((s) => (s.durationHours > 0 ? s.pvProductionKwh / s.durationHours : s.pvProductionKwh));
  const max = Math.max(...load, ...pv, 1e-6);
  const w = 1000;
  const h = 248;
  const leftPad = 52;
  const rightPad = 16;
  const topPad = 14;
  const bottomPad = 32;
  const chartW = w - leftPad - rightPad;
  const chartH = h - topPad - bottomPad;
  const baseline = topPad + chartH;

  const coords = (values: number[]) =>
    values.map((v, i) => ({
      x: leftPad + (i * chartW) / Math.max(values.length - 1, 1),
      y: topPad + (1 - v / max) * chartH,
    }));

  const loadCoords = coords(load);
  const pvCoords = coords(pv);
  const sampled =
    result.chartSteps.length < result.rowCount
      ? `Kuvatud ${result.chartSteps.length} punkti ${result.rowCount} reast.`
      : `Kuvatud ${result.rowCount} mõõtepunkti.`;

  return (
    <article className="industrial-chart-card">
      <header className="industrial-chart-card-head">
        <h3>Tarbimine ja PV tootmine</h3>
        <p>{sampled} Tarbimine on täide, PV on helesinine joon.</p>
      </header>
      <ul className="industrial-chart-legend">
        <li>
          <span className="industrial-legend-swatch industrial-legend-zinc" />
          Tarbimine
        </li>
        <li>
          <span className="industrial-legend-swatch industrial-legend-sky" />
          PV tootmine
        </li>
        <li>
          max {fmtEt(max, 1)} kW
        </li>
      </ul>
      <svg viewBox={`0 0 ${w} ${h}`} className="industrial-chart-svg" role="img" aria-label="Tarbimine ja PV tootmine">
        <GridY left={leftPad} right={w - rightPad} top={topPad} height={chartH} />
        <path d={toArea(loadCoords, baseline)} fill={LINE.zincFill} />
        <path d={toLine(loadCoords)} fill="none" stroke={LINE.zinc} strokeWidth="2" />
        <path d={toLine(pvCoords)} fill="none" stroke={LINE.sky} strokeWidth="2.25" />
        <text x={10} y={topPad + 6} fontSize="11" fill={LINE.muted}>
          {fmtEt(max, 0)} kW
        </text>
        <text x={10} y={baseline} fontSize="11" fill={LINE.muted}>
          0
        </text>
        <text x={leftPad} y={h - 8} fontSize="11" fill={LINE.muted}>
          {steps[0]?.label ?? ""}
        </text>
        <text x={w - rightPad} y={h - 8} textAnchor="end" fontSize="11" fill={LINE.muted}>
          {steps[steps.length - 1]?.label ?? ""}
        </text>
      </svg>
    </article>
  );
}

function SocChart({ result }: { result: IndustrialTimeseriesResult }) {
  const steps = result.chartSteps;
  if (steps.length === 0 || result.usableBatteryCapacityKwh <= 0) {
    return (
      <p className="industrial-chart-card-note">
        Aku laetuse graafikut ei kuvata, sest aku mahtu ei ole sisestatud.
      </p>
    );
  }

  const values = steps.map((s) => s.batterySocKwh);
  const max = Math.max(result.usableBatteryCapacityKwh, ...values, 1e-6);
  const w = 1000;
  const h = 220;
  const leftPad = 52;
  const rightPad = 16;
  const topPad = 14;
  const bottomPad = 32;
  const chartW = w - leftPad - rightPad;
  const chartH = h - topPad - bottomPad;
  const baseline = topPad + chartH;
  const coords = values.map((v, i) => ({
    x: leftPad + (i * chartW) / Math.max(values.length - 1, 1),
    y: topPad + (1 - v / max) * chartH,
  }));

  return (
    <article className="industrial-chart-card">
      <header className="industrial-chart-card-head">
        <h3>Aku SOC</h3>
        <p>
          Kasutatav maht {fmtEt(result.usableBatteryCapacityKwh, 0)} kWh · min {fmtEt(result.minSocKwh, 0)} · max{" "}
          {fmtEt(result.maxSocKwh, 0)} kWh.
        </p>
      </header>
      <ul className="industrial-chart-legend">
        <li>
          <span className="industrial-legend-swatch industrial-legend-sky-fill" />
          Aku laetus
        </li>
      </ul>
      <svg viewBox={`0 0 ${w} ${h}`} className="industrial-chart-svg industrial-chart-svg-soc" role="img" aria-label="Aku SOC">
        <GridY left={leftPad} right={w - rightPad} top={topPad} height={chartH} />
        <path d={toArea(coords, baseline)} fill={LINE.skyFill} />
        <path d={toLine(coords)} fill="none" stroke={LINE.slate} strokeWidth="2" />
        <text x={10} y={topPad + 6} fontSize="11" fill={LINE.muted}>
          {fmtEt(max, 0)} kWh
        </text>
        <text x={10} y={baseline} fontSize="11" fill={LINE.muted}>
          0
        </text>
        <text x={leftPad} y={h - 8} fontSize="11" fill={LINE.muted}>
          {steps[0]?.label ?? ""}
        </text>
        <text x={w - rightPad} y={h - 8} textAnchor="end" fontSize="11" fill={LINE.muted}>
          {steps[steps.length - 1]?.label ?? ""}
        </text>
      </svg>
    </article>
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
        Samm-sammult vaade: tarbimine, lihtsustatud PV toodang ja aku tase aja jooksul. Aku järgib lihtsaid
        reegleid (omatarve või tipu lõikamine), mitte börsihinna optimeerimist.
      </p>
      <p className="mt-2 border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs leading-relaxed text-zinc-400">
        Hinnarežiim: <span className="text-zinc-200">{priceModeLabel}</span>. Valitud hinnad mõjutavad
        allpool olevat majandusvaadet eurodes, mitte aku käitumist.
      </p>

      <div className="industrial-timeseries-charts">
        <LoadPvChart result={result} />
        <SocChart result={result} />
      </div>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
          <dt className="text-zinc-400">Simuleeritud periood</dt>
          <dd className="text-right text-zinc-100">
            {result.periodStartLabel} → {result.periodEndLabel}
          </dd>
        </div>
        <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
          <dt className="text-zinc-400">PV toodang perioodil</dt>
          <dd className="font-mono tabular-nums text-zinc-100">{fmtEt(result.pvProductionKwh / 1000, 2)} MWh</dd>
        </div>
        <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
          <dt className="text-zinc-400">Otsene omatarve</dt>
          <dd className="font-mono tabular-nums text-zinc-100">
            {fmtEt(result.directSelfConsumptionKwh / 1000, 2)} MWh
          </dd>
        </div>
        <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
          <dt className="text-zinc-400">Aku kaudu kasutatud</dt>
          <dd className="font-mono tabular-nums text-zinc-100">
            {fmtEt(result.batteryDischargedToLoadKwh / 1000, 2)} MWh
          </dd>
        </div>
        <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
          <dt className="text-zinc-400">Võrku müüdud</dt>
          <dd className="font-mono tabular-nums text-zinc-100">{fmtEt(result.gridExportKwh / 1000, 2)} MWh</dd>
        </div>
        <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
          <dt className="text-zinc-400">Võrgust ostetud</dt>
          <dd className="font-mono tabular-nums text-zinc-100">{fmtEt(result.gridImportKwh / 1000, 2)} MWh</dd>
        </div>
        <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
          <dt className="text-zinc-400">Omatarbe osakaal</dt>
          <dd className="font-mono tabular-nums text-zinc-100">{fmtEt(result.selfConsumptionSharePercent, 0)}%</dd>
        </div>
        <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
          <dt className="text-zinc-400">Aku tsüklid (ligikaudne)</dt>
          <dd className="font-mono tabular-nums text-zinc-100">{fmtEt(result.approxBatteryCycles, 1)}</dd>
        </div>
        <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
          <dt className="text-zinc-400">Aku SOC min / max</dt>
          <dd className="font-mono tabular-nums text-zinc-100">
            {fmtEt(result.minSocKwh, 0)} / {fmtEt(result.maxSocKwh, 0)} kWh
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
            <dd className="font-mono tabular-nums text-zinc-100">{fmtEt(economics.periodImpactEur, 0)} €</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
            <dt className="text-zinc-400">Aastaks skaleeritud</dt>
            <dd className="font-mono tabular-nums text-zinc-100">{fmtEt(economics.annualizedImpactEur, 0)} €/a</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
            <dt className="text-zinc-400">Võrguenergia vähenemine</dt>
            <dd className="font-mono tabular-nums text-zinc-100">
              {fmtEt(economics.gridImportReductionMwh, 2)} MWh
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
            <dt className="text-zinc-400">PV omatarbe väärtus</dt>
            <dd className="font-mono tabular-nums text-zinc-100">
              {fmtEt(economics.selfConsumptionValueEur, 0)} €
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
            <dt className="text-zinc-400">Võrku müügi tulu</dt>
            <dd className="font-mono tabular-nums text-zinc-100">{fmtEt(economics.exportRevenueEur, 0)} €</dd>
          </div>
          {result.batteryPurpose === "peak_shaving" ? (
            <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
              <dt className="text-zinc-400">Võimsustasu sääst</dt>
              <dd className="font-mono tabular-nums text-zinc-100">
                {fmtEt(economics.demandChargeSavingsEur, 0)} €
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
            <dt className="text-zinc-400">Aku läbiv energia</dt>
            <dd className="font-mono tabular-nums text-zinc-100">
              {fmtEt(economics.batteryThroughputMwh, 2)} MWh
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5">
            <dt className="text-zinc-400">Aku tsüklid</dt>
            <dd className="font-mono tabular-nums text-zinc-100">{fmtEt(economics.approxBatteryCycles, 1)}</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-zinc-800/80 py-1.5 sm:col-span-2 lg:col-span-3">
            <dt className="text-zinc-400">Võrgust ost enne / pärast</dt>
            <dd className="font-mono tabular-nums text-zinc-100">
              {fmtEt(economics.gridImportBeforeKwh / 1000, 2)} → {fmtEt(economics.gridImportAfterKwh / 1000, 2)}{" "}
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

      <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-zinc-500">
        {result.assumptions.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}
