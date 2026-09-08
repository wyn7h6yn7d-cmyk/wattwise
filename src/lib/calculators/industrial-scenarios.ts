import {
  calculateIndustrial,
  sanitizeIndustrialInput,
  type IndustrialInput,
  type IndustrialResult,
} from "./industrial";

/**
 * Tööstusmooduli v0.4 stsenaariumite võrdlus.
 * Kasutab sama lihtsustatud calculateIndustrial mudelit; ei ole 15-min optimeerija.
 */

export type IndustrialScenarioId = "base" | "pv_only" | "pv_battery_self" | "pv_battery_peak";

export type IndustrialScenarioRow = {
  id: IndustrialScenarioId;
  label: string;
  shortLabel: string;
  pvProductionMwh: number;
  selfConsumedPvMwh: number;
  exportedPvMwh: number;
  selfConsumptionSharePercent: number;
  peakLoadAfterKw: number;
  annualSavingsEur: number;
  paybackYears: number | null;
};

export type IndustrialScenarioComparison = {
  scenarios: IndustrialScenarioRow[];
  peakLoadBeforeKw: number;
  bestSavingsId: IndustrialScenarioId;
  bestPeakReductionId: IndustrialScenarioId;
  bestSelfConsumptionId: IndustrialScenarioId;
  conclusion: {
    bestSavingsLabel: string;
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

function toRow(id: IndustrialScenarioId, result: IndustrialResult): IndustrialScenarioRow {
  return {
    id,
    label: LABELS[id].label,
    shortLabel: LABELS[id].shortLabel,
    pvProductionMwh: result.pvProductionMwh,
    selfConsumedPvMwh: result.selfConsumedPvMwh,
    exportedPvMwh: result.exportedPvMwh,
    selfConsumptionSharePercent: result.selfConsumptionSharePercent,
    peakLoadAfterKw: result.peakLoadAfterKw,
    annualSavingsEur: result.annualSavingsEur,
    paybackYears: result.paybackYears,
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
    investmentEur: null,
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
    toRow("base", baseResult),
    toRow("pv_only", pvOnlyResult),
    toRow("pv_battery_self", selfResult),
    toRow("pv_battery_peak", peakResult),
  ];

  const bestSavingsId = pickMaxBy(scenarios, (row) => row.annualSavingsEur);
  const bestPeakReductionId = pickMaxBy(scenarios, (row) => peakLoadBeforeKw - row.peakLoadAfterKw);
  const bestSelfConsumptionId = pickMaxBy(scenarios, (row) => row.selfConsumedPvMwh);

  const bestSavings = scenarios.find((s) => s.id === bestSavingsId)!;
  const bestPeak = scenarios.find((s) => s.id === bestPeakReductionId)!;
  const bestSelf = scenarios.find((s) => s.id === bestSelfConsumptionId)!;
  const peakCut = Math.max(peakLoadBeforeKw - bestPeak.peakLoadAfterKw, 0);

  return {
    scenarios,
    peakLoadBeforeKw,
    bestSavingsId,
    bestPeakReductionId,
    bestSelfConsumptionId,
    conclusion: {
      bestSavingsLabel: bestSavings.label,
      bestPeakLabel: bestPeak.label,
      bestSelfConsumptionLabel: bestSelf.label,
      summary:
        `Suurima aastase säästu annab ${bestSavings.label}` +
        (bestSavings.annualSavingsEur > 0 ? "." : " (praegu sääst on null).") +
        ` Tipukoormust vähendab kõige rohkem ${bestPeak.label}` +
        (peakCut > 0 ? ` (−${peakCut.toFixed(0)} kW).` : " (tippu ei lõigata).") +
        ` Omatarbe suurendamiseks sobib kõige paremini ${bestSelf.label}.`,
    },
  };
}
