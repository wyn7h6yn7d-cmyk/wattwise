"use client";

import { ReactNode, useMemo, useState } from "react";
import {
  addVat,
  eurMWhToSntKWh,
  eurMWhToSntKWhWithVat,
  formatSntKWh,
  MarketPricePoint,
} from "@/lib/elering";
import { pickBestWindows, pickTopSlots, summarizeDay } from "@/lib/market-recommendations";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function fmtTimeEt(ts: number) {
  const d = new Date(ts * 1000);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function fmtRangeEt(startTs: number, endTs: number) {
  return `${fmtTimeEt(startTs)}–${fmtTimeEt(endTs)}`;
}

function fmtSnt(eurPerKwh: number, vat: boolean) {
  const eurPerMWh = eurPerKwh * 1000;
  const snt = vat ? eurMWhToSntKWhWithVat(eurPerMWh) : eurMWhToSntKWh(eurPerMWh);
  return formatSntKWh(snt);
}

type ViewInterval = 15 | 60;
type ViewPeriod = "today" | "today_tomorrow" | "tomorrow";

function computeNow(points: MarketPricePoint[], intervalMinutes: 15 | 60, nowTs: number) {
  const sorted = points.slice().sort((a, b) => a.ts - b.ts);
  const intervalSec = intervalMinutes * 60;

  let current: MarketPricePoint | null = null;
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    if (sorted[i].ts <= nowTs) {
      current = sorted[i];
      break;
    }
  }
  const next = sorted.find((p) => p.ts > nowTs) ?? null;
  const chosen = current ?? next ?? sorted[0] ?? null;
  if (!chosen) return null;

  const chosenIsNext = !current && Boolean(next) ? true : current && next ? chosen.ts === next.ts : false;
  const label =
    intervalMinutes === 15
      ? chosenIsNext
        ? "Järgmine 15 min"
        : "Praegu"
      : chosenIsNext
        ? "Järgmine tund"
        : "Praegune tund";

  const endTs = chosen.ts + intervalSec;
  return { label, startTs: chosen.ts, endTs, eurPerKwh: chosen.price_eur_per_kwh };
}

function startOfDayLocal(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDayLocal(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function splitByLocalDay(points: MarketPricePoint[], day: Date) {
  const s = startOfDayLocal(day).getTime() / 1000;
  const e = endOfDayLocal(day).getTime() / 1000;
  return points.filter((p) => p.ts >= s && p.ts <= e);
}

function resampleToHourly(points: MarketPricePoint[], sourceInterval: 15 | 60): MarketPricePoint[] {
  if (sourceInterval === 60) return points;
  const sorted = points.slice().sort((a, b) => a.ts - b.ts);
  const out: MarketPricePoint[] = [];
  // group by local hour key
  const groups = new Map<number, MarketPricePoint[]>();
  for (const p of sorted) {
    const d = new Date(p.ts * 1000);
    d.setMinutes(0, 0, 0);
    const key = Math.floor(d.getTime() / 1000);
    const g = groups.get(key) ?? [];
    g.push(p);
    groups.set(key, g);
  }
  for (const [hourTs, g] of Array.from(groups.entries()).sort((a, b) => a[0] - b[0])) {
    const mean = g.reduce((s, p) => s + p.price_eur_per_kwh, 0) / g.length;
    out.push({ ts: hourTs, price_eur_per_kwh: mean });
  }
  return out;
}

function volatilityIndex(points: MarketPricePoint[]) {
  const v = points.map((p) => p.price_eur_per_kwh).filter((x) => Number.isFinite(x));
  if (v.length < 2) return null;
  const mean = v.reduce((s, x) => s + x, 0) / v.length;
  const variance = v.reduce((s, x) => s + (x - mean) ** 2, 0) / (v.length - 1);
  const std = Math.sqrt(Math.max(variance, 0));
  const cv = mean !== 0 ? std / Math.abs(mean) : null;
  return { mean, std, cv };
}

function priceClass(p: number, mean: number, std: number) {
  // Cheap/avg/expensive/peak based on z-score.
  const z = std > 0 ? (p - mean) / std : 0;
  if (z <= -0.6) return { label: "odav", pill: "bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-300/20" };
  if (z >= 1.2) return { label: "tipp", pill: "bg-teal-300/20 text-teal-100 ring-1 ring-teal-200/30" };
  if (z >= 0.6) return { label: "kallis", pill: "bg-teal-400/12 text-teal-100 ring-1 ring-teal-300/20" };
  return { label: "keskmine", pill: "bg-white/[0.04] text-zinc-200 ring-1 ring-white/10" };
}

function cardTitle(label: string) {
  return <div className="text-xs text-zinc-400">{label}</div>;
}

function FilterChip({
  active,
  onClick,
  children,
  disabled = false,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
        active
          ? "border-emerald-300/35 bg-emerald-400/15 text-zinc-50 shadow-[0_0_20px_rgba(16,185,129,0.12)]"
          : "border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.05] hover:text-zinc-50"
      } ${disabled ? "cursor-not-allowed opacity-45" : ""}`}
    >
      {children}
    </button>
  );
}

function HeatRow({ points, vat }: { points: MarketPricePoint[]; vat: boolean }) {
  const values = points.map((p) => (vat ? addVat(p.price_eur_per_kwh) : p.price_eur_per_kwh));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1e-9);

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>Odavam</span>
        <span>Kallim</span>
      </div>
      <div className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(5px,1fr))] gap-1 sm:grid-cols-[repeat(auto-fit,minmax(6px,1fr))]">
        {points.map((p) => {
          const v = vat ? addVat(p.price_eur_per_kwh) : p.price_eur_per_kwh;
          const t = (v - min) / span;
          const bg = t < 0.33 ? "bg-emerald-400/45" : t < 0.66 ? "bg-teal-400/30" : "bg-teal-300/22";
          return (
            <div
              key={p.ts}
              className={`h-3 rounded-sm ${bg} ring-1 ring-white/10 sm:h-4`}
              title={`${fmtTimeEt(p.ts)} · ${fmtSnt(p.price_eur_per_kwh, vat)} snt/kWh`}
            />
          );
        })}
      </div>
    </div>
  );
}

function AreaChart({
  points,
  vat,
  nowTs,
}: {
  points: MarketPricePoint[];
  vat: boolean;
  nowTs: number;
}) {
  const values = points.map((p) => (vat ? addVat(p.price_eur_per_kwh) : p.price_eur_per_kwh));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1e-9);
  const w = 520;
  const h = 220;
  const pad = 10;

  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);

  const d = values
    .map((v, i) => {
      const x = pad + (i * (w - pad * 2)) / Math.max(values.length - 1, 1);
      const y = pad + (1 - (v - min) / span) * (h - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const nowIndex = (() => {
    // closest point by timestamp
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < points.length; i += 1) {
      const dist = Math.abs(points[i].ts - nowTs);
      if (dist < bestDist) {
        best = i;
        bestDist = dist;
      }
    }
    return best;
  })();

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-zinc-950/40 p-4 sm:p-5">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>Hinnagraafik</span>
        <span>
          min {fmtSnt(min, vat)} · max {fmtSnt(max, vat)} snt/kWh
        </span>
      </div>
      <div className="relative mt-3">
        {hover ? (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-white/10 bg-zinc-950/85 px-3 py-2 text-xs text-zinc-200 shadow-[0_0_30px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
            style={{
              // hoia tooltip alati vaate sees (mobiilis tekitas "üle ääre" layouti)
              left: `${Math.min(90, Math.max(10, (hover.x / w) * 100))}%`,
              top: 0,
            }}
          >
            <div className="text-zinc-400">{fmtTimeEt(points[hover.i]?.ts ?? 0)}</div>
            <div className="font-semibold text-zinc-50">
              {fmtSnt(points[hover.i]?.price_eur_per_kwh ?? 0, vat)} snt/kWh
            </div>
          </div>
        ) : null}
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="h-[230px] w-full sm:h-[220px]"
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const px = ((e.clientX - rect.left) / rect.width) * w;
            const i = Math.round(((px - pad) / (w - pad * 2)) * (points.length - 1));
            const ii = Math.min(Math.max(i, 0), points.length - 1);
            const v = values[ii] ?? min;
            const x = pad + (ii * (w - pad * 2)) / Math.max(values.length - 1, 1);
            const y = pad + (1 - (v - min) / span) * (h - pad * 2);
            setHover({ i: ii, x, y });
          }}
        >
        <defs>
          <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(20,184,166,0.34)" />
            <stop offset="100%" stopColor="rgba(16,185,129,0.02)" />
          </linearGradient>
        </defs>
        {[0.2, 0.4, 0.6, 0.8].map((g) => {
          const gy = pad + g * (h - pad * 2);
          return <line key={g} x1={pad} x2={w - pad} y1={gy} y2={gy} stroke="rgba(255,255,255,0.08)" />;
        })}
        <path d={d} fill="none" stroke="rgba(45,212,191,0.95)" strokeWidth="2.2" />
        <path d={`${d} L${w - pad},${h - pad} L${pad},${h - pad} Z`} fill="url(#area)" />
        {/* now marker */}
        {points.length > 1 ? (
          (() => {
            const x = pad + (nowIndex * (w - pad * 2)) / Math.max(points.length - 1, 1);
            const v = values[nowIndex] ?? min;
            const y = pad + (1 - (v - min) / span) * (h - pad * 2);
            return (
              <g>
                <line x1={x} x2={x} y1={pad} y2={h - pad} stroke="rgba(255,255,255,0.16)" strokeDasharray="3 4" />
                <circle cx={x} cy={y} r="4.5" fill="rgba(45,212,191,0.95)" />
              </g>
            );
          })()
        ) : null}
        {/* hover marker */}
        {hover ? (
          <g>
            <line x1={hover.x} x2={hover.x} y1={pad} y2={h - pad} stroke="rgba(255,255,255,0.20)" />
            <circle cx={hover.x} cy={hover.y} r="4" fill="rgba(110,231,183,0.95)" />
          </g>
        ) : null}
        </svg>
      </div>
    </div>
  );
}

function SlotTable({
  title,
  points,
  vat,
  intervalMinutes,
}: {
  title: string;
  points: MarketPricePoint[];
  vat: boolean;
  intervalMinutes: 15 | 60;
}) {
  const intervalSec = intervalMinutes * 60;
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4 sm:p-5">
      <div className="text-sm font-semibold text-zinc-50">{title}</div>
      <div className="mt-3 grid gap-2">
        {points.map((p) => (
          <div key={p.ts} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
            <span className="text-sm text-zinc-200">{fmtRangeEt(p.ts, p.ts + intervalSec)}</span>
            <strong className="text-sm font-semibold text-zinc-50">{fmtSnt(p.price_eur_per_kwh, vat)} snt/kWh</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function WindowCard({
  hours,
  pick,
  vat,
  variant = "cheapest",
}: {
  hours: 1 | 2 | 3 | 4;
  pick: { startTs: number; endTs: number; avgEurPerKwh: number } | null;
  vat: boolean;
  variant?: "cheapest" | "priciest";
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4">
      <div className="text-xs text-zinc-400">{variant === "cheapest" ? "Odavaim" : "Kalleim"} {hours}h aken</div>
      <div className="mt-2 text-base font-semibold text-zinc-50">
        {pick ? fmtRangeEt(pick.startTs, pick.endTs) : "—"}
      </div>
      <div className="mt-1 text-sm text-zinc-300">
        {pick ? `${fmtSnt(pick.avgEurPerKwh, vat)} snt/kWh (keskmine)` : "Ei leitud andmeid."}
      </div>
    </div>
  );
}

export function PriceViewClient({
  points,
  intervalMinutes,
  nowTs,
}: {
  points: MarketPricePoint[];
  intervalMinutes: 15 | 60;
  nowTs: number;
}) {
  const [vat, setVat] = useState(true);
  const [viewInterval, setViewInterval] = useState<ViewInterval>(intervalMinutes);
  const [period, setPeriod] = useState<ViewPeriod>("today_tomorrow");

  const sourceInterval = intervalMinutes;
  const effectiveInterval: ViewInterval =
    sourceInterval === 15 ? viewInterval : 60; // if only hourly data, force 60

  const normalizedPoints = useMemo(() => {
    const base = points.slice().sort((a, b) => a.ts - b.ts);
    return effectiveInterval === 60 ? resampleToHourly(base, sourceInterval) : base;
  }, [effectiveInterval, points, sourceInterval]);

  const nowCard = useMemo(
    () => computeNow(normalizedPoints, effectiveInterval, nowTs),
    [normalizedPoints, effectiveInterval, nowTs],
  );

  const dayRefs = useMemo(() => {
    const base = Number.isFinite(nowTs) && nowTs > 0 ? nowTs : 0;
    const today = new Date(base * 1000);
    const tomorrow = new Date((base + 24 * 60 * 60) * 1000);
    const yesterday = new Date((base - 24 * 60 * 60) * 1000);
    return { today, tomorrow, yesterday };
  }, [nowTs]);

  const todayPoints = useMemo(() => splitByLocalDay(normalizedPoints, dayRefs.today), [normalizedPoints, dayRefs.today]);
  const tomorrowPoints = useMemo(
    () => splitByLocalDay(normalizedPoints, dayRefs.tomorrow),
    [normalizedPoints, dayRefs.tomorrow],
  );
  const yesterdayPoints = useMemo(
    () => splitByLocalDay(normalizedPoints, dayRefs.yesterday),
    [normalizedPoints, dayRefs.yesterday],
  );

  const visiblePoints = useMemo(() => {
    if (period === "today") return todayPoints;
    if (period === "tomorrow") return tomorrowPoints;
    return todayPoints.concat(tomorrowPoints).sort((a, b) => a.ts - b.ts);
  }, [period, todayPoints, tomorrowPoints]);

  const statsToday = useMemo(() => summarizeDay(todayPoints), [todayPoints]);
  const statsTomorrow = useMemo(() => summarizeDay(tomorrowPoints), [tomorrowPoints]);
  const statsYesterday = useMemo(() => summarizeDay(yesterdayPoints), [yesterdayPoints]);
  const vol = useMemo(() => volatilityIndex(todayPoints), [todayPoints]);

  const marketOverview = useMemo(() => {
    if (!statsToday) return null;
    const yMean = statsYesterday?.mean ?? null;
    const tMean = statsToday.mean;
    let compared: "odavam" | "sarnane" | "kallim" = "sarnane";
    if (yMean && tMean < yMean * 0.9) compared = "odavam";
    if (yMean && tMean > yMean * 1.1) compared = "kallim";
    const range = statsToday.max - statsToday.min;
    const v = vol?.cv ?? null;
    let volatilityText = "tavapärane";
    if (v !== null && v > 0.55) volatilityText = "kõikuvam";
    if (v !== null && v < 0.25) volatilityText = "stabiilsem";
    return { compared, range, volatilityText };
  }, [statsToday, statsYesterday, vol]);

  const windowPicks = useMemo(() => {
    const cheapest: Record<string, { startTs: number; endTs: number; avgEurPerKwh: number } | null> = {};
    const priciest: Record<string, { startTs: number; endTs: number; avgEurPerKwh: number } | null> = {};
    ([
      1, 2, 3, 4,
    ] as const).forEach((h) => {
      const r = pickBestWindows({ points: todayPoints, intervalMinutes: effectiveInterval, windowHours: h, topN: 1 });
      cheapest[String(h)] = r.cheapest[0] ?? null;
      priciest[String(h)] = r.priciest[0] ?? null;
    });
    return { cheapest, priciest };
  }, [todayPoints, effectiveInterval]);

  const topSlots = useMemo(() => pickTopSlots(todayPoints, 3), [todayPoints]);

  const intervalSec = effectiveInterval * 60;

  return (
    <section className="mt-8 grid grid-cols-1 gap-6 overflow-x-hidden">
      <div className="glass-panel rounded-3xl p-5 sm:p-8">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-50">Börsihinna dashboard</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Eesti (EE) turuhind Eleringi andmetel. Vaikimisi näitame hinna käibemaksuga (24%).
            </p>
          </div>
          <div className="flex min-w-0 flex-wrap gap-2">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/45 px-2 py-1">
              <FilterChip active={!vat} onClick={() => setVat(false)}>
                Ilma KM-ta
              </FilterChip>
              <FilterChip active={vat} onClick={() => setVat(true)}>
                KM-ga
              </FilterChip>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/45 px-2 py-1">
              <FilterChip
                active={effectiveInterval === 15}
                onClick={() => setViewInterval(15)}
                disabled={sourceInterval !== 15}
                title={sourceInterval === 15 ? "15 min vaade" : "15 min andmeid ei ole saadaval"}
              >
                15 min
              </FilterChip>
              <FilterChip active={effectiveInterval === 60} onClick={() => setViewInterval(60)}>
                1h
              </FilterChip>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/45 px-2 py-1">
              <FilterChip active={period === "today"} onClick={() => setPeriod("today")}>
                Täna
              </FilterChip>
              <FilterChip active={period === "today_tomorrow"} onClick={() => setPeriod("today_tomorrow")}>
                Täna + homme
              </FilterChip>
              <FilterChip active={period === "tomorrow"} onClick={() => setPeriod("tomorrow")}>
                Homme
              </FilterChip>
            </div>
          </div>
        </div>

        {/* A) Summary cards */}
        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="rounded-2xl border border-emerald-300/25 bg-gradient-to-br from-emerald-400/15 to-teal-400/10 p-4 shadow-[0_0_30px_rgba(20,184,166,0.12)] lg:col-span-5">
            <div className="text-xs uppercase tracking-wide text-emerald-100/80">{nowCard?.label ?? "Praegune hind"}</div>
            <div className="mt-2 flex items-end gap-2">
              <div className="text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
                {nowCard ? fmtSnt(nowCard.eurPerKwh, vat) : "—"}
              </div>
              <span className="pb-1 text-sm font-medium text-emerald-100/80">snt/kWh</span>
            </div>
            <div className="mt-2 text-xs text-emerald-100/70">
              {nowCard ? fmtRangeEt(nowCard.startTs, nowCard.endTs) : "Aknainfo puudub"}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-7 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4">
              <div className="text-xs text-zinc-400">Päeva min</div>
              <div className="mt-1 text-2xl font-semibold text-zinc-50">{statsToday ? fmtSnt(statsToday.min, vat) : "—"}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4">
              <div className="text-xs text-zinc-400">Päeva max</div>
              <div className="mt-1 text-2xl font-semibold text-zinc-50">{statsToday ? fmtSnt(statsToday.max, vat) : "—"}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4">
              <div className="text-xs text-zinc-400">Päeva keskmine</div>
              <div className="mt-1 text-2xl font-semibold text-zinc-50">{statsToday ? fmtSnt(statsToday.mean, vat) : "—"}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4">
              <div className="text-xs text-zinc-400">Homme keskmine</div>
              <div className="mt-1 text-2xl font-semibold text-zinc-50">{statsTomorrow ? fmtSnt(statsTomorrow.mean, vat) : "—"}</div>
            </div>
          </div>
        </div>

        {/* B) Main chart */}
        <div className="mt-5 rounded-3xl border border-white/10 bg-zinc-950/45 p-4 sm:p-6 lg:rounded-[28px]">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-zinc-50">Hinnagraafik</div>
              <div className="mt-1 text-xs text-zinc-400">
                Hover: näed täpset hinda. Marker näitab “praegu” lähimat punkti.
              </div>
            </div>
          <div className="text-xs text-zinc-400">
              Vaade: {effectiveInterval === 15 ? "15 min" : "1h"} · Periood:{" "}
              {period === "today" ? "täna" : period === "tomorrow" ? "homme" : "täna + homme"}
            </div>
          </div>
          <div className="-mx-1 sm:mx-0">
            <HeatRow points={visiblePoints} vat={vat} />
            <AreaChart points={visiblePoints} vat={vat} nowTs={nowTs} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-12">
          <div className="grid grid-cols-1 gap-4 lg:col-span-7">
            <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4 sm:p-5">
              <div className="mb-3 text-sm font-semibold text-zinc-50">Odavaimad aknad</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <WindowCard hours={1} pick={windowPicks.cheapest["1"]} vat={vat} variant="cheapest" />
                <WindowCard hours={2} pick={windowPicks.cheapest["2"]} vat={vat} variant="cheapest" />
                <WindowCard hours={3} pick={windowPicks.cheapest["3"]} vat={vat} variant="cheapest" />
                <WindowCard hours={4} pick={windowPicks.cheapest["4"]} vat={vat} variant="cheapest" />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4 sm:p-5">
              <div className="mb-3 text-sm font-semibold text-zinc-50">Kalleimad aknad</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <WindowCard hours={1} pick={windowPicks.priciest["1"]} vat={vat} variant="priciest" />
                <WindowCard hours={2} pick={windowPicks.priciest["2"]} vat={vat} variant="priciest" />
                <WindowCard hours={3} pick={windowPicks.priciest["3"]} vat={vat} variant="priciest" />
                <WindowCard hours={4} pick={windowPicks.priciest["4"]} vat={vat} variant="priciest" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:col-span-5">
            <SlotTable title="Odavaimad 3 perioodi" points={topSlots.cheapest} vat={vat} intervalMinutes={intervalMinutes} />
            <SlotTable title="Kalleimad 3 perioodi" points={topSlots.priciest} vat={vat} intervalMinutes={intervalMinutes} />
          </div>
        </div>

      </div>

      {/* C) Price table + market overview */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-50">Hinnatabel</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Hind ilma KM-ta ja KM-ga, koos lihtsa märgistusega (odav/keskmine/kallis/tipp).
            </p>
          </div>
          {marketOverview ? (
            <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-4 text-sm text-zinc-200">
              <div className="text-xs text-zinc-400">Turu ülevaade</div>
              <div className="mt-1 text-zinc-100">
                Täna on keskmise hinna järgi <strong>{marketOverview.compared}</strong> kui eile.
              </div>
              <div className="mt-1 text-xs text-zinc-400">
                Vahemik: {statsToday ? fmtSnt(statsToday.min, vat) : "—"}–{statsToday ? fmtSnt(statsToday.max, vat) : "—"} snt ·
                Kõikumine: {marketOverview.volatilityText}
              </div>
            </div>
          ) : null}
        </div>

        {visiblePoints.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-white/12 bg-white/[0.04] p-4 text-sm text-zinc-200">
            Andmeid ei ole saadaval.
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/35">
            <div className="grid gap-2 p-2 sm:hidden">
              {(() => {
                const dayStats = summarizeDay(visiblePoints);
                const mean = dayStats?.mean ?? 0;
                const vi = volatilityIndex(visiblePoints);
                const std = vi?.std ?? 0;
                return visiblePoints
                  .slice()
                  .sort((a, b) => a.ts - b.ts)
                  .map((p) => {
                    const cls = priceClass(p.price_eur_per_kwh, mean, std);
                    const isNow = Math.abs(p.ts - nowTs) <= intervalSec / 2;
                    return (
                      <article
                        key={p.ts}
                        className={`rounded-xl border p-3 ${
                          isNow
                            ? "border-emerald-300/35 bg-emerald-400/10"
                            : "border-white/12 bg-zinc-950/46"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-medium text-zinc-100">
                            {fmtRangeEt(p.ts, p.ts + intervalSec)}
                          </div>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${cls.pill}`}>
                            {cls.label}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-lg border border-white/12 bg-white/[0.04] p-2">
                            <div className="text-zinc-300">Ilma KM-ta</div>
                            <div className="mt-1 text-sm font-semibold text-zinc-50">
                              {fmtSnt(p.price_eur_per_kwh, false)} snt/kWh
                            </div>
                          </div>
                          <div className="rounded-lg border border-white/12 bg-white/[0.04] p-2">
                            <div className="text-zinc-300">KM-ga</div>
                            <div className="mt-1 text-sm font-semibold text-zinc-50">
                              {fmtSnt(p.price_eur_per_kwh, true)} snt/kWh
                            </div>
                          </div>
                        </div>
                        {isNow ? <div className="mt-2 text-xs text-emerald-200">Praegu aktiivne periood</div> : null}
                      </article>
                    );
                  });
              })()}
            </div>

            <div className="hidden max-w-full overflow-x-auto sm:block">
              <table className="min-w-[680px] w-full text-sm">
                <thead className="bg-white/[0.05] text-zinc-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Aeg</th>
                    <th className="px-4 py-3 text-right font-medium">Ilma KM-ta (snt/kWh)</th>
                    <th className="px-4 py-3 text-right font-medium">KM-ga (snt/kWh)</th>
                    <th className="px-4 py-3 text-left font-medium">Staatus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/12">
                  {(() => {
                    const dayStats = summarizeDay(visiblePoints);
                    const mean = dayStats?.mean ?? 0;
                    const vi = volatilityIndex(visiblePoints);
                    const std = vi?.std ?? 0;
                    return visiblePoints
                      .slice()
                      .sort((a, b) => a.ts - b.ts)
                      .map((p) => {
                        const cls = priceClass(p.price_eur_per_kwh, mean, std);
                        const isNow = Math.abs(p.ts - nowTs) <= intervalSec / 2;
                        return (
                          <tr key={p.ts} className={isNow ? "bg-teal-400/12" : "bg-transparent hover:bg-white/[0.04]"}>
                            <td className="px-4 py-3 text-zinc-100">{fmtRangeEt(p.ts, p.ts + intervalSec)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-zinc-50">
                              {fmtSnt(p.price_eur_per_kwh, false)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-zinc-50">
                              {fmtSnt(p.price_eur_per_kwh, true)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${cls.pill}`}>
                                {cls.label}
                              </span>
                              {isNow ? <span className="ml-2 text-xs text-emerald-200/80">praegu</span> : null}
                            </td>
                          </tr>
                        );
                      });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

