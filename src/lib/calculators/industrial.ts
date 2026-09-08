/**
 * Tööstusmooduli v0.1 arvutusloogika (PV + aku).
 *
 * See ei ole optimeerimismootor ega 15-min simulatsioon. Eesmärk on anda
 * loogiline esmane hinnang omatarbele, võrku müügile, tipukoormusele ja
 * ligikaudsele säästule tarbimisprofiili ja süsteemi suuruse põhjal.
 */

export type IndustrialBatteryPurpose = "self_consumption" | "peak_shaving";

export type IndustrialInput = {
  companyName: string;
  annualConsumptionMwh: number;
  daytimeSharePercent: number;
  peakLoadKw: number;
  averageElectricityPriceEurPerMwh: number;
  pvPowerKw: number;
  pvSpecificYieldKwhPerKw: number;
  batteryCapacityKwh: number;
  batteryPowerKw: number;
  batteryPurpose: IndustrialBatteryPurpose;
  /** Kui puudub või 0, tasuvusaega ei arvutata. */
  investmentEur: number | null;
};

export type IndustrialResult = {
  pvProductionMwh: number;
  selfConsumedPvMwh: number;
  exportedPvMwh: number;
  selfConsumptionSharePercent: number;
  batterySelfConsumptionImpactMwh: number;
  peakLoadBeforeKw: number;
  peakLoadAfterKw: number;
  annualSavingsEur: number;
  paybackYears: number | null;
  summary: string;
  assumptions: string[];
};

export const INDUSTRIAL_ASSUMPTIONS = {
  /** Päevase koormuse ja PV ajaline kattuvus: 50% (madal päevane osakaal) … 90% (kõrge). */
  minDaytimeCoincidence: 0.5,
  maxDaytimeCoincidence: 0.9,
  /** Kasutatav akuenergia tsükli kohta (DoD × roundtrip ≈ 0,9 × 0,9). */
  batteryUsableFraction: 0.81,
  /** Ekvivalentsed täistsüklid aastas omatarbe režiimis. */
  selfConsumptionCyclesPerYear: 250,
  /** Peak shaving režiimis jääb omatarbe nihkeks 20% potentsiaalist. */
  peakShavingSelfConsumptionShare: 0.2,
  /** Tipu kestus energia-piiratud lõike jaoks (h). */
  assumedPeakDurationHours: 1,
  /** Tippu ei lõigata alla selle osakaalu algsest tipust. */
  minPeakRemainingShare: 0.4,
  /** Võimsustasu eeldus peak shaving säästu jaoks (€/kW/kuu). */
  demandChargeEurPerKwMonth: 6.5,
  hoursPerYear: 8760,
} as const;

function finiteNonNegative(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function sanitizeIndustrialInput(input: IndustrialInput): IndustrialInput {
  const purpose: IndustrialBatteryPurpose =
    input.batteryPurpose === "peak_shaving" ? "peak_shaving" : "self_consumption";
  const investmentRaw = input.investmentEur;
  const investment =
    investmentRaw == null || !Number.isFinite(investmentRaw) || investmentRaw <= 0 ? null : investmentRaw;
  const name = typeof input.companyName === "string" ? input.companyName.trim() : "";

  return {
    companyName: name.length > 0 ? name : "Nimetu profiil",
    annualConsumptionMwh: finiteNonNegative(input.annualConsumptionMwh),
    daytimeSharePercent: clamp(finiteNonNegative(input.daytimeSharePercent), 0, 100),
    peakLoadKw: finiteNonNegative(input.peakLoadKw),
    averageElectricityPriceEurPerMwh: finiteNonNegative(input.averageElectricityPriceEurPerMwh),
    pvPowerKw: finiteNonNegative(input.pvPowerKw),
    pvSpecificYieldKwhPerKw: finiteNonNegative(input.pvSpecificYieldKwhPerKw),
    batteryCapacityKwh: finiteNonNegative(input.batteryCapacityKwh),
    batteryPowerKw: finiteNonNegative(input.batteryPowerKw),
    batteryPurpose: purpose,
    investmentEur: investment,
  };
}

function daytimeCoincidence(daytimeSharePercent: number): number {
  const t = clamp(daytimeSharePercent, 0, 100) / 100;
  return (
    INDUSTRIAL_ASSUMPTIONS.minDaytimeCoincidence +
    (INDUSTRIAL_ASSUMPTIONS.maxDaytimeCoincidence - INDUSTRIAL_ASSUMPTIONS.minDaytimeCoincidence) * t
  );
}

function averageLoadKw(annualConsumptionMwh: number): number {
  return (annualConsumptionMwh * 1000) / INDUSTRIAL_ASSUMPTIONS.hoursPerYear;
}

function formatEt(value: number, digits: number): string {
  return new Intl.NumberFormat("et-EE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function describeIndustrialResult(input: IndustrialInput, result: Omit<IndustrialResult, "summary">): string {
  const name = input.companyName;
  const purpose =
    input.batteryPurpose === "peak_shaving" ? "tipukoormuse lõikamisele" : "omatarbe suurendamisele";
  const selfShare = formatEt(result.selfConsumptionSharePercent, 0);
  const savings = formatEt(result.annualSavingsEur, 0);
  const peakBefore = formatEt(result.peakLoadBeforeKw, 0);
  const peakAfter = formatEt(result.peakLoadAfterKw, 0);

  const paybackPart =
    result.paybackYears == null
      ? "Tasuvusaega ei arvutatud, sest investeeringut ei ole sisestatud või aastane sääst on null."
      : `Lihtsustatud tasuvusaeg on umbes ${formatEt(result.paybackYears, 1)} aastat.`;

  return (
    `${name}: PV toodangust kasutatakse kohapeal umbes ${selfShare}%. ` +
    `Aku on suunatud ${purpose}. ` +
    `Tipukoormus muutub ${peakBefore} kW-lt ${peakAfter} kW-ni. ` +
    `Aastane ligikaudne sääst on ${savings} €. ${paybackPart} ` +
    `Tegu on v0.1 lihtsustatud hinnanguga, mitte lõpliku investeerimisotsusega.`
  );
}

/**
 * 1. PV toodang = võimsus × eritootlus.
 * 2. Omatarve ilma akuta = min(toodang, päevane tarbimine) × kattuvustegur.
 * 3. Kattuvus kasvab päevase tarbimise osakaaluga (50–90%).
 * 4. Aku võib nihutada ülejääki omatarbeks, kuid mitte rohkem kui võrku minev PV.
 * 5. Peak shaving vähendab tippu aku kW/kWh järgi, mitte alla keskmise koormuse ega 40% algsest tipust.
 * 6. Sääst = kohapeal kasutatud PV × elektri hind (+ võimsustasu, kui režiim on peak shaving).
 */
export function calculateIndustrial(rawInput: IndustrialInput): IndustrialResult {
  const input = sanitizeIndustrialInput(rawInput);

  const pvProductionMwh = (input.pvPowerKw * input.pvSpecificYieldKwhPerKw) / 1000;
  const daytimeConsumptionMwh = input.annualConsumptionMwh * (input.daytimeSharePercent / 100);
  const coincidence = daytimeCoincidence(input.daytimeSharePercent);
  const selfConsumedWithoutBatteryMwh = Math.min(pvProductionMwh, daytimeConsumptionMwh) * coincidence;
  const exportedWithoutBatteryMwh = Math.max(pvProductionMwh - selfConsumedWithoutBatteryMwh, 0);

  const annualShiftPotentialMwh =
    (input.batteryCapacityKwh * INDUSTRIAL_ASSUMPTIONS.batteryUsableFraction * INDUSTRIAL_ASSUMPTIONS.selfConsumptionCyclesPerYear) /
    1000;
  const remainingConsumptionMwh = Math.max(input.annualConsumptionMwh - selfConsumedWithoutBatteryMwh, 0);
  const maxBatteryBoostMwh = Math.min(exportedWithoutBatteryMwh, annualShiftPotentialMwh, remainingConsumptionMwh);

  const batterySelfConsumptionImpactMwh =
    input.batteryPurpose === "self_consumption"
      ? maxBatteryBoostMwh
      : maxBatteryBoostMwh * INDUSTRIAL_ASSUMPTIONS.peakShavingSelfConsumptionShare;

  const selfConsumedPvMwh = selfConsumedWithoutBatteryMwh + batterySelfConsumptionImpactMwh;
  const exportedPvMwh = Math.max(pvProductionMwh - selfConsumedPvMwh, 0);
  const selfConsumptionSharePercent = pvProductionMwh > 0 ? (selfConsumedPvMwh / pvProductionMwh) * 100 : 0;

  const peakLoadBeforeKw = input.peakLoadKw;
  let peakReductionKw = 0;
  if (input.batteryPurpose === "peak_shaving" && input.batteryCapacityKwh > 0 && input.batteryPowerKw > 0) {
    const energyLimitedCutKw =
      (input.batteryCapacityKwh * INDUSTRIAL_ASSUMPTIONS.batteryUsableFraction) /
      INDUSTRIAL_ASSUMPTIONS.assumedPeakDurationHours;
    const powerLimitedCutKw = input.batteryPowerKw;
    const minRealisticPeakKw = Math.max(
      averageLoadKw(input.annualConsumptionMwh),
      input.peakLoadKw * INDUSTRIAL_ASSUMPTIONS.minPeakRemainingShare,
    );
    const maxRealisticCutKw = Math.max(input.peakLoadKw - minRealisticPeakKw, 0);
    peakReductionKw = Math.min(energyLimitedCutKw, powerLimitedCutKw, maxRealisticCutKw);
  }
  const peakLoadAfterKw = Math.max(peakLoadBeforeKw - peakReductionKw, 0);

  const energySavingsEur = selfConsumedPvMwh * input.averageElectricityPriceEurPerMwh;
  const peakSavingsEur =
    input.batteryPurpose === "peak_shaving"
      ? peakReductionKw * INDUSTRIAL_ASSUMPTIONS.demandChargeEurPerKwMonth * 12
      : 0;
  const annualSavingsEur = energySavingsEur + peakSavingsEur;

  const paybackYears =
    input.investmentEur != null && input.investmentEur > 0 && annualSavingsEur > 0
      ? input.investmentEur / annualSavingsEur
      : null;

  const assumptions = [
    `Päevase tarbimise ja PV kattuvus: ${formatEt(coincidence * 100, 0)}% (sõltub päevasest osakaalust).`,
    `Aku kasutatav osa tsükli kohta: ${formatEt(INDUSTRIAL_ASSUMPTIONS.batteryUsableFraction * 100, 0)}%.`,
    `Omatarbe tsüklid aastas: ${INDUSTRIAL_ASSUMPTIONS.selfConsumptionCyclesPerYear}.`,
    input.batteryPurpose === "peak_shaving"
      ? `Võimsustasu eeldus: ${formatEt(INDUSTRIAL_ASSUMPTIONS.demandChargeEurPerKwMonth, 1)} €/kW/kuu.`
      : "Peak shaving säästu ei arvestata, sest aku on omatarbe režiimis.",
    "Võrku müüdavat PV-d v0.1 säästus ei väärtustata — näidatakse ainult energiana.",
  ];

  const withoutSummary = {
    pvProductionMwh,
    selfConsumedPvMwh,
    exportedPvMwh,
    selfConsumptionSharePercent,
    batterySelfConsumptionImpactMwh,
    peakLoadBeforeKw,
    peakLoadAfterKw,
    annualSavingsEur,
    paybackYears,
    assumptions,
  };

  return {
    ...withoutSummary,
    summary: describeIndustrialResult(input, withoutSummary),
  };
}

export type IndustrialSampleProfile = {
  id: "daytime" | "flat" | "peaks";
  title: string;
  description: string;
  input: IndustrialInput;
};

export const INDUSTRIAL_SAMPLE_PROFILES: IndustrialSampleProfile[] = [
  {
    id: "daytime",
    title: "Päevane tootmine",
    description: "Tootmine koondub päevatundidesse, PV kattub tarbimisega hästi.",
    input: {
      companyName: "Päevase tarbimisega tootmisettevõte",
      annualConsumptionMwh: 2500,
      daytimeSharePercent: 75,
      peakLoadKw: 650,
      averageElectricityPriceEurPerMwh: 110,
      pvPowerKw: 800,
      pvSpecificYieldKwhPerKw: 950,
      batteryCapacityKwh: 500,
      batteryPowerKw: 250,
      batteryPurpose: "self_consumption",
      investmentEur: 760000,
    },
  },
  {
    id: "flat",
    title: "Ööpäevaringne tööstus",
    description: "Tarbimine on ühtlane ööpäev läbi, osa PV-st jääb õhtusse.",
    input: {
      companyName: "Ühtlase ööpäevase tarbimisega tööstus",
      annualConsumptionMwh: 8000,
      daytimeSharePercent: 45,
      peakLoadKw: 1100,
      averageElectricityPriceEurPerMwh: 95,
      pvPowerKw: 1500,
      pvSpecificYieldKwhPerKw: 950,
      batteryCapacityKwh: 800,
      batteryPowerKw: 400,
      batteryPurpose: "self_consumption",
      investmentEur: 1370000,
    },
  },
  {
    id: "peaks",
    title: "Suured tipukoormused",
    description: "Keskmine koormus on mõõdukas, aga tipud on kõrged.",
    input: {
      companyName: "Suurte tipukoormustega ettevõte",
      annualConsumptionMwh: 1800,
      daytimeSharePercent: 55,
      peakLoadKw: 1200,
      averageElectricityPriceEurPerMwh: 120,
      pvPowerKw: 400,
      pvSpecificYieldKwhPerKw: 950,
      batteryCapacityKwh: 600,
      batteryPowerKw: 400,
      batteryPurpose: "peak_shaving",
      investmentEur: 520000,
    },
  },
];
