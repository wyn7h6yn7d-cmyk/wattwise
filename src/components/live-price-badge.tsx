"use client";

import { useEffect, useMemo, useState } from "react";
import { eurMWhToSntKWhWithVat, formatSntKWh } from "@/lib/elering";

type BadgeData =
  | {
      ok: true;
      label: string;
      sntPerKwh: number;
      intervalMinutes: 15 | 60;
      ts: number;
    }
  | { ok: false; message: string };

function toIso(d: Date) {
  return d.toISOString();
}

export function LivePriceBadge() {
  const [data, setData] = useState<BadgeData | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const now = new Date();
        const start = new Date(now.getTime() - 1000 * 60 * 60 * 3);
        const end = new Date(now.getTime() + 1000 * 60 * 60 * 6);
        const res = await fetch(`/api/elering/nps?area=EE&start=${encodeURIComponent(toIso(start))}&end=${encodeURIComponent(toIso(end))}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Börsihinda ei õnnestunud laadida");
        const series = (await res.json()) as {
          intervalMinutes: 15 | 60;
          points: Array<{ ts: number; price_eur_per_kwh: number }>;
        };

        const points = (series.points ?? []).slice().sort((a, b) => a.ts - b.ts);
        if (points.length === 0) throw new Error("Hinnaandmed puuduvad");

        const nowTs = Math.floor(Date.now() / 1000);
        const intervalSec = (series.intervalMinutes ?? 60) * 60;

        const current =
          points.findLast?.((p) => p.ts <= nowTs) ??
          (() => {
            // Safari <16.4: fallback for findLast
            for (let i = points.length - 1; i >= 0; i -= 1) {
              if (points[i].ts <= nowTs) return points[i];
            }
            return null;
          })();

        const next = points.find((p) => p.ts > nowTs) ?? null;
        const chosen = current ?? next ?? points[0];
        const chosenIsNext = Boolean(current && next && chosen.ts === next.ts) || (!current && Boolean(next));

        // Elering hind on EUR/MWh; API route normaliseerib selle EUR/kWh-ks.
        const eurPerKwh = chosen.price_eur_per_kwh;
        const eurPerMWh = eurPerKwh * 1000;
        const sntPerKwhVat = eurMWhToSntKWhWithVat(eurPerMWh);

        const label =
          series.intervalMinutes === 15
            ? chosenIsNext
              ? "Järgmine 15 min"
              : "Praegu"
            : chosenIsNext
              ? "Järgmine tund"
              : "Praegune tund";

        if (!alive) return;
        setData({
          ok: true,
          label,
          sntPerKwh: sntPerKwhVat,
          intervalMinutes: series.intervalMinutes ?? 60,
          ts: chosen.ts,
        });
      } catch (e) {
        if (!alive) return;
        setData({ ok: false, message: e instanceof Error ? e.message : "Börsihinda ei õnnestunud laadida" });
      }
    }

    load();
    const id = window.setInterval(load, 60_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const content = useMemo(() => {
    if (!data) return { title: "Laen börsihinda…", value: "—", subtle: "" };
    if (!data.ok) return { title: data.message, value: "—", subtle: "" };
    return {
      title: data.label,
      value: `${formatSntKWh(data.sntPerKwh)} snt/kWh`,
      subtle: "KM-ga",
    };
  }, [data]);

  return (
    <div
      className="hidden sm:inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-100 shadow-[0_0_22px_rgba(16,185,129,0.10)]"
      aria-label="Börsihind (KM-ga)"
      title="Elering / Nord Pool turuhind, KM-ga"
    >
      <span className="text-emerald-200/90">{content.title}</span>
      <span className="h-4 w-px bg-emerald-200/20" />
      <span className="font-semibold text-zinc-50">{content.value}</span>
      {content.subtle ? <span className="text-emerald-200/70">{content.subtle}</span> : null}
    </div>
  );
}

