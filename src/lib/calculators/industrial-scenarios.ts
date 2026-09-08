import {
  calculateIndustrial,
  computeIndustrialInvestmentEur,
  sanitizeIndustrialInput,
  type IndustrialInput,
  type IndustrialResult,
} from "./industrial";

/**
 * Tööstusmooduli v0.5 stsenaariumite võrdlus.
 * Kasutab sama lihtsustatud calculateIndustrial mudelit; ei ole 15-min optimeerija.
 * Investeeringud ja säästud arvutatakse majanduslike eelduste (ühikhinnad, müük, võimsustasu) põhjal.
 */

export type IndustrialScenarioId = "base" | "pv_only" | "pv_battery_self" | "pv_battery_peak";

export type IndustrialScenarioRow = {
  id: IndustrialScenarioId;
  label: string;
  shortLabel: string;
  investmentEur: number;
  pvProductionMwh: number;
  selfConsumedPvMwh: number;
  exportedPvMwh: number;
  selfConsumptionSharePercent: number;
  peakLoadAfterKw: number;
  selfConsumptionSavingsEur: number;
  exportRevenueEur: number;
  demandChargeSavingsEur: number;
  /** Aastane kogumõju */
  annualSavingsEur: number;
  paybackYears: number | null;
};

export type IndustrialScenarioComparison = {
  scenarios: IndustrialScenarioRow[];
  peakLoadBeforeKw: number;
  bestSavingsId: IndustrialScenarioId;
  bestPaybackId: IndustrialScenarioId | null;
  bestPeakReductionId: IndustrialScenarioId;
  bestSelfConsumptionId: IndustrialScenarioId;
  conclusion: {
    bestSavingsLabel: string;
    bestPaybackLabel: string | null;
    bestPeakLabel: string;
    bestSelfConsumptionLabel: string;
    summary: string;
  };
};

const LABELS: Record<IndustrialScenarioId, { label: string; shortLabel: string }> = {
  base: { label: "Baasstsenaarium", shortLabel: "Baas" },
  pv_only: { label: "Ainult PV", shortLabel: "Ainult PV" },
  pv_battery_self: { label: "PV + aku (omatarve)", shortLabel: "PV+aku omatarve" },
  pv_battery_peak: { label: "PV + aku (peak shaving)", shortLabel: "PV+aku tipp" },
};

function scenarioInvestment(
  id: IndustrialScenarioId,
  input: IndustrialInput,
): number {
  if (id === "base") return 0;
  if (id === "pv_only") {
    return computeIndustrialInvestmentEur({
      pvPowerKw: input.pvPowerKw,
      batteryCapacityKwh: input.batteryCapacityKwh,
      pvInvestmentEurPerKw: input.pvInvestmentEurPerKw,
      batteryInvestmentEurPerKwh: input.batteryInvestmentEurPerKwh,
      includeBattery: false,
    });
  }
  return computeIndustrialInvestmentEur({
    pvPowerKw: input.pvPowerKw,
    batteryCapacityKwh: input.batteryCapacityKwh,
    pvInvestmentEurPerKw: input.pvInvestmentEurPerKw,
    batteryInvestmentEurPerKwh: input.batteryInvestmentEurPerKwh,
    includeBattery: true,
  });
}

function toRow(id: IndustrialScenarioId, result: IndustrialResult, investmentEur: number): IndustrialScenarioRow {
  const annualSavingsEur = result.annualSavingsEur;
  const paybackYears =
    investmentEur > 0 && annualSavingsEur > 0 ? investmentEur / annualSavingsEur : null;

  return {
    id,
    label: LABELS[id].label,
    shortLabel: LABELS[id].shortLabel,
    investmentEur,
    pvProductionMwh: result.pvProductionMwh,
    selfConsumedPvMwh: result.selfConsumedPvMwh,
    exportedPvMwh: result.exportedPvMwh,
    selfConsumptionSharePercent: result.selfConsumptionSharePercent,
    peakLoadAfterKw: result.peakLoadAfterKw,
    selfConsumptionSavingsEur: result.selfConsumptionSavingsEur,
    exportRevenueEur: result.exportRevenueEur,
    demandChargeSavingsEur: result.demandChargeSavingsEur,
    annualSavingsEur,
    paybackYears,
  };
}

function pickMaxBy(
  rows: IndustrialScenarioRow[],
  score: (row: IndustrialScenarioRow) => number,
): IndustrialScenarioId {
  let best = rows[0]!;
  let bestScore = score(best);
  for (const row of rows.slice(1)) {
    const value = score(row);
    if (value > bestScore) {
      best = row;
      bestScore = value;
    }
  }
  return best.id;
}

function pickBestPayback(rows: IndustrialScenarioRow[]): IndustrialScenarioId | null {
  const withPayback = rows.filter((row) => row.paybackYears != null && row.paybackYears > 0);
  if (withPayback.length === 0) return null;
  let best = withPayback[0]!;
  for (const row of withPayback.slice(1)) {
    if ((row.paybackYears ?? Infinity) < (best.paybackYears ?? Infinity)) {
      best = row;
    }
  }
  return best.id;
}

/**
 * Builds four comparable scenarios from the same site inputs (consumption, prices, PV/battery sizes).
 */
export function calculateIndustrialScenarios(rawInput: IndustrialInput): IndustrialScenarioComparison {
  const input = sanitizeIndustrialInput(rawInput);
  const peakLoadBeforeKw = input.peakLoadKw;

  const baseResult = calculateIndustrial({
    ...input,
    pvPowerKw: 0,
    pvSpecificYieldKwhPerKw: 0,
    batteryCapacityKwh: 0,
    batteryPowerKw: 0,
    batteryPurpose: "self_consumption",
  });

  const pvOnlyResult = calculateIndustrial({
    ...input,
    batteryCapacityKwh: 0,
    batteryPowerKw: 0,
    batteryPurpose: "self_consumption",
  });

  const selfResult = calculateIndustrial({
    ...input,
    batteryPurpose: "self_consumption",
  });

  const peakResult = calculateIndustrial({
    ...input,
    batteryPurpose: "peak_shaving",
  });

  const scenarios: IndustrialScenarioRow[] = [
    toRow("base", baseResult, scenarioInvestment("base", input)),
    toRow("pv_only", pvOnlyResult, scenarioInvestment("pv_only", input)),
    toRow("pv_battery_self", selfResult, scenarioInvestment("pv_battery_self", input)),
    toRow("pv_battery_peak", peakResult, scenarioInvestment("pv_battery_peak", input)),
  ];

  const bestSavingsId = pickMaxBy(scenarios, (row) => row.annualSavingsEur);
  const bestPeakReductionId = pickMaxBy(scenarios, (row) => peakLoadBeforeKw - row.peakLoadAfterKw);
  const bestSelfConsumptionId = pickMaxBy(scenarios, (row) => row.selfConsumedPvMwh);
  const bestPaybackId = pickBestPayback(scenarios);

  const bestSavings = scenarios.find((s) => s.id === bestSavingsId)!;
  const bestPeak = scenarios.find((s) => s.id === bestPeakReductionId)!;
  const bestSelf = scenarios.find((s) => s.id === bestSelfConsumptionId)!;
  const bestPayback = bestPaybackId != null ? scenarios.find((s) => s.id === bestPaybackId)! : null;
  const peakCut = Math.max(peakLoadBeforeKw - bestPeak.peakLoadAfterKw, 0);

  return {
    scenarios,
    peakLoadBeforeKw,
    bestSavingsId,
    bestPaybackId,
    bestPeakReductionId,
    bestSelfConsumptionId,
    conclusion: {
      bestSavingsLabel: bestSavings.label,
      bestPaybackLabel: bestPayback?.label ?? null,
      bestPeakLabel: bestPeak.label,
      bestSelfConsumptionLabel: bestSelf.label,
      summary:
        `Suurima aastase kogumõju annab ${bestSavings.label}` +
        (bestSavings.annualSavingsEur > 0 ? "." : " (praegu kogumõju on null).") +
        (bestPayback
          ? ` Lühima lihtsustatud tasuvusaja annab ${bestPayback.label} (${bestPayback.paybackYears!.toFixed(1).replace(".", ",")} a).`
          : " Lihtsustatud tasuvusaega ei saa ühegi stsenaariumi jaoks arvutada.") +
        ` Tipukoormust vähendab kõige rohkem ${bestPeak.label}` +
        (peakCut > 0 ? ` (−${peakCut.toFixed(0)} kW).` : " (tippu ei lõigata)."),
    },
  };
}
