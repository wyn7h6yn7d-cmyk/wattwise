"use client";

import { canViewFullAnalysis } from "@/lib/unlock";
import { useProjectUnlock } from "@/lib/useProjectUnlock";
import { PaywallCard } from "@/components/paywall-card";
import { UsedAssumptionsBlock } from "@/components/used-assumptions-block";
import { AdvancedInputAccordion } from "@/components/advanced-input-accordion";
import { useMemo, useState } from "react";
import {
  calculateEvCharging,
  calculateEvChargeableEnergy,
  CHARGER_STEPS_KW,
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

  const [mode, setMode] = useState<"quick" | "advanced">("quick");
  const [batteryKwh, setBatteryKwh] = useState("");
  const [energyToChargeKwh, setEnergyToChargeKwh] = useState("");
  const [chargerKw, setChargerKw] = useState("");
  const [priceEurKwh, setPriceEurKwh] = useState("");
  const [phase, setPhase] = useState<"1" | "3">("3");
  const [mainFuseA, setMainFuseA] = useState("");
  const [reserveKw, setReserveKw] = useState(""); // muu koormus majas
  const [startSocPct, setStartSocPct] = useState("");
  const [targetSocPct, setTargetSocPct] = useState("");
  const [chargingLossPct, setChargingLossPct] = useState("");
  const [chargerEfficiencyPct, setChargerEfficiencyPct] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [useSpotPrice, setUseSpotPrice] = useState(false);
  const [nightCharging, setNightCharging] = useState(true);
  const [spotState, setSpotState] = useState<{ loading: boolean; note: string; cheapest: string | null }>({
    loading: false,
    note: "",
    cheapest: null,
  });
  const [hasCalculated, setHasCalculated] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const hasValue = (v: string) => v.trim().length > 0;

  const result = useMemo(() => {
    const chargeable = calculateEvChargeableEnergy({
      mode,
      batteryKwh: toNumber(batteryKwh),
      startSocPct: toNumber(startSocPct),
      targetSocPct: toNumber(targetSocPct),
      energyToChargeKwh: toNumber(energyToChargeKwh),
      chargerEfficiencyPct: toNumber(chargerEfficiencyPct),
      chargingLossPct: toNumber(chargingLossPct),
    });

    const power = Math.max(toNumber(chargerKw), 0.1);
    const price = Math.max(toNumber(priceEurKwh), 0);
    const fuseA = Math.max(toNumber(mainFuseA), 0);
    const reserve = Math.max(toNumber(reserveKw), 0);

    const activeCalc = calculateEvCharging({
      amps: fuseA,
      phase,
      householdReserveKw: reserve,
      energyToChargeKwh: chargeable.gridEnergyKwh,
      chargerKw: power,
      priceEurKwh: price,
    });

    const p1 = usableChargingPowerKw(mainFusePower1fKw(fuseA), reserve);
    const p3 = usableChargingPowerKw(mainFusePower3fKw(fuseA), reserve);

    const rec1 = pickChargerStepKw(p1);
    const rec3 = pickChargerStepKw(p3);
    const activeMax = activeCalc.availableForEvKw;
    const recommended = activeCalc.recommendedChargerKw;

    const fits11 = activeCalc.fits11Kw;
    const fits22 = activeCalc.fits22Kw;
    const smallFuseWarning = activeMax < 2.3;
    const needsLoadManagement = activeCalc.loadManagementRecommended || reserve > 3;

    const note =
      phase === "1"
        ? power <= rec1 || rec1 === 0
          ? "Valitud laadija peaks peakaitse mõttes sobima (arvestades reservi)."
          : "Valitud laadija on peakaitse mõttes tõenäoliselt liiga suur (arvestades reservi)."
        : power <= rec3 || rec3 === 0
          ? "Valitud laadija peaks peakaitse mõttes sobima (arvestades reservi)."
          : "Valitud laadija on peakaitse mõttes tõenäoliselt liiga suur (arvestades reservi).";

    const warning22kw = activeCalc.warning22Kw;

    return {
      timeH: activeCalc.chargingTimeHours,
      cost: activeCalc.chargingCost,
      rec1,
      rec3,
      p1,
      p3,
      note,
      warning22kw,
      chargeableEnergy: chargeable.chargeableEnergyKwh,
      gridEnergy: chargeable.gridEnergyKwh,
      recommended,
      fits11,
      fits22,
      smallFuseWarning,
      needsLoadManagement,
    };
  }, [
    mode,
    batteryKwh,
    startSocPct,
    targetSocPct,
    chargerEfficiencyPct,
    chargingLossPct,
    chargerKw,
    energyToChargeKwh,
    mainFuseA,
    phase,
    priceEurKwh,
    reserveKw,
  ]);

  const findCheapestSpotWindow = async () => {
    setSpotState({ loading: true, note: "Laen Eleringi hindu...", cheapest: null });
    try {
      const now = new Date();
      const startIso = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      const endIso = new Date(now.getTime() + 36 * 60 * 60 * 1000).toISOString();
      const res = await fetch(`/api/elering/nps?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}&area=ee`);
      if (!res.ok) throw new Error("Eleringi päring ebaõnnestus");
      const data = (await res.json()) as { points?: Array<{ ts: number; price_eur_per_kwh: number }> };
      const points = data.points ?? [];
      if (!points.length) throw new Error("Hindu ei leitud");

      const parseHm = (hm: string) => {
        const [h, m] = hm.split(":").map(Number);
        return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
      };
      const startMin = parseHm(startTime);
      const endMin = parseHm(endTime);
      const durationH = Math.max(result.timeH, 0.25);
      const stepsNeeded = Math.max(1, Math.ceil(durationH)); // hindame tunniandmetel

      const eligible = points.filter((p) => {
        const d = new Date(p.ts * 1000);
        const mins = d.getHours() * 60 + d.getMinutes();
        if (!nightCharging) return true;
        if (startMin <= endMin) return mins >= startMin && mins < endMin;
        return mins >= startMin || mins < endMin;
      });
      if (eligible.length < stepsNeeded) {
        setSpotState({ loading: false, note: "Valitud aknas pole piisavalt hindu.", cheapest: null });
        return;
      }

      let bestIdx = 0;
      let bestAvg = Number.POSITIVE_INFINITY;
      for (let i = 0; i <= eligible.length - stepsNeeded; i += 1) {
        const slice = eligible.slice(i, i + stepsNeeded);
        const avg = slice.reduce((s, p) => s + p.price_eur_per_kwh, 0) / slice.length;
        if (avg < bestAvg) {
          bestAvg = avg;
          bestIdx = i;
        }
      }
      const from = new Date(eligible[bestIdx].ts * 1000);
      const to = new Date(eligible[bestIdx + stepsNeeded - 1].ts * 1000 + 60 * 60 * 1000);
      setSpotState({
        loading: false,
        note: `Odavaim keskmine hind: ${bestAvg.toFixed(3).replace(".", ",")} €/kWh`,
        cheapest: `${from.toLocaleTimeString("et-EE", { hour: "2-digit", minute: "2-digit" })}–${to.toLocaleTimeString("et-EE", { hour: "2-digit", minute: "2-digit" })}`,
      });
    } catch {
      setSpotState({ loading: false, note: "Odavaimat akent ei saanud leida.", cheapest: null });
    }
  };

  const assumptionsInfo = useMemo(() => {
    const userInputs: string[] = [];
    if (mode === "advanced" && toNumber(batteryKwh) > 0) userInputs.push(`Aku maht: ${batteryKwh} kWh`);
    if (toNumber(energyToChargeKwh) > 0 && mode === "quick") userInputs.push(`Laaditav energia: ${energyToChargeKwh} kWh`);
    if (toNumber(chargerKw) > 0) userInputs.push(`Laadija võimsus: ${chargerKw} kW`);
    if (toNumber(mainFuseA) > 0) userInputs.push(`Peakaitse: ${mainFuseA} A (${phase}f)`);
    if (toNumber(priceEurKwh) > 0) userInputs.push(`Elektrihind: ${priceEurKwh} €/kWh`);

    const defaultAssumptions: string[] = [];
    if (mode === "quick") defaultAssumptions.push("Laadimiskaod ja efektiivsus võeti konservatiivse üldhinnanguna.");
    if (mode === "advanced" && toNumber(chargingLossPct) === 8) defaultAssumptions.push("Laadimiskaod: 8%.");
    if (mode === "advanced" && toNumber(chargerEfficiencyPct) === 92) defaultAssumptions.push("Laadija efektiivsus: 92%.");

    const apiValues = useSpotPrice
      ? [spotState.note || "Eleringi hinnad kasutusel odavaima akna leidmiseks."]
      : [];

    return {
      userInputs,
      defaultAssumptions,
      apiValues,
      mostInfluentialInputs: [
        "Laadija võimsus",
        "Elektrihind",
        "Peakaitse ja muu tarbimise reserv",
      ],
    };
  }, [
    mode,
    batteryKwh,
    energyToChargeKwh,
    chargerKw,
    mainFuseA,
    phase,
    priceEurKwh,
    chargingLossPct,
    chargerEfficiencyPct,
    useSpotPrice,
    spotState.note,
  ]);

  const sanityWarnings = useMemo(() => {
    const warnings: string[] = [];
    const price = toNumber(priceEurKwh);
    const fuse = toNumber(mainFuseA);
    if (price > 0 && (price < 0.03 || price > 0.6)) {
      warnings.push("Elektrihind tundub ebatavaline. Kontrolli, et ühik on €/kWh, mitte €/MWh.");
    }
    if (fuse > 0 && fuse < 16) {
      warnings.push("Peakaitse on EV laadimiseks pigem väike - arvesta aeglasema laadimisega või koormusjuhtimisega.");
    }
    if (result.timeH <= 0 || !Number.isFinite(result.timeH)) {
      warnings.push("Laadimisaega ei saa arvutada. Kontrolli laaditavat energiat ja laadija võimsust.");
    }
    return warnings;
  }, [priceEurKwh, mainFuseA, result.timeH]);
  const hasRequiredInputs = toNumber(energyToChargeKwh) > 0 && toNumber(chargerKw) > 0 && toNumber(priceEurKwh) > 0;

  const handleCalculate = () => {
    if (!hasRequiredInputs) {
      setValidationMessage("Täida vajalikud väljad enne arvutamist.");
      setHasCalculated(false);
      return;
    }
    setValidationMessage(null);
    setHasCalculated(true);
  };

  const handleReset = () => {
    setBatteryKwh("");
    setEnergyToChargeKwh("");
    setChargerKw("");
    setPriceEurKwh("");
    setMainFuseA("");
    setReserveKw("");
    setStartSocPct("");
    setTargetSocPct("");
    setChargingLossPct("");
    setChargerEfficiencyPct("");
    setStartTime("");
    setEndTime("");
    setUseSpotPrice(false);
    setNightCharging(true);
    setValidationMessage(null);
    setHasCalculated(false);
  };

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
        <div className="mt-4 inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              mode === "quick" ? "bg-emerald-400/20 text-emerald-100" : "text-zinc-300"
            }`}
            onClick={() => setMode("quick")}
          >
            Kiire hinnang
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              mode === "advanced" ? "bg-emerald-400/20 text-emerald-100" : "text-zinc-300"
            }`}
            onClick={() => setMode("advanced")}
          >
            Täpsem arvutus
          </button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="card">
            <h3 className="section-title">Sisendid</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {mode === "advanced" ? (
                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      setChargingLossPct("8");
                      setChargerEfficiencyPct("92");
                      setStartTime("22:00");
                      setEndTime("07:00");
                      setUseSpotPrice(false);
                      setNightCharging(true);
                    }}
                  >
                    Taasta vaikimisi
                  </button>
                </div>
              ) : null}
              {mode === "advanced" ? (
                <div className="sm:col-span-2">
                  <AdvancedInputAccordion title="1) Põhiandmed" defaultOpen>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="field-label">
                        <span className="field-label-text">Auto aku maht (kWh)</span>
                        <input className="input" value={batteryKwh} inputMode="decimal" onChange={(e) => setBatteryKwh(e.target.value)} placeholder="nt 60" />
                        <span className="field-hint">Aku kogu mahutavus.</span>
                      </label>
                      <label className="field-label">
                        <span className="field-label-text">Aku algne tase (%)</span>
                        <input className="input" value={startSocPct} inputMode="decimal" onChange={(e) => setStartSocPct(e.target.value)} placeholder="nt 20" />
                        <span className="field-hint">Laadimise alguse SoC.</span>
                      </label>
                      <label className="field-label">
                        <span className="field-label-text">Soovitud lõpptase (%)</span>
                        <input className="input" value={targetSocPct} inputMode="decimal" onChange={(e) => setTargetSocPct(e.target.value)} placeholder="nt 80" />
                        <span className="field-hint">Laadimise lõpu SoC.</span>
                      </label>
                    </div>
                  </AdvancedInputAccordion>
                </div>
              ) : null}
              <label className="field-label">
                <span className="field-label-text">Laaditav energia (kWh)</span>
                <input
                  className={`input ${hasValue(energyToChargeKwh) && toNumber(energyToChargeKwh) <= 0 ? "input-warning" : ""}`}
                  value={energyToChargeKwh}
                  inputMode="decimal"
                  onChange={(e) => setEnergyToChargeKwh(e.target.value)}
                  placeholder="nt 30"
                  disabled={mode === "advanced"}
                />
                <span className="field-hint">Kui palju energiat soovid juurde laadida.</span>
              </label>
              {mode === "advanced" ? (
                <div className="sm:col-span-2">
                  <AdvancedInputAccordion title="3) Tehnilised eeldused" defaultOpen>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="field-label">
                        <span className="field-label-text">Laadimiskaod (%)</span>
                        <input className="input" value={chargingLossPct} inputMode="decimal" onChange={(e) => setChargingLossPct(e.target.value)} placeholder="nt 8" />
                        <span className="field-hint">Kaod juhtmes ja süsteemis.</span>
                      </label>
                      <label className="field-label">
                        <span className="field-label-text">Laadija efektiivsus (%)</span>
                        <input className="input" value={chargerEfficiencyPct} inputMode="decimal" onChange={(e) => setChargerEfficiencyPct(e.target.value)} placeholder="nt 92" />
                        <span className="field-hint">AC/DC ja laadija kasutegur.</span>
                      </label>
                    </div>
                  </AdvancedInputAccordion>
                </div>
              ) : null}
              <label className="field-label">
                <span className="field-label-text">Laadija võimsus (kW)</span>
                <input
                  className={`input ${hasValue(chargerKw) && toNumber(chargerKw) <= 0 ? "input-error" : ""}`}
                  value={chargerKw}
                  inputMode="decimal"
                  onChange={(e) => setChargerKw(e.target.value)}
                  placeholder="nt 11"
                />
                <span className="field-hint">Valitud laadija nimivõimsus.</span>
              </label>
              <label className="field-label">
                <span className="field-label-text">Elektrihind (€/kWh)</span>
                <input
                  className={`input ${hasValue(priceEurKwh) && toNumber(priceEurKwh) <= 0 ? "input-warning" : ""}`}
                  value={priceEurKwh}
                  inputMode="decimal"
                  onChange={(e) => setPriceEurKwh(e.target.value)}
                  placeholder="nt 0,16"
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
                  className={`input ${hasValue(mainFuseA) && toNumber(mainFuseA) <= 0 ? "input-error" : ""}`}
                  value={mainFuseA}
                  inputMode="numeric"
                  onChange={(e) => setMainFuseA(e.target.value)}
                  placeholder="nt 25"
                />
                <span className="field-hint">Maja peakaitse amperites.</span>
              </label>
              <label className="field-label sm:col-span-2">
                <span className="field-label-text">Muud koormused majas (reserv, kW)</span>
                <input
                  className="input"
                  value={reserveKw}
                  inputMode="decimal"
                  onChange={(e) => setReserveKw(e.target.value)}
                  placeholder="nt 2"
                />
                <span className="field-hint">Jäta EV laadimisest eraldi varu maja teistele tarbijatele.</span>
              </label>
              {mode === "advanced" ? (
                <div className="sm:col-span-2">
                  <AdvancedInputAccordion title="4) Täpsemad seaded" defaultOpen>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="field-label">
                        <span className="field-label-text">Laadimise algusaeg</span>
                        <input className="input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                        <span className="field-hint">Akna algus odavaima aja leidmiseks.</span>
                      </label>
                      <label className="field-label">
                        <span className="field-label-text">Laadimise lõppaeg</span>
                        <input className="input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                        <span className="field-hint">Akna lõpp odavaima aja leidmiseks.</span>
                      </label>
                      <label className="field-label">
                        <span className="field-label-text">Kasuta börsihinda</span>
                        <div className="yes-no-row">
                          <span className="yes-no-text">Ei</span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={useSpotPrice}
                            className={`yes-no-switch ${useSpotPrice ? "is-on" : ""}`}
                            onClick={() => setUseSpotPrice((v) => !v)}
                          >
                            <span className="yes-no-knob" />
                          </button>
                          <span className="yes-no-text">Jah</span>
                        </div>
                        <span className="field-hint">Aktiivne: kasutab Eleringi hindu.</span>
                      </label>
                      <label className="field-label">
                        <span className="field-label-text">Öine laadimine</span>
                        <div className="yes-no-row">
                          <span className="yes-no-text">Ei</span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={nightCharging}
                            className={`yes-no-switch ${nightCharging ? "is-on" : ""}`}
                            onClick={() => setNightCharging((v) => !v)}
                          >
                            <span className="yes-no-knob" />
                          </button>
                          <span className="yes-no-text">Jah</span>
                        </div>
                        <span className="field-hint">Piirab otsingu valitud ajavahemikku.</span>
                      </label>
                    </div>
                  </AdvancedInputAccordion>
                </div>
              ) : null}
            </div>
            {mode === "advanced" && useSpotPrice ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <button type="button" className="btn-ghost" onClick={findCheapestSpotWindow} disabled={spotState.loading}>
                  {spotState.loading ? "Laen hindu..." : "Leia odavaim laadimisaken"}
                </button>
                {spotState.note ? <p className="mt-2 text-sm text-zinc-300">{spotState.note}</p> : null}
                {spotState.cheapest ? <p className="text-sm text-emerald-200">Soovituslik aken: {spotState.cheapest}</p> : null}
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="btn-glow w-full sm:w-auto" onClick={handleCalculate}>
                Arvuta tulemus
              </button>
              <button type="button" className="btn-ghost w-full sm:w-auto" onClick={handleReset}>
                Lähtesta
              </button>
            </div>
            {validationMessage ? (
              <p className="mt-3 rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
                {validationMessage}
              </p>
            ) : null}
          </article>

          <article className="card">
            <h3 className="section-title">Tulemused</h3>
            <p className="mb-4 text-sm text-zinc-300">
              Mida see tähendab? Esmalt vaata laadimise aega, seejärel kontrolli, kas valitud laadija sobib sinu
              peakaitsmega.
            </p>
            {!hasCalculated ? (
              <div className="mb-4 rounded-2xl border border-white/12 bg-white/[0.03] p-4 text-sm text-zinc-300">
                <p className="font-medium text-zinc-100">Sisesta andmed ja vajuta "Arvuta tulemus".</p>
              </div>
            ) : null}
            {hasCalculated && sanityWarnings.length > 0 ? (
              <div className="mb-4 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4 text-sm text-amber-100">
                <p className="font-medium">Kontrolli sisendeid enne otsust</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {sanityWarnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {hasCalculated && hasRequiredInputs ? (
              <>
            <div className="mb-5 rounded-2xl border border-emerald-300/30 bg-emerald-400/15 p-5 shadow-[0_0_30px_rgba(16,185,129,0.14)]">
              <p className="text-xs uppercase tracking-wide text-emerald-100/80">Peamine tulemus</p>
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <strong className="text-4xl font-semibold text-emerald-100 sm:text-5xl">
                  {Number.isFinite(result.timeH)
                    ? `${Math.floor(result.timeH)}h ${Math.round((result.timeH % 1) * 60)}m`
                    : "—"}
                </strong>
              </div>
              <p className="mt-2 text-sm text-emerald-50/90">
                Selle sisendi põhjal kulub laadimise lõpetamiseks ligikaudu nii palju aega.
              </p>
            </div>
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
              <div className="metric-card metric-card-accent-teal">
                <p className="metric-label">Soovitatav laadija suurus</p>
                <div className="metric-main">
                  <strong className="metric-value">{result.recommended || CHARGER_STEPS_KW[0]}</strong>
                  <span className="metric-unit">kW</span>
                </div>
                <p className="metric-help">Ümardatud sammud: 2.3, 3.7, 7.4, 11, 22 kW.</p>
              </div>
              <div className="metric-card metric-card-accent-emerald">
                <p className="metric-label">Kas 11 kW sobib</p>
                <div className="metric-main">
                  <strong className="metric-value">{result.fits11 ? "Jah" : "Ei"}</strong>
                </div>
                <p className="metric-help">Põhineb peakaitsme kasutataval võimsusel ja reservil.</p>
              </div>
              <div className="metric-card metric-card-accent-emerald">
                <p className="metric-label">Kas 22 kW sobib</p>
                <div className="metric-main">
                  <strong className="metric-value">{result.fits22 ? "Jah" : "Ei"}</strong>
                </div>
                <p className="metric-help">Enamasti vajab suuremat liitumist/koormusjuhtimist.</p>
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
              {result.smallFuseWarning ? (
                <p className="mt-2 rounded-lg border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-100">
                  Peakaitse on EV laadimiseks väga väike. Kontrolli liitumise suurendamist või vähenda laadimisvõimsust.
                </p>
              ) : null}
              <p className="mt-2 text-xs text-zinc-300">
                Koormusjuhtimine: {result.needsLoadManagement ? "soovitatav" : "võib olla mitte vajalik"}.
              </p>
              {result.warning22kw ? (
                <p className="mt-2 rounded-lg border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
                  {result.warning22kw}
                </p>
              ) : null}
            </div>
            {!Number.isFinite(result.timeH) || result.timeH <= 0 ? (
              <p className="mt-3 text-sm text-amber-200">
                Tulemust ei saa arvutada, sest laaditav energia või laadija võimsus on puudu.
              </p>
            ) : null}
            <UsedAssumptionsBlock {...assumptionsInfo} />
              </>
            ) : (
              <p className="text-sm text-zinc-400">
                Näidisväärtused on toodud placeholderina, mitte arvutuses kasutatava väärtusena.
              </p>
            )}
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

