"use client";

import { useMemo, useState } from "react";

function formatEurCompact(n: number) {
  return `${Math.round(n).toLocaleString("et-EE")} €`;
}

export function MiniCashflowChart({
  cashflows,
  height = 280,
}: {
  cashflows: number[];
  height?: number;
}) {
  const values = cashflows.filter((v) => Number.isFinite(v));
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1e-9);
  const isFlatSeries = Math.abs(max - min) < 1e-3;
  const [hover, setHover] = useState<number | null>(null);

  const yTicks = useMemo(() => {
    if (isFlatSeries) return [max];
    const mid = min + span * 0.5;
    const raw = [max, mid, min];
    const out: number[] = [];
    const seen = new Set<string>();
    for (const t of raw) {
      const key = String(Math.round(t));
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(t);
    }
    return out.length >= 2 ? out : [max];
  }, [isFlatSeries, max, min, span]);

  const barAreaStyle = { height } as const;
  const padBottom = 10;
  const usableH = Math.max(height - padBottom, 24);

  return (
    <div className="w-full min-w-0">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>Rahavoog (aastad)</span>
        <span>{values.length} a</span>
      </div>
      <div className="mt-3 flex gap-2 sm:gap-3">
        <div
          className="flex w-[3.25rem] shrink-0 flex-col justify-between text-right text-[10px] leading-tight text-zinc-500 sm:w-14 sm:text-[11px]"
          style={barAreaStyle}
        >
          {yTicks.map((tick, idx) => (
            <span key={`${idx}-${tick}`}>{formatEurCompact(tick)}</span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          {hover !== null ? (
            <div className="chart-tooltip pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-zinc-900/95 px-2 py-1 text-[11px] text-zinc-100 shadow-lg">
              Aasta {hover + 1}: {formatEurCompact(values[hover]!)}
            </div>
          ) : null}
          <div className="relative overflow-hidden rounded-md bg-white/[0.02]" style={barAreaStyle}>
            <div className="pointer-events-none absolute inset-0 grid grid-rows-3">
              <div className="border-b border-white/10" />
              <div className="border-b border-white/10" />
              <div />
            </div>
            <div className="relative flex h-full items-end gap-1 px-1 pb-1 sm:gap-1.5">
              {values.map((v, i) => {
                const t = isFlatSeries ? 0.5 : (v - min) / span;
                const h = Math.max(14, Math.round(t * usableH));
                const positive = v >= 0;
                const color = positive
                  ? "from-emerald-400/85 to-teal-300/75"
                  : "from-rose-400/80 to-amber-500/55";
                return (
                  <button
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    type="button"
                    className={`min-w-[6px] flex-1 rounded-sm bg-gradient-to-t ${color} transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40`}
                    style={{ height: `${h}px` }}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    aria-label={`Aasta ${i + 1}: ${Math.round(v)} eurot`}
                  />
                );
              })}
            </div>
          </div>
          <div className="mt-1 flex justify-between text-[10px] tabular-nums text-zinc-500">
            <span>A1</span>
            <span>A{Math.max(2, Math.ceil(values.length / 2))}</span>
            <span>A{values.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
