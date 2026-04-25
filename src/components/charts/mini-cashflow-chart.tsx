"use client";

import { useMemo, useState } from "react";

export function MiniCashflowChart({
  cashflows,
  height = 120,
}: {
  cashflows: number[];
  height?: number;
}) {
  const values = cashflows.filter((v) => Number.isFinite(v));
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1e-9);
  const [hover, setHover] = useState<number | null>(null);
  const axisTicks = useMemo(() => [max, min + span * 0.5, min], [max, min, span]);

  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-zinc-950/40 p-4">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>Rahavoog (aastad)</span>
        <span>{values.length} a</span>
      </div>
      <div className="mt-3 grid grid-cols-[auto,1fr] gap-3">
        <div className="grid h-full min-h-[120px] w-10 content-between text-[10px] text-zinc-500">
          {axisTicks.map((tick, idx) => (
            <span key={`${tick}-${idx}`}>{Math.round(tick).toLocaleString("et-EE")}€</span>
          ))}
        </div>
        <div className="relative">
          {hover !== null ? (
            <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 rounded-lg border border-emerald-300/30 bg-zinc-950/95 px-2 py-1 text-[11px] text-emerald-100 shadow-[0_0_18px_rgba(16,185,129,0.18)]">
              Aasta {hover + 1}: {Math.round(values[hover]).toLocaleString("et-EE")} €
            </div>
          ) : null}
          <div className="pointer-events-none absolute inset-0 grid grid-rows-3">
            <div className="border-b border-white/10" />
            <div className="border-b border-white/10" />
            <div />
          </div>
          <div className="relative mt-0.5 flex items-end gap-1" style={{ height }}>
            {values.map((v, i) => {
              const t = (v - min) / span;
              const h = Math.max(2, Math.round(t * (height - 6)));
              const positive = v >= 0;
              const color = positive
                ? "from-emerald-400/85 to-teal-300/75"
                : "from-emerald-500/45 to-teal-400/35";
              return (
                <button
                  // eslint-disable-next-line react/no-array-index-key
                  key={i}
                  type="button"
                  className={`flex-1 rounded-sm bg-gradient-to-t ${color} transition-opacity hover:opacity-95`}
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
          <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
            <span>A1</span>
            <span>A{Math.max(1, Math.ceil(values.length / 2))}</span>
            <span>A{values.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

