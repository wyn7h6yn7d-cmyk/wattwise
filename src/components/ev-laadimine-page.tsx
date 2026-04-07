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

const chargerStepsKw = [2.3, 3.7, 7.4, 11, 22] as const;

function pickStep(maxKw: number) {
  const safe = Math.max(maxKw, 0);
  let chosen = 0;
  for (const s of chargerStepsKw) {
    if (s <= safe + 1e-6) chosen = s;
  }
  return chosen;
}

const fmtEur = (value: number) =>
  new Intl.NumberFormat("et-EE", { maximumFractionDigits: 2 }).format(value) + " €";

export function EvLaadiminePageClient() {
  const { projectId, unlock, purchaseBusy, startCheckout, checkPaymentStatus, message, setMessage } =
    useProjectUnlock();

  const [batteryKwh, setBatteryKwh] = useState("60");
  const [energyToChargeKwh, setEnergyToChargeKwh] = useState("30");
  const [chargerKw, setChargerKw] = useState("11");
  const [priceEurKwh, setPriceEurKwh] = useState("0,16");
  const [phase, setPhase] = useState<"1" | "3">("3");
  const [mainFuseA, setMainFuseA] = useState("25");
  const [reserveKw, setReserveKw] = useState("2"); // muu koormus majas

  const result = useMemo(() => {
    const energy = Math.max(toNumber(energyToChargeKwh), 0);
    const power = Math.max(toNumber(chargerKw), 0.1);
    const price = Math.max(toNumber(priceEurKwh), 0);
    const fuseA = Math.max(toNumber(mainFuseA), 0);
    const reserve = Math.max(toNumber(reserveKw), 0);

    const timeH = energy / power;
    const cost = energy * price;

    const reserveFactor = 0.8; // ära kasuta peakaitset 100%
    const p1 = (230 * fuseA * reserveFactor) / 1000 - reserve;
    const p3 = (Math.sqrt(3) * 400 * fuseA * reserveFactor) / 1000 - reserve;

    const rec1 = pickStep(p1);
    const rec3 = pickStep(p3);

    const note =
      phase === "1"
        ? power <= rec1 || rec1 === 0
          ? "Valitud laadija peaks peakaitse mõttes sobima (arvestades reservi)."
          : "Valitud laadija on peakaitse mõttes tõenäoliselt liiga suur (arvestades reservi)."
        : power <= rec3 || rec3 === 0
          ? "Valitud laadija peaks peakaitse mõttes sobima (arvestades reservi)."
          : "Valitud laadija on peakaitse mõttes tõenäoliselt liiga suur (arvestades reservi).";

    return { timeH, cost, rec1, rec3, p1, p3, note };
  }, [chargerKw, energyToChargeKwh, mainFuseA, phase, priceEurKwh, reserveKw]);

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
          Hinda laadimise aega ja kulu ning vaata, millist laadija võimsust peakaitse tõenäoliselt kannatab.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="card">
            <h3 className="section-title">Sisendid</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-100">Auto aku maht (kWh)</span>
                <input className="input" value={batteryKwh} inputMode="decimal" onChange={(e) => setBatteryKwh(e.target.value)} />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-100">Laaditav energia (kWh)</span>
                <input className="input" value={energyToChargeKwh} inputMode="decimal" onChange={(e) => setEnergyToChargeKwh(e.target.value)} />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-100">Laadija võimsus (kW)</span>
                <input className="input" value={chargerKw} inputMode="decimal" onChange={(e) => setChargerKw(e.target.value)} />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-100">Elektrihind (€/kWh)</span>
                <input className="input" value={priceEurKwh} inputMode="decimal" onChange={(e) => setPriceEurKwh(e.target.value)} />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-100">Süsteem</span>
                <select className="input" value={phase} onChange={(e) => setPhase(e.target.value as "1" | "3")}>
                  <option value="1">1-faasiline</option>
                  <option value="3">3-faasiline</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-100">Peakaitse (A)</span>
                <input className="input" value={mainFuseA} inputMode="numeric" onChange={(e) => setMainFuseA(e.target.value)} />
              </label>
              <label className="grid gap-2 text-sm sm:col-span-2">
                <span className="text-zinc-100">Muud koormused majas (reserv, kW)</span>
                <input className="input" value={reserveKw} inputMode="decimal" onChange={(e) => setReserveKw(e.target.value)} />
              </label>
            </div>
            <p className="mt-3 text-xs text-zinc-400">
              Loogika: 1-faasiline \(P \approx 230V \times I\), 3-faasiline \(P \approx \sqrt{3} \times 400V \times I\). Lisame ~20% varu ning lahutame “reservi”.
            </p>
          </article>

          <article className="card">
            <h3 className="section-title">Tulemused</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="result-card">
                <p>Laadimise aeg</p>
                <strong>
                  {Number.isFinite(result.timeH)
                    ? `${Math.floor(result.timeH)} h ${Math.round((result.timeH % 1) * 60)} min`
                    : "—"}
                </strong>
              </div>
              <div className="result-card">
                <p>Laadimise maksumus</p>
                <strong>{fmtEur(result.cost)}</strong>
              </div>
              <div className="result-card sm:col-span-2">
                <p>Soovituslik 1-faasiline laadija</p>
                <strong>{result.rec1 ? `${result.rec1} kW` : "2.3 kW või väiksem"}</strong>
              </div>
              <div className="result-card sm:col-span-2">
                <p>Soovituslik 3-faasiline laadija</p>
                <strong>{result.rec3 ? `${result.rec3} kW` : "3.7 kW või väiksem"}</strong>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-zinc-200">
              <p className="font-medium text-zinc-50">Hinnang</p>
              <p className="mt-1 text-zinc-300">{result.note}</p>
              <p className="mt-2 text-xs text-zinc-400">
                Eeldatav “EV jaoks vaba võimsus”: 1-faasiline ~{result.p1.toFixed(1)} kW, 3-faasiline ~{result.p3.toFixed(1)} kW.
                22 kW ei ole paljude koduste peakaitsete juures realistlik.
              </p>
            </div>
          </article>
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

