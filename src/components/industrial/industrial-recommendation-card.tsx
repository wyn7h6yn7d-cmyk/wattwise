"use client";

import type { IndustrialBatteryPurpose, IndustrialResult } from "@/lib/calculators/industrial";
import type { IndustrialScenarioComparison } from "@/lib/calculators/industrial-scenarios";
import { fmtEt } from "@/components/industrial/format-et";

export type IndustrialInterpretation = {
  headline: string;
  impact: string;
  batteryRole: string;
  nextStep: string;
};

export function buildIndustrialInterpretation({
  result,
  comparison,
  batteryPurpose,
  hasBattery,
}: {
  result: IndustrialResult;
  comparison: IndustrialScenarioComparison | null;
  batteryPurpose: IndustrialBatteryPurpose;
  hasBattery: boolean;
}): IndustrialInterpretation {
  const best = comparison?.scenarios.find((row) => row.id === comparison.bestSavingsId) ?? null;
  const peakCut = Math.max(result.peakLoadBeforeKw - result.peakLoadAfterKw, 0);
  const impactValue = best?.annualSavingsEur ?? result.annualSavingsEur;

  const headline =
    !best || best.id === "base" || impactValue <= 0
      ? "Selle sisendiga ei paista veel selget aastast kogumõju."
      : `Suurima aastase kogumõju annab ${best.label}.`;

  const impact =
    !best || impactValue <= 0
      ? "Kontrolli tarbimist, elektrihinda ja PV võimsust. Kui need on paigas, näitab stsenaariumite tabel, milline kombinatsioon hakkaks tasuma."
      : `${best.label} annab umbes ${fmtEt(impactValue, 0)} €/a. Lihtsustatud tasuvusaeg on ${
          (best.paybackYears ?? result.paybackYears) != null
            ? `${fmtEt((best.paybackYears ?? result.paybackYears) as number, 1)} aastat`
            : "selle sisendi juures veel määramata"
        }.`;

  let batteryRole: string;
  if (!hasBattery) {
    batteryRole =
      "Aku rolli ei saa veel hinnata — mahu või võimsuse väli on tühi. PV mõju tuleb omatarbest ja võrku müügist.";
  } else if (batteryPurpose === "peak_shaving" && peakCut > 1) {
    batteryRole = `Aku on seatud tipu lõikamiseks: võrgust võetav tipp langeb ${fmtEt(
      result.peakLoadBeforeKw,
      0,
    )} kW-lt ${fmtEt(result.peakLoadAfterKw, 0)} kW-ni. Omatarve on selles režiimis teisejärguline.`;
  } else if (result.batterySelfConsumptionImpactMwh > 0.2) {
    batteryRole = `Aku roll on pigem omatarbe suurendamine: aku kaudu jõuab koormusse umbes ${fmtEt(
      result.batterySelfConsumptionImpactMwh,
      1,
    )} MWh. Tipukoormus peaaegu ei muutu.`;
  } else if (batteryPurpose === "peak_shaving") {
    batteryRole =
      "Aku on peak shaving režiimis, aga selle sisendi juures jääb tipu lõige väikeseks. Tasub kontrollida aku võimsust, mahutuvust ja võimsustasu eeldust.";
  } else {
    batteryRole =
      "Aku omatarbe nihe on selle sisendi juures väike. Enne aku suurendamist tasub vaadata, kui palju PV-d jääb päeval üle.";
  }

  const nextStep =
    "Enne otsust täpsusta tegelik tunni- või 15 min tarbimine (eelistatult 12 kuud), võimsustasu leping ning PV ja aku ühikpakkumised. See on esmane hinnang, mitte lõplik investeerimisotsus.";

  return { headline, impact, batteryRole, nextStep };
}

export function IndustrialRecommendationCard({
  interpretation,
}: {
  interpretation: IndustrialInterpretation;
}) {
  return (
    <section className="border border-zinc-700/80 bg-zinc-950/80 px-4 py-4 sm:px-5 sm:py-5">
      <p className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-zinc-500">
        Soovituslik tõlgendus
      </p>
      <h3 className="mt-2 text-lg font-semibold tracking-tight text-zinc-50 sm:text-xl">
        {interpretation.headline}
      </h3>
      <div className="mt-3 grid gap-3 text-sm leading-relaxed text-zinc-400">
        <p>{interpretation.impact}</p>
        <p>{interpretation.batteryRole}</p>
        <p className="text-zinc-500">{interpretation.nextStep}</p>
      </div>
    </section>
  );
}
