import { HistoricalSolarAnalysis } from "@/lib/weather/historical-solar";

function fmt1(v: number) {
  return new Intl.NumberFormat("et-EE", { maximumFractionDigits: 1 }).format(v);
}

export function HistoricalSolarAnalysisPanel({
  analysis,
  loadingFallback = false,
}: {
  analysis: HistoricalSolarAnalysis;
  loadingFallback?: boolean;
}) {
  const maxPotential = Math.max(...analysis.monthly.map((m) => m.productionPotentialKwh), 1);
  const suitabilityColor =
    analysis.suitability === "väga hea"
      ? "text-emerald-200"
      : analysis.suitability === "hea"
        ? "text-teal-200"
        : analysis.suitability === "keskmine"
          ? "text-zinc-200"
          : "text-amber-200";

  return (
    <section className="mt-6 glass-panel rounded-3xl p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-zinc-50">V2 ajalooline päikeseanalüüs</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Viimase {analysis.yearsUsed} aasta (ERA5) kiirguse põhine tootmispotentsiaal kuude lõikes.
          </p>
        </div>
        <div className="rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm">
          <p className="text-zinc-400">Asukoha sobivus</p>
          <p className={`text-lg font-semibold ${suitabilityColor}`}>{analysis.suitability}</p>
        </div>
      </div>

      {loadingFallback ? (
        <div className="mt-4 rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
          Ajalooline analüüs kasutab hetkel varuandmeid (API polnud saadaval).
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="metric-card metric-card-accent-emerald">
          <p className="metric-label">Keskmine kiirgus aastas</p>
          <div className="metric-main">
            <strong className="metric-value">{fmt1(analysis.averageRadiationKwhM2Year)}</strong>
            <span className="metric-unit">kWh/m2</span>
          </div>
        </div>
        <div className="metric-card metric-card-accent-teal">
          <p className="metric-label">Eesti keskmine</p>
          <div className="metric-main">
            <strong className="metric-value">{fmt1(analysis.estoniaAverageRadiationKwhM2Year)}</strong>
            <span className="metric-unit">kWh/m2</span>
          </div>
        </div>
        <div className="metric-card metric-card-accent-emerald">
          <p className="metric-label">Võrdlus Eesti keskmisega</p>
          <div className="metric-main">
            <strong className="metric-value">
              {analysis.deltaVsEstoniaPercent >= 0 ? "+" : ""}
              {fmt1(analysis.deltaVsEstoniaPercent)}
            </strong>
            <span className="metric-unit">%</span>
          </div>
        </div>
        <div className="metric-card metric-card-primary metric-card-accent-emerald">
          <p className="metric-label">Raporti kokkuvõte</p>
          <p className="mt-2 text-sm text-zinc-200">{analysis.reportSummary}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <article className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4 lg:col-span-8">
          <h4 className="section-title">Kuude lõikes tootmispotentsiaal</h4>
          <div className="grid gap-2">
            {analysis.monthly.map((m) => {
              const widthPct = Math.max((m.productionPotentialKwh / maxPotential) * 100, 2);
              return (
                <div key={m.month} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                  <div className="mb-2 flex items-center justify-between text-xs text-zinc-300">
                    <span>{m.monthLabel}</span>
                    <span>{fmt1(m.productionPotentialKwh)} kWh</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400/90 to-teal-400/90"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4 lg:col-span-4">
          <h4 className="section-title">Parimad ja halvimad kuud</h4>
          <div className="grid gap-3 text-sm">
            <div>
              <p className="text-emerald-200">Parimad kuud</p>
              {analysis.bestMonths.map((m) => (
                <div key={`b-${m.month}`} className="compare-row mt-2">
                  <span className="compare-label">{m.monthLabel}</span>
                  <strong>{fmt1(m.productionPotentialKwh)} kWh</strong>
                </div>
              ))}
            </div>
            <div>
              <p className="text-amber-200">Halvimad kuud</p>
              {analysis.worstMonths.map((m) => (
                <div key={`w-${m.month}`} className="compare-row mt-2">
                  <span className="compare-label">{m.monthLabel}</span>
                  <strong>{fmt1(m.productionPotentialKwh)} kWh</strong>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
