/**
 * Tööstusmooduli v0.5 arvutusloogika (PV + aku).
 *
 * See ei ole optimeerimismootor ega 15-min simulatsioon. Eesmärk on anda
 * loogiline esmane hinnang omatarbele, võrku müügile, tipukoormusele ja
 * ligikaudsele majanduslikule mõjule tarbimisprofiili ja süsteemi suuruse põhjal.
 */

export type IndustrialBatteryPurpose = "self_consumption" | "peak_shaving";

export type IndustrialInput = {
  companyName: string;
  annualConsumptionMwh: number;
  daytimeSharePercent: number;
  peakLoadKw: number;
  /** Elektri ostuhind (€/MWh) — omatarbe säästu alus. */
  averageElectricityPriceEurPerMwh: number;
  pvPowerKw: number;
  pvSpecificYieldKwhPerKw: number;
  batteryCapacityKwh: number;
  batteryPowerKw: number;
  batteryPurpose: IndustrialBatteryPurpose;
  /**
   * @deprecated v0.5 kasutab PV/aku ühikhindu. Jäetakse tüübile backward compatibility jaoks;
   * stsenaariumite võrdlus ja tasuvus seda ei kasuta.
   */
  investmentEur: number | null;
  /** PV investeering €/kW */
  pvInvestmentEurPerKw: number;
  /** Aku investeering €/kWh */
  batteryInvestmentEurPerKwh: number;
  /** Võrku müüdava elektri hind €/MWh */
  exportPriceEurPerMwh: number;
  /** Võimsustasu €/kW/kuu */
  demandChargeEurPerKwMonth: number;
  /** Aku kasutegur (round-trip) % */
  batteryEfficiencyPercent: number;
  /** Aku kasutatav maht (DoD) % */
  batteryUsableCapacityPercent: number;
};

export type IndustrialResult = {
  pvProductionMwh: number;
  selfConsumedPvMwh: number;
  exportedPvMwh: number;
  selfConsumptionSharePercent: number;
  batterySelfConsumptionImpactMwh: number;
  peakLoadBeforeKw: number;
  peakLoadAfterKw: number;
  peakReductionKw: number;
  /** Kohapeal kasutatud PV × ostuhind */
  selfConsumptionSavingsEur: number;
  /** Võrku müüdud PV × müügihind */
  exportRevenueEur: number;
  /** Tipu lõige × võimsustasu × 12 (ainult peak shaving) */
  demandChargeSavingsEur: number;
  /** Aastane kogumõju = omatarve + müük + võimsustasu */
  annualSavingsEur: number;
  /** Stsenaariumi investeering ühikhindade põhjal */
  investmentEur: number;
  paybackYears: number | null;
  summary: string;
  assumptions: string[];
};

export const INDUSTRIAL_ECONOMICS_DEFAULTS = {
  pvInvestmentEurPerKw: 700,
  batteryInvestmentEurPerKwh: 350,
  exportPriceEurPerMwh: 45,
  demandChargeEurPerKwMonth: 6.5,
  batteryEfficiencyPercent: 90,
  batteryUsableCapacityPercent: 80,
} as const;

export const INDUSTRIAL_ASSUMPTIONS = {
  /** Päevase koormuse ja PV ajaline kattuvus: 50% (madal päevane osakaal) … 90% (kõrge). */
  minDaytimeCoincidence: 0.5,
  maxDaytimeCoincidence: 0.9,
  /** Ekvivalentsed täistsüklid aastas omatarbe režiimis. */
  selfConsumptionCyclesPerYear: 250,
  /** Peak shaving režiimis jääb omatarbe nihkeks 20% potentsiaalist. */
  peakShavingSelfConsumptionShare: 0.2,
  /** Tipu kestus energia-piiratud lõike jaoks (h). */
  assumedPeakDurationHours: 1,
  /** Tippu ei lõigata alla selle osakaalu algsest tipust. */
  minPeakRemainingShare: 0.4,
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

function withDefault(value: unknown, fallback: number): number {
  if (value == null || value === "") return fallback;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

export function batteryUsableFraction(efficiencyPercent: number, usableCapacityPercent: number): number {
  return (clamp(efficiencyPercent, 0, 100) / 100) * (clamp(usableCapacityPercent, 0, 100) / 100);
}

export function computeIndustrialInvestmentEur(input: {
  pvPowerKw: number;
  batteryCapacityKwh: number;
  pvInvestmentEurPerKw: number;
  batteryInvestmentEurPerKwh: number;
  includeBattery: boolean;
}): number {
  const pvPart = input.pvPowerKw * input.pvInvestmentEurPerKw;
  const batteryPart = input.includeBattery
    ? input.batteryCapacityKwh * input.batteryInvestmentEurPerKwh
    : 0;
  return Math.max(pvPart + batteryPart, 0);
}

export function sanitizeIndustrialInput(input: IndustrialInput): IndustrialInput {
  const purpose: IndustrialBatteryPurpose =
    input.batteryPurpose === "peak_shaving" ? "peak_shaving" : "self_consumption";
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
    investmentEur: null,
    pvInvestmentEurPerKw: withDefault(
      input.pvInvestmentEurPerKw,
      INDUSTRIAL_ECONOMICS_DEFAULTS.pvInvestmentEurPerKw,
    ),
    batteryInvestmentEurPerKwh: withDefault(
      input.batteryInvestmentEurPerKwh,
      INDUSTRIAL_ECONOMICS_DEFAULTS.batteryInvestmentEurPerKwh,
    ),
    exportPriceEurPerMwh: withDefault(
      input.exportPriceEurPerMwh,
      INDUSTRIAL_ECONOMICS_DEFAULTS.exportPriceEurPerMwh,
    ),
    demandChargeEurPerKwMonth: withDefault(
      input.demandChargeEurPerKwMonth,
      INDUSTRIAL_ECONOMICS_DEFAULTS.demandChargeEurPerKwMonth,
    ),
    batteryEfficiencyPercent: clamp(
      withDefault(input.batteryEfficiencyPercent, INDUSTRIAL_ECONOMICS_DEFAULTS.batteryEfficiencyPercent),
      0,
      100,
    ),
    batteryUsableCapacityPercent: clamp(
      withDefault(
        input.batteryUsableCapacityPercent,
        INDUSTRIAL_ECONOMICS_DEFAULTS.batteryUsableCapacityPercent,
      ),
      0,
      100,
    ),
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

export function describeIndustrialBatteryMode(
  purpose: IndustrialBatteryPurpose,
  peakLoadBeforeKw: number,
  peakLoadAfterKw: number,
): string {
  if (purpose === "peak_shaving") {
    return (
      `Kuna valitud on peak shaving režiim, kasutatakse akut eelkõige tipukoormuse vähendamiseks. ` +
      `Antud näites väheneb tipukoormus ${formatEt(peakLoadBeforeKw, 0)} kW-lt ${formatEt(peakLoadAfterKw, 0)} kW-ni.`
    );
  }
  return (
    "Kuna valitud on omatarbe suurendamise režiim, kasutatakse akut eelkõige PV ülejäägi kohapealseks kasutamiseks. " +
    "Selles režiimis tipukoormust ei vähendata."
  );
}

export function describeIndustrialResult(input: IndustrialInput, result: Omit<IndustrialResult, "summary">): string {
  const name = input.companyName;
  const selfShare = formatEt(result.selfConsumptionSharePercent, 0);
  const savings = formatEt(result.annualSavingsEur, 0);
  const modeSentence = describeIndustrialBatteryMode(
    input.batteryPurpose,
    result.peakLoadBeforeKw,
    result.peakLoadAfterKw,
  );

  const paybackPart =
    result.paybackYears == null
      ? "Tasuvusaega ei arvutatud, sest investeering on null või aastane kogumõju on null."
      : `Lihtsustatud tasuvusaeg on umbes ${formatEt(result.paybackYears, 1)} aastat.`;

  return (
    `${name}: PV toodangust kasutatakse kohapeal umbes ${selfShare}%. ` +
    `${modeSentence} ` +
    `Aastane kogumõju on ${savings} € (omatarbe sääst, võrku müügi tulu` +
    (result.demandChargeSavingsEur > 0 ? " ja võimsustasu sääst" : "") +
    `). ${paybackPart} ` +
    `Tegu on lihtsustatud hinnanguga, mitte lõpliku investeerimisotsusega.`
  );
}

/**
 * 1. PV toodang = võimsus × eritootlus.
 * 2. Omatarve ilma akuta = min(toodang, päevane tarbimine) × kattuvustegur.
 * 3. Kattuvus kasvab päevase tarbimise osakaaluga (50–90%).
 * 4. Aku võib nihutada ülejääki omatarbeks (kasutegur × kasutatav maht).
 * 5. Peak shaving vähendab tippu aku kW/kWh järgi.
 * 6. Kogumõju = omatarve × ostuhind + eksport × müügihind + tipu × võimsustasu × 12.
 */
export function calculateIndustrial(rawInput: IndustrialInput): IndustrialResult {
  const input = sanitizeIndustrialInput(rawInput);
  const usableFraction = batteryUsableFraction(
    input.batteryEfficiencyPercent,
    input.batteryUsableCapacityPercent,
  );

  const pvProductionMwh = (input.pvPowerKw * input.pvSpecificYieldKwhPerKw) / 1000;
  const daytimeConsumptionMwh = input.annualConsumptionMwh * (input.daytimeSharePercent / 100);
  const coincidence = daytimeCoincidence(input.daytimeSharePercent);
  const selfConsumedWithoutBatteryMwh = Math.min(pvProductionMwh, daytimeConsumptionMwh) * coincidence;
  const exportedWithoutBatteryMwh = Math.max(pvProductionMwh - selfConsumedWithoutBatteryMwh, 0);

  const annualShiftPotentialMwh =
    (input.batteryCapacityKwh * usableFraction * INDUSTRIAL_ASSUMPTIONS.selfConsumptionCyclesPerYear) / 1000;
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
    const energyLimitedCutKw = (input.batteryCapacityKwh * usableFraction) / INDUSTRIAL_ASSUMPTIONS.assumedPeakDurationHours;
    const powerLimitedCutKw = input.batteryPowerKw;
    const minRealisticPeakKw = Math.max(
      averageLoadKw(input.annualConsumptionMwh),
      input.peakLoadKw * INDUSTRIAL_ASSUMPTIONS.minPeakRemainingShare,
    );
    const maxRealisticCutKw = Math.max(input.peakLoadKw - minRealisticPeakKw, 0);
    peakReductionKw = Math.min(energyLimitedCutKw, powerLimitedCutKw, maxRealisticCutKw);
  }
  const peakLoadAfterKw = Math.max(peakLoadBeforeKw - peakReductionKw, 0);

  const selfConsumptionSavingsEur = selfConsumedPvMwh * input.averageElectricityPriceEurPerMwh;
  const exportRevenueEur = exportedPvMwh * input.exportPriceEurPerMwh;
  const demandChargeSavingsEur =
    input.batteryPurpose === "peak_shaving" ? peakReductionKw * input.demandChargeEurPerKwMonth * 12 : 0;
  const annualSavingsEur = selfConsumptionSavingsEur + exportRevenueEur + demandChargeSavingsEur;

  const includeBattery = input.batteryCapacityKwh > 0;
  const investmentEur = computeIndustrialInvestmentEur({
    pvPowerKw: input.pvPowerKw,
    batteryCapacityKwh: input.batteryCapacityKwh,
    pvInvestmentEurPerKw: input.pvInvestmentEurPerKw,
    batteryInvestmentEurPerKwh: input.batteryInvestmentEurPerKwh,
    includeBattery,
  });

  const paybackYears =
    investmentEur > 0 && annualSavingsEur > 0 ? investmentEur / annualSavingsEur : null;

  const assumptions = [
    `Päevase tarbimise ja PV kattuvus: ${formatEt(coincidence * 100, 0)}% (sõltub päevasest osakaalust).`,
    `Aku kasutatav osa tsükli kohta: ${formatEt(usableFraction * 100, 0)}% (kasutegur ${formatEt(input.batteryEfficiencyPercent, 0)}% × kasutatav maht ${formatEt(input.batteryUsableCapacityPercent, 0)}%).`,
    `Omatarbe tsüklid aastas: ${INDUSTRIAL_ASSUMPTIONS.selfConsumptionCyclesPerYear}.`,
    `Elektri ostuhind: ${formatEt(input.averageElectricityPriceEurPerMwh, 0)} €/MWh.`,
    `Võrku müügihind: ${formatEt(input.exportPriceEurPerMwh, 0)} €/MWh.`,
    input.batteryPurpose === "peak_shaving"
      ? `Võimsustasu: ${formatEt(input.demandChargeEurPerKwMonth, 1)} €/kW/kuu.`
      : "Peak shaving võimsustasu säästu ei arvestata, sest aku on omatarbe režiimis.",
    `PV investeering: ${formatEt(input.pvInvestmentEurPerKw, 0)} €/kW · aku: ${formatEt(input.batteryInvestmentEurPerKwh, 0)} €/kWh.`,
  ];

  const withoutSummary = {
    pvProductionMwh,
    selfConsumedPvMwh,
    exportedPvMwh,
    selfConsumptionSharePercent,
    batterySelfConsumptionImpactMwh,
    peakLoadBeforeKw,
    peakLoadAfterKw,
    peakReductionKw,
    selfConsumptionSavingsEur,
    exportRevenueEur,
    demandChargeSavingsEur,
    annualSavingsEur,
    investmentEur,
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

function withEconomics(
  input: Omit<IndustrialInput, keyof typeof INDUSTRIAL_ECONOMICS_DEFAULTS | "investmentEur"> &
    Partial<Pick<IndustrialInput, keyof typeof INDUSTRIAL_ECONOMICS_DEFAULTS>>,
): IndustrialInput {
  return {
    investmentEur: null,
    ...INDUSTRIAL_ECONOMICS_DEFAULTS,
    ...input,
  };
}

export const INDUSTRIAL_SAMPLE_PROFILES: IndustrialSampleProfile[] = [
  {
    id: "daytime",
    title: "Päevane tootmine",
    description: "Tootmine koondub päevatundidesse, PV kattub tarbimisega hästi.",
    input: withEconomics({
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
    }),
  },
  {
    id: "flat",
    title: "Ööpäevaringne tööstus",
    description: "Tarbimine on ühtlane ööpäev läbi, osa PV-st jääb õhtusse.",
    input: withEconomics({
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
    }),
  },
  {
    id: "peaks",
    title: "Suured tipukoormused",
    description: "Keskmine koormus on mõõdukas, aga tipud on kõrged.",
    input: withEconomics({
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
    }),
  },
];
