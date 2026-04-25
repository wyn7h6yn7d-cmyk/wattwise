"use client";

import { canViewFullAnalysis } from "@/lib/unlock";
import { useProjectUnlock } from "@/lib/useProjectUnlock";
import { PaywallCard } from "@/components/paywall-card";
import { useMemo, useState } from "react";
import {
  chargingCost,
  chargingTimeHours,
  mainFusePower1fKw,
  mainFusePower3fKw,
  pickChargerStepKw,
  usableChargingPowerKw,
} from "@/lib/calculators/ev";

function toNumber(value: string) {
  if (!value.trim()) return 0;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
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

    const timeH = chargingTimeHours(energy, power);
    const cost = chargingCost(energy, price);

    // peakaitsme_kW:
    // 1f_kW = 230 * A / 1000
    // 3f_kW = sqrt(3) * 400 * A / 1000
    // kasutatav = peakaitsme_kW * 0.8 - muu_reserv_kW
    const peak1fKw = mainFusePower1fKw(fuseA);
    const peak3fKw = mainFusePower3fKw(fuseA);
    const p1 = usableChargingPowerKw(peak1fKw, reserve);
    const p3 = usableChargingPowerKw(peak3fKw, reserve);

    const rec1 = pickChargerStepKw(p1);
    const rec3 = pickChargerStepKw(p3);

    const note =
      phase === "1"
        ? power <= rec1 || rec1 === 0
          ? "Valitud laadija peaks peakaitse mõttes sobima (arvestades reservi)."
          : "Valitud laadija on peakaitse mõttes tõenäoliselt liiga suur (arvestades reservi)."
        : power <= rec3 || rec3 === 0
          ? "Valitud laadija peaks peakaitse mõttes sobima (arvestades reservi)."
          : "Valitud laadija on peakaitse mõttes tõenäoliselt liiga suur (arvestades reservi).";

    const warning22kw =
      rec3 < 22
        ? "22 kW ei ole selle peakaitsme ja reserviga realistlik. Enamasti sobib 11 kW või madalam."
        : null;

    return { timeH, cost, rec1, rec3, p1, p3, note, warning22kw };
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
              Kontrolli ligipääsu staatust
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
              <label className="field-label">
                <span className="field-label-text">Auto aku maht (kWh)</span>
                <input className="input" value={batteryKwh} inputMode="decimal" onChange={(e) => setBatteryKwh(e.target.value)} />
                <span className="field-hint">Aku kogu mahutavus.</span>
              </label>
              <label className="field-label">
                <span className="field-label-text">Laaditav energia (kWh)</span>
                <input
                  className={`input ${toNumber(energyToChargeKwh) <= 0 ? "input-warning" : ""}`}
                  value={energyToChargeKwh}
                  inputMode="decimal"
                  onChange={(e) => setEnergyToChargeKwh(e.target.value)}
                />
                <span className="field-hint">Kui palju energiat soovid juurde laadida.</span>
              </label>
              <label className="field-label">
                <span className="field-label-text">Laadija võimsus (kW)</span>
                <input
                  className={`input ${toNumber(chargerKw) <= 0 ? "input-error" : ""}`}
                  value={chargerKw}
                  inputMode="decimal"
                  onChange={(e) => setChargerKw(e.target.value)}
                />
                <span className="field-hint">Valitud laadija nimivõimsus.</span>
              </label>
              <label className="field-label">
                <span className="field-label-text">Elektrihind (€/kWh)</span>
                <input
                  className={`input ${toNumber(priceEurKwh) <= 0 ? "input-warning" : ""}`}
                  value={priceEurKwh}
                  inputMode="decimal"
                  onChange={(e) => setPriceEurKwh(e.target.value)}
                />
                <span className="field-hint">Eeldatav laadimise hind kWh kohta.</span>
              </label>
              <label className="field-label">
                <span className="field-label-text">Süsteem</span>
                <select className="input" value={phase} onChange={(e) => setPhase(e.target.value as "1" | "3")}>
                  <option value="1">1-faasiline</option>
                  <option value="3">3-faasiline</option>
                </select>
                <span className="field-hint">Vali kodu elektrisüsteemi faaside arv.</span>
              </label>
              <label className="field-label">
                <span className="field-label-text">Peakaitse (A)</span>
                <input
                  className={`input ${toNumber(mainFuseA) <= 0 ? "input-error" : ""}`}
                  value={mainFuseA}
                  inputMode="numeric"
                  onChange={(e) => setMainFuseA(e.target.value)}
                />
                <span className="field-hint">Maja peakaitse amperites.</span>
              </label>
              <label className="field-label sm:col-span-2">
                <span className="field-label-text">Muud koormused majas (reserv, kW)</span>
                <input className="input" value={reserveKw} inputMode="decimal" onChange={(e) => setReserveKw(e.target.value)} />
                <span className="field-hint">Jäta EV laadimisest eraldi varu maja teistele tarbijatele.</span>
              </label>
            </div>
          </article>

          <article className="card">
            <h3 className="section-title">Tulemused</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="metric-card metric-card-primary metric-card-accent-emerald">
                <p className="metric-label">Olulisim: laadimise aeg</p>
                <div className="metric-main">
                  <strong className="metric-value">
                    {Number.isFinite(result.timeH)
                      ? `${Math.floor(result.timeH)}h ${Math.round((result.timeH % 1) * 60)}m`
                      : "—"}
                  </strong>
                </div>
                <p className="metric-help">Kui kaua võtab valitud energia koguse laadimine.</p>
              </div>
              <div className="metric-card metric-card-accent-teal">
                <p className="metric-label">Laadimise maksumus</p>
                <div className="metric-main">
                  <strong className="metric-value">{result.cost.toFixed(2).replace(".", ",")}</strong>
                  <span className="metric-unit">EUR</span>
                </div>
                <p className="metric-help">Arvutus põhineb hinnal ja laaditaval energial.</p>
              </div>
              <div className="metric-card metric-card-accent-teal sm:col-span-2">
                <p className="metric-label">Soovituslik 1-faasiline laadija</p>
                <div className="metric-main">
                  <strong className="metric-value">{result.rec1 ? result.rec1 : "2,3 või väiksem"}</strong>
                  <span className="metric-unit">kW</span>
                </div>
                <p className="metric-help">Arvestab peakaitset, reservi ja kasutatavat võimsust.</p>
              </div>
              <div className="metric-card metric-card-accent-emerald sm:col-span-2">
                <p className="metric-label">Soovituslik 3-faasiline laadija</p>
                <div className="metric-main">
                  <strong className="metric-value">{result.rec3 ? result.rec3 : "3,7 või väiksem"}</strong>
                  <span className="metric-unit">kW</span>
                </div>
                <p className="metric-help">3-faasiline soovitus sama reservi eeldusel.</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-zinc-200">
              <p className="font-medium text-zinc-50">Hinnang</p>
              <p className="mt-1 text-zinc-300">{result.note}</p>
              <p className="mt-2 text-xs text-zinc-400">
                Eeldatav “EV jaoks vaba võimsus”: 1-faasiline ~{result.p1.toFixed(1)} kW, 3-faasiline ~{result.p3.toFixed(1)} kW.
              </p>
              {result.warning22kw ? (
                <p className="mt-2 rounded-lg border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
                  {result.warning22kw}
                </p>
              ) : null}
            </div>
          </article>
        </div>
      </section>

      <PaywallCard
        locked={!canViewFullAnalysis(unlock)}
        title="Detailne vaade"
        description="avab odavaimate tundide leidmise, laadimisplaani ja ekspordi selle projekti jaoks."
        ctaLabel={purchaseBusy === "full_analysis" ? "Laen..." : "Ava detailne vaade"}
        secondaryLabel="Kontrolli ligipääsu staatust"
        onCta={() => startCheckout("full_analysis")}
        onSecondary={checkPaymentStatus}
        footer={
          <>
            Projekt: <span className="font-medium text-zinc-200">{projectId}</span>
          </>
        }
      >
        <h3 className="text-xl font-semibold text-zinc-50">Täpne ajakava</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Detailne vaade lisab Eleringi spot-hindade põhise “odavaimad tunnid” valiku, reeglid ja ekspordi.
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

