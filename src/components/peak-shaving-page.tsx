"use client";

import { canViewFullAnalysis } from "@/lib/unlock";
import { useProjectUnlock } from "@/lib/useProjectUnlock";
import { PaywallCard } from "@/components/paywall-card";
import { useMemo, useState } from "react";

function toNumber(value: string) {
  if (!value.trim()) return 0;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

const fmtEur = (value: number) =>
  new Intl.NumberFormat("et-EE", { maximumFractionDigits: 0 }).format(value) + " €";

export function PeakShavingPageClient() {
  const { projectId, unlock, purchaseBusy, startCheckout, checkPaymentStatus, message, setMessage } =
    useProjectUnlock();

  const [currentPeakKw, setCurrentPeakKw] = useState("120");
  const [targetLimitKw, setTargetLimitKw] = useState("90");
  const [batteryKwh, setBatteryKwh] = useState("150");
  const [batteryKw, setBatteryKw] = useState("60");
  const [peakHours, setPeakHours] = useState("1");
  const [demandFeeEurPerKwMonth, setDemandFeeEurPerKwMonth] = useState("6,5");

  const result = useMemo(() => {
    const peak = Math.max(toNumber(currentPeakKw), 0);
    const limit = Math.max(toNumber(targetLimitKw), 0);
    const battKwh = Math.max(toNumber(batteryKwh), 0);
    const battKw = Math.max(toNumber(batteryKw), 0);
    const hours = Math.max(toNumber(peakHours), 0.25);
    const fee = Math.max(toNumber(demandFeeEurPerKwMonth), 0);

    const needCut = Math.max(peak - limit, 0);
    const energyLimitedCut = battKwh / hours;
    const achievableCut = Math.max(Math.min(needCut, battKw, energyLimitedCut), 0);

    const powerOk = battKw >= achievableCut && needCut > 0;
    const energyOk = battKwh >= achievableCut * hours && needCut > 0;

    const annualSavings = achievableCut * fee * 12;
    const note =
      needCut <= 0
        ? "Sinu sisendi põhjal pole vaja tippu lõigata (piir on juba piisav)."
        : achievableCut <= 0
          ? "Aku parameetritega ei saa tippu sisuliselt lõigata."
          : achievableCut < needCut
            ? "Aku piirab lõikamist (võimsus või energia ei pruugi täielikult piisata)."
            : "Aku parameetritega on tippude lõikamine selle piirini realistlik.";

    return { needCut, achievableCut, annualSavings, powerOk, energyOk, note, hours, fee };
  }, [batteryKw, batteryKwh, currentPeakKw, demandFeeEurPerKwMonth, peakHours, targetLimitKw]);

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
          Lihtne hinnang, kui palju tippu saab akuga lõigata ja mis võiks olla sääst võimsustasudes.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="card">
            <h3 className="section-title">Sisendid</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-100">Olemasolev tipukoormus (kW)</span>
                <input className="input" value={currentPeakKw} inputMode="decimal" onChange={(e) => setCurrentPeakKw(e.target.value)} />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-100">Soovitud piir (kW)</span>
                <input className="input" value={targetLimitKw} inputMode="decimal" onChange={(e) => setTargetLimitKw(e.target.value)} />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-100">Aku suurus (kWh)</span>
                <input className="input" value={batteryKwh} inputMode="decimal" onChange={(e) => setBatteryKwh(e.target.value)} />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-100">Aku võimsus (kW)</span>
                <input className="input" value={batteryKw} inputMode="decimal" onChange={(e) => setBatteryKw(e.target.value)} />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-100">Tiputunni kestus (h)</span>
                <input className="input" value={peakHours} inputMode="decimal" onChange={(e) => setPeakHours(e.target.value)} />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-100">Võimsustasu (€/kW/kuu)</span>
                <input className="input" value={demandFeeEurPerKwMonth} inputMode="decimal" onChange={(e) => setDemandFeeEurPerKwMonth(e.target.value)} />
              </label>
            </div>
            <p className="mt-3 text-xs text-zinc-400">
              Mudel: lõigatav tipp = min(\(peak-limit\), aku kW, aku kWh / tiputund).
            </p>
          </article>

          <article className="card">
            <h3 className="section-title">Tulemused</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="result-card">
                <p>Vajalik lõige</p>
                <strong>{result.needCut.toFixed(1)} kW</strong>
              </div>
              <div className="result-card">
                <p>Saavutatav lõige</p>
                <strong>{result.achievableCut.toFixed(1)} kW</strong>
              </div>
              <div className="result-card sm:col-span-2">
                <p>Hinnanguline sääst aastas</p>
                <strong>{fmtEur(result.annualSavings)}</strong>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-zinc-200">
              <p className="font-medium text-zinc-50">Soovitus</p>
              <p className="mt-1 text-zinc-300">{result.note}</p>
            </div>
            <div className="mt-3 grid gap-2 text-sm">
              <div className="compare-row">
                <span className="compare-label">Aku võimsus piisav?</span>
                <strong>{result.needCut <= 0 ? "—" : result.powerOk ? "Jah" : "Piirab"}</strong>
              </div>
              <div className="compare-row">
                <span className="compare-label">Aku energia piisav (kestus {result.hours}h)?</span>
                <strong>{result.needCut <= 0 ? "—" : result.energyOk ? "Jah" : "Piirab"}</strong>
              </div>
            </div>
          </article>
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
        <h3 className="text-xl font-semibold text-zinc-50">Täisanalüüs: detailsem simulatsioon</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Täisanalüüs lisab 15-min tarbimisprofiili põhise simulatsiooni, stsenaariumid ja selgema rahavoo.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            ["CSV import", "15-min tarbimisprofiil, normaliseerimine ja kontroll."],
            ["Stsenaariumid", "Võrdle eri piire, aku suurusi ja tiputunde."],
            ["Raport", "PDF kokkuvõte (eraldi ost) ning projekti dokumentatsioon."],
            ["Soovitused", "Praktiline “mis on mõistlik aku kW/kWh” soovitus."],
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

