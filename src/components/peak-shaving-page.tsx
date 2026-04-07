"use client";

import { canViewFullAnalysis } from "@/lib/unlock";
import { useProjectUnlock } from "@/lib/useProjectUnlock";
import { PaywallCard } from "@/components/paywall-card";

export function PeakShavingPageClient() {
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
        <h2 className="text-2xl font-semibold text-zinc-50">Peak shaving / ettevõtte võimsus</h2>
        <p className="mt-2 text-sm text-zinc-400">
          See moodul on valmimas. Siia lisandub tippude lõikamise hinnang (tasuta) ning täpne simulatsioon
          15-min CSV tarbimisest (täisanalüüs).
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-300">
          <p className="font-medium text-zinc-100">Tasuta ülevaade</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Hinnang säästule võrgutasus ja võimsustasudes (lihtsustatud)</li>
            <li>Soovituslik aku suurus (kWh/kW) ligikaudse rusikareeglina</li>
          </ul>
        </div>
      </section>

      <PaywallCard
        locked={!canViewFullAnalysis(unlock)}
        title="Täisanalüüs"
        description="avab 15-min tarbimisprofiili simulatsiooni, tippude analüüsi ja rahavoo tabelina selle projekti jaoks."
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
          Täisanalüüs lisab CSV impordi, 15-min simulatsiooni, võrgutasu loogika ja juhtkonna-stiilis raporti.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            ["CSV import", "15-min tarbimisprofiil, normaliseerimine ja kontroll."],
            ["Tipud", "Mitu tippu saab lõigata ja mis aku on mõistlik."],
            ["Rahavoog", "Investeering vs sääst aastate lõikes."],
            ["Raport", "PDF kokkuvõte (eraldi ost)."],
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

