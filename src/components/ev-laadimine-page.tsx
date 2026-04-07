"use client";

import { canViewFullAnalysis } from "@/lib/unlock";
import { useProjectUnlock } from "@/lib/useProjectUnlock";
import { PaywallCard } from "@/components/paywall-card";

export function EvLaadiminePageClient() {
  const { projectId, unlock, purchaseBusy, startCheckout, checkPaymentStatus, message, setMessage } =
    useProjectUnlock();

  return (
    <div className="grid gap-6">
      {message ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>{message}</p>
            <button type="button" className="btn-ghost" onClick={() => setMessage(null)}>
              Peida
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn-ghost" onClick={checkPaymentStatus}>
              Kontrolli makse staatust
            </button>
          </div>
        </div>
      ) : null}

      <section className="glass-panel rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-zinc-50">EV laadimise kalkulaator</h2>
        <p className="mt-2 text-sm text-zinc-400">
          See moodul on valmimas. Siia lisandub laadimisakna, võimsuse ja spot-hindade põhine soovituslik
          ajakava.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-300">
          <p className="font-medium text-zinc-100">Tasuta ülevaade</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Laadimiseks kuluva aja hinnang</li>
            <li>Ligikaudne kulu käsitsi sisestatud hinnaga</li>
          </ul>
        </div>
      </section>

      <PaywallCard
        locked={!canViewFullAnalysis(unlock)}
        title="Täisanalüüs"
        description="avab odavaimate tundide leidmise, laadimisplaani ja ekspordi selle projekti jaoks."
        ctaLabel={purchaseBusy === "full_analysis" ? "Suunamine..." : "Ava Täisanalüüs 9,99 €"}
        secondaryLabel="Kontrolli makse staatust"
        onCta={() => startCheckout("full_analysis")}
        onSecondary={checkPaymentStatus}
        footer={
          <>
            Projekt: <span className="font-medium text-zinc-200">{projectId}</span>
          </>
        }
      >
        <h3 className="text-xl font-semibold text-zinc-50">Täpne ajakava (lukus)</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Täisanalüüs lisab Eleringi spot-hindade põhise “odavaimad tunnid” valiku, reeglid ja ekspordi.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            ["Spot-hinnad", "Odavaimate tundide leidmine Eleringi andmetega."],
            ["Ajakava", "Auto saabumise/valmisoleku akna põhine plaan."],
            ["Reeglid", "“Lae ainult kui hind < X” jne."],
            ["Eksport", "Laadimisgraafiku eksport."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="text-sm font-semibold text-zinc-50">{t}</div>
              <div className="mt-2 text-sm text-zinc-400">{d}</div>
            </div>
          ))}
        </div>
      </PaywallCard>
    </div>
  );
}

