"use client";

import { canViewFullAnalysis } from "@/lib/unlock";
import { useProjectUnlock } from "@/lib/useProjectUnlock";
import { PaywallCard } from "@/components/paywall-card";

export function ElektripaketidPageClient() {
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
        <h2 className="text-2xl font-semibold text-zinc-50">Elektripaketi võrdlus</h2>
        <p className="mt-2 text-sm text-zinc-400">
          See moodul on valmimas. Siia lisandub spot vs fikseeritud pakettide võrdlus, koos võrgutasu ja
          maksude lülititega.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-300">
          <p className="font-medium text-zinc-100">Tasuta ülevaade</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Aastakulu ja kuukulu võrdlus (lihtsustatud)</li>
            <li>Selgitus, millal spot võib olla mõistlik</li>
          </ul>
        </div>
      </section>

      <PaywallCard
        locked={!canViewFullAnalysis(unlock)}
        title="Täisanalüüs"
        description="avab tunnipõhise simulatsiooni, CSV tarbimise impordi ja detailse võrdluse selle projekti jaoks."
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
        <h3 className="text-xl font-semibold text-zinc-50">Täpne simulatsioon (lukus)</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Täisanalüüs lisab spot-hindade päringu (serverist), tunnipõhise arvutuse ning PDF kokkuvõtte.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            ["CSV import", "Tunnipõhine tarbimine (hourly/15-min normaliseerimine)."],
            ["Eleringi spot-hinnad", "Simulatsioon päris hinnaandmetega."],
            ["Võrgutasu ja maksud", "Lülitid + selged eeldused."],
            ["Raport", "PDF jagamiseks (eraldi ost)."],
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

