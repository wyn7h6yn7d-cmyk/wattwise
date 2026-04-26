"use client";

import { useMemo, useState } from "react";
import { ForecastRow, ForecastSummary } from "@/lib/forecast/energy-forecast";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function fmtHour(ts: number) {
  const d = new Date(ts * 1000);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function fmtRange(startTs: number, endTs: number) {
  return `${fmtHour(startTs)}-${fmtHour(endTs)}`;
}

function rowBg(score: number) {
  if (score >= 78) return "bg-emerald-400/14";
  if (score >= 58) return "bg-teal-400/12";
  if (score >= 38) return "bg-white/[0.03]";
  return "bg-rose-400/8";
}

function fmt1(v: number) {
  return new Intl.NumberFormat("et-EE", { maximumFractionDigits: 1 }).format(v);
}

function fmt2(v: number) {
  return new Intl.NumberFormat("et-EE", { maximumFractionDigits: 2 }).format(v);
}

function ForecastChart({ rows }: { rows: ForecastRow[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showPrice, setShowPrice] = useState(true);
  const [showRadiation, setShowRadiation] = useState(true);
  const [showCloud, setShowCloud] = useState(true);
  const [showPv, setShowPv] = useState(true);
  const w = 1100;
  const h = 320;
  const left = 52;
  const right = 16;
  const top = 14;
  const bottom = 44;
  const chartW = w - left - right;
  const chartH = h - top - bottom;
  const idxMax = Math.max(rows.length - 1, 1);
  const xs = (i: number) => left + (i * chartW) / idxMax;

  const priceValues = rows.map((r) => r.priceSntWithVat);
  const radValues = rows.map((r) => r.radiationWm2);
  const cloudValues = rows.map((r) => r.cloudCoverPct);
  const pvValues = rows.map((r) => r.pvEnergyEstimateKwh);

  const maxPrice = Math.max(...priceValues, 0.1);
  const maxRad = Math.max(...radValues, 1);
  const maxCloud = Math.max(...cloudValues, 1);
  const maxPv = Math.max(...pvValues, 0.1);

  const yNorm = (v: number, max: number) => top + (1 - v / max) * chartH;

  const makePath = (values: number[], max: number) =>
    values
      .map((v, i) => `${i === 0 ? "M" : "L"}${xs(i).toFixed(1)},${yNorm(v, max).toFixed(1)}`)
      .join(" ");

  const pricePath = makePath(priceValues, maxPrice);
  const radPath = makePath(radValues, maxRad);
  const cloudPath = makePath(cloudValues, maxCloud);
  const pvPath = makePath(pvValues, maxPv);
  const hoverX = hoverIndex !== null ? xs(hoverIndex) : null;
  const hoverRow = hoverIndex !== null ? rows[hoverIndex] : null;

  const legendItems = useMemo(
    () => [
      {
        id: "price",
        active: showPrice,
        color: "rgba(45,212,191,0.95)",
        label: "Teal: Börsihind (snt/kWh KM-ga)",
        onToggle: () => setShowPrice((v) => !v),
      },
      {
        id: "radiation",
        active: showRadiation,
        color: "rgba(250,204,21,0.95)",
        label: "Kollane: Päikesekiirgus (W/m2)",
        onToggle: () => setShowRadiation((v) => !v),
      },
      {
        id: "cloud",
        active: showCloud,
        color: "rgba(147,197,253,0.95)",
        label: "Sinine: Pilvisus (%)",
        onToggle: () => setShowCloud((v) => !v),
      },
      {
        id: "pv",
        active: showPv,
        color: "rgba(34,197,94,0.95)",
        label: "Roheline: PV tootlus (kWh)",
        onToggle: () => setShowPv((v) => !v),
      },
    ],
    [showCloud, showPrice, showPv, showRadiation],
  );

  const handlePointerMove = (clientX: number, rect: DOMRect) => {
    const x = ((clientX - rect.left) / rect.width) * w;
    const idx = Math.round(((x - left) / chartW) * idxMax);
    const clamped = Math.max(0, Math.min(idx, idxMax));
    setHoverIndex(clamped);
  };

  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-zinc-950/40">
      <div className="relative">
        {hoverRow ? (
          <div
            className="pointer-events-none absolute z-10 rounded-xl border border-white/15 bg-zinc-950/90 px-3 py-2 text-xs text-zinc-100 shadow-[0_12px_26px_rgba(0,0,0,0.45)] backdrop-blur"
            style={{
              left: `${Math.min(90, Math.max(10, ((hoverX ?? left) / w) * 100))}%`,
              top: 8,
              transform: "translateX(-50%)",
            }}
          >
            <div className="text-zinc-300">{fmtHour(hoverRow.ts)}</div>
            <div>Hind: {fmt1(hoverRow.priceSntWithVat)} snt/kWh</div>
            <div>Kiirgus: {fmt1(hoverRow.radiationWm2)} W/m2</div>
            <div>Pilvisus: {fmt1(hoverRow.cloudCoverPct)}%</div>
            <div>PV: {fmt2(hoverRow.pvEnergyEstimateKwh)} kWh</div>
          </div>
        ) : null}
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          className="h-[320px] min-w-[760px] w-full"
          onMouseMove={(e) => handlePointerMove(e.clientX, e.currentTarget.getBoundingClientRect())}
          onMouseLeave={() => setHoverIndex(null)}
          onTouchStart={(e) => {
            const t = e.touches[0];
            if (!t) return;
            handlePointerMove(t.clientX, e.currentTarget.getBoundingClientRect());
          }}
          onTouchMove={(e) => {
            const t = e.touches[0];
            if (!t) return;
            handlePointerMove(t.clientX, e.currentTarget.getBoundingClientRect());
          }}
          onTouchEnd={() => setHoverIndex(null)}
        >
        {[0, 0.25, 0.5, 0.75, 1].map((g) => {
          const gy = top + g * chartH;
          return <line key={g} x1={left} x2={w - right} y1={gy} y2={gy} stroke="rgba(255,255,255,0.08)" />;
        })}
        <line x1={left} x2={left} y1={top} y2={h - bottom} stroke="rgba(255,255,255,0.15)" />
        <line x1={left} x2={w - right} y1={h - bottom} y2={h - bottom} stroke="rgba(255,255,255,0.15)" />

        {showPrice ? <path d={pricePath} stroke="rgba(45,212,191,0.95)" strokeWidth="2.3" fill="none" /> : null}
        {showRadiation ? <path d={radPath} stroke="rgba(250,204,21,0.95)" strokeWidth="2" fill="none" /> : null}
        {showCloud ? <path d={cloudPath} stroke="rgba(147,197,253,0.95)" strokeWidth="1.8" fill="none" /> : null}
        {showPv ? <path d={pvPath} stroke="rgba(34,197,94,0.95)" strokeWidth="2.3" fill="none" /> : null}

        {hoverX !== null ? (
          <line
            x1={hoverX}
            x2={hoverX}
            y1={top}
            y2={h - bottom}
            stroke="rgba(255,255,255,0.35)"
            strokeDasharray="4 4"
          />
        ) : null}

        {[0, Math.floor(idxMax / 2), idxMax].map((i, idx) => (
          <text
            key={idx}
            x={xs(i)}
            y={h - 16}
            fontSize="11"
            textAnchor={idx === 0 ? "start" : idx === 2 ? "end" : "middle"}
            fill="rgba(228,233,236,0.75)"
          >
            {fmtHour(rows[i]?.ts ?? 0)}
          </text>
        ))}
        </svg>
      </div>
      <div className="grid gap-2 px-4 pb-4 pt-2 text-xs text-zinc-300 sm:grid-cols-2 lg:grid-cols-4">
        {legendItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={item.onToggle}
            className={`rounded-lg border px-2 py-1 text-left transition ${
              item.active
                ? "border-white/15 bg-white/[0.06] text-zinc-100"
                : "border-white/10 bg-white/[0.02] text-zinc-500"
            }`}
          >
            <span
              className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
              style={{ backgroundColor: item.active ? item.color : "rgba(161,161,170,0.5)" }}
            />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function EnergyForecastDashboard({
  rows,
  summary,
  hasEv,
  hasBattery,
}: {
  rows: ForecastRow[];
  summary: ForecastSummary;
  hasEv: boolean;
  hasBattery: boolean;
}) {
  const [showFullTable, setShowFullTable] = useState(false);
  const visibleRows = useMemo(() => (showFullTable ? rows : rows.slice(0, 24)), [rows, showFullTable]);

  return (
    <section className="mt-8 grid gap-6 overflow-x-hidden">
      <div className="glass-panel rounded-3xl p-5 sm:p-8">
        <h2 className="text-2xl font-semibold text-zinc-50">Energiaprognoos</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Tunnipõhine vaade, mis ühendab börsihinna, ilma ja PV tootluse hinnangu järgmise 24-48h jaoks.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="metric-card metric-card-accent-emerald">
            <p className="metric-label">Parim päikeseenergia tund</p>
            <div className="metric-main">
              <strong className="metric-value">{summary.bestSolarHour ? fmtHour(summary.bestSolarHour.ts) : "—"}</strong>
              <span className="metric-unit">{summary.bestSolarHour ? `${fmt2(summary.bestSolarHour.pvEnergyEstimateKwh)} kWh` : ""}</span>
            </div>
          </div>
          <div className="metric-card metric-card-accent-teal">
            <p className="metric-label">Madalaim börsihind</p>
            <div className="metric-main">
              <strong className="metric-value">{summary.lowestPriceHour ? fmtHour(summary.lowestPriceHour.ts) : "—"}</strong>
              <span className="metric-unit">{summary.lowestPriceHour ? `${fmt1(summary.lowestPriceHour.priceSntWithVat)} snt/kWh` : ""}</span>
            </div>
          </div>
          <div className="metric-card metric-card-accent-emerald">
            <p className="metric-label">Parim laadimisaken</p>
            <div className="metric-main">
              <strong className="metric-value">
                {hasEv && summary.bestChargingWindow ? fmtRange(summary.bestChargingWindow.startTs, summary.bestChargingWindow.endTs) : "—"}
              </strong>
              <span className="metric-unit">
                {hasEv && summary.bestChargingWindow
                  ? `${fmt1(summary.bestChargingWindow.avgPriceSntWithVat)} snt`
                  : "EV puudub"}
              </span>
            </div>
          </div>
          <div className="metric-card metric-card-primary metric-card-accent-emerald">
            <p className="metric-label">PV tootlus homme</p>
            <div className="metric-main">
              <strong className="metric-value">{fmt2(summary.estimatedPvTomorrowKwh)}</strong>
              <span className="metric-unit">kWh</span>
            </div>
          </div>
        </div>

        <ForecastChart rows={rows} />
      </div>

      <div className="glass-panel rounded-3xl p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="section-title">Tunnipõhine tabel</h3>
          <div className="flex items-center gap-3">
            <p className="text-xs text-zinc-400">
              Naitan {visibleRows.length} / {rows.length} rida
            </p>
            <button
              type="button"
              className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.08]"
              onClick={() => setShowFullTable((v) => !v)}
            >
              {showFullTable ? "Naita lyhemat tabelit" : "Naita koik read"}
            </button>
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/35">
          <div className="max-h-[560px] overflow-auto">
            <table className="min-w-[860px] w-full text-sm">
              <thead className="sticky top-0 z-10 bg-zinc-950 text-zinc-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Kellaaeg</th>
                  <th className="px-4 py-3 text-right font-medium">Hind KM-ga (snt/kWh)</th>
                  <th className="px-4 py-3 text-right font-medium">Pilvisus %</th>
                  <th className="px-4 py-3 text-right font-medium">Päikesekiirgus W/m2</th>
                  <th className="px-4 py-3 text-right font-medium">PV tootlus kWh</th>
                  <th className="px-4 py-3 text-left font-medium">Soovitus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {visibleRows.map((r) => (
                  <tr key={r.ts} className={`${rowBg(r.score)} hover:bg-white/[0.05]`}>
                    <td className="px-4 py-2.5 text-zinc-100">{fmtHour(r.ts)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-zinc-50">{fmt1(r.priceSntWithVat)}</td>
                    <td className="px-4 py-2.5 text-right text-zinc-200">{fmt1(r.cloudCoverPct)}</td>
                    <td className="px-4 py-2.5 text-right text-zinc-200">{fmt1(r.radiationWm2)}</td>
                    <td className="px-4 py-2.5 text-right text-zinc-200">{fmt2(r.pvEnergyEstimateKwh)}</td>
                    <td className="px-4 py-2.5 text-zinc-100">{r.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-5 sm:p-8">
        <h3 className="section-title">Soovitused</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-200">
            <p className="font-medium text-zinc-50">Kasuta suuremat tarbimist siin</p>
            <p className="mt-1 text-zinc-300">Vali tunnid, kus hinnaskoor on kõrge ja PV tootlus on üle keskmise.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-200">
            <p className="font-medium text-zinc-50">Lae EV siin</p>
            <p className="mt-1 text-zinc-300">
              {hasEv && summary.bestChargingWindow
                ? `Soodsaim järjestikune aken on ${fmtRange(summary.bestChargingWindow.startTs, summary.bestChargingWindow.endTs)}.`
                : "Lülita EV valik sisse, et näha parimat laadimisakent."}
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-200">
            <p className="font-medium text-zinc-50">Väldi tarbimist siin</p>
            <p className="mt-1 text-zinc-300">Madal score viitab kombinatsioonile kõrge hind + madal PV potentsiaal.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-200">
            <p className="font-medium text-zinc-50">PV aja kategooriad</p>
            <p className="mt-1 text-zinc-300">
              Väga hea PV aeg (top 20%), Hea PV aeg (20-50%), Neutraalne, Madal PV tootlus või Öine tund.
            </p>
          </article>
          {hasBattery ? (
            <article className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-4 text-sm text-zinc-200 sm:col-span-2">
              <p className="font-medium text-zinc-50">Aku soovitus (V1)</p>
              <p className="mt-1 text-zinc-300">
                Kui hind on madal ja PV tootlus kõrge, eelista aku laadimist. Kõrge hinnaga tunnid sobivad tulevikus aku tühjendamiseks.
              </p>
            </article>
          ) : null}
        </div>
      </div>
    </section>
  );
}
