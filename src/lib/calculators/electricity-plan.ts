import { normalizeEurPerKwh, toNumber } from "../units";

export type ElectricityPlanInput = {
  mode: "quick" | "advanced";
  monthlyBreakdown: string[];
  monthlyKwh: string;
  daySharePct: string;
  nightSharePct: string;
  spotEurKwh: string;
  fixedEurKwh: string;
  spotMarginEurKwh: string;
  gridFeeEurKwh: string;
  renewableFeeEurKwh: string;
  exciseEurKwh: string;
  spotMonthlyFeeEur: string;
  fixedMonthlyFeeEur: string;
  networkMonthlyFeeEur: string;
  pricesIncludeVat: boolean;
};

export function calculateElectricityPlan(input: ElectricityPlanInput) {
  const monthlyFromBreakdown =
    input.monthlyBreakdown.reduce((sum, item) => sum + Math.max(toNumber(item), 0), 0) / 12;
  const kwhMonth =
    input.mode === "advanced" && input.monthlyBreakdown.some((item) => item.trim().length > 0)
      ? Math.max(monthlyFromBreakdown, 0)
      : Math.max(toNumber(input.monthlyKwh), 0);
  const kwhYear = kwhMonth * 12;

  const rawSpot = Math.max(toNumber(input.spotEurKwh), 0);
  const rawFixed = Math.max(toNumber(input.fixedEurKwh), 0);
  const rawGrid = Math.max(toNumber(input.gridFeeEurKwh), 0);
  const rawSpotMargin = Math.max(toNumber(input.spotMarginEurKwh), 0);
  const rawRenewable = Math.max(toNumber(input.renewableFeeEurKwh), 0);
  const rawExcise = Math.max(toNumber(input.exciseEurKwh), 0);

  const spot = normalizeEurPerKwh(rawSpot);
  const fixed = normalizeEurPerKwh(rawFixed);
  const gridFee = Math.max(toNumber(input.gridFeeEurKwh), 0);
  const spotMargin = normalizeEurPerKwh(rawSpotMargin);
  const renewable = normalizeEurPerKwh(rawRenewable);
  const excise = normalizeEurPerKwh(rawExcise);
  const vatMultiplier = input.pricesIncludeVat ? 1 : 1.24;

  const spotMonthlyFee = Math.max(toNumber(input.spotMonthlyFeeEur), 0);
  const fixedMonthlyFee = Math.max(toNumber(input.fixedMonthlyFeeEur), 0);
  const networkMonthlyFee = Math.max(toNumber(input.networkMonthlyFeeEur), 0);

  const spotMonthlyBeforeVat =
    kwhMonth * (spot + spotMargin + gridFee + renewable + excise) + (spotMonthlyFee + networkMonthlyFee);
  const fixedMonthlyBeforeVat =
    kwhMonth * (fixed + gridFee + renewable + excise) + (fixedMonthlyFee + networkMonthlyFee);

  const spotMonthlyCost = spotMonthlyBeforeVat * vatMultiplier;
  const fixedMonthlyCost = fixedMonthlyBeforeVat * vatMultiplier;
  const spotAnnualCost = spotMonthlyCost * 12;
  const fixedAnnualCost = fixedMonthlyCost * 12;

  const annualDiff = spotAnnualCost - fixedAnnualCost;
  const monthlyDiff = annualDiff / 12;
  const diffPercent = fixedAnnualCost > 0 ? (annualDiff / fixedAnnualCost) * 100 : 0;
  const cheaper =
    Math.abs(annualDiff) < 0.01 ? "Võrdsed" : spotAnnualCost < fixedAnnualCost ? "Spot" : "Fikseeritud";

  const breakEvenSpotPrice =
    fixed - spotMargin + (fixedMonthlyFee - spotMonthlyFee) / Math.max(kwhMonth, 1e-6);
  const breakEvenDelta = breakEvenSpotPrice - spot;

  const reco =
    Math.abs(annualDiff) < 30
      ? "Hinnang on väga lähedane — vali pigem stabiilsuse ja riskitaluvuse järgi."
      : cheaper === "Spot"
        ? "Selle sisendi põhjal on soodsam spot-hinnaga pakett."
        : "Selle sisendi põhjal on soodsam fikseeritud pakett (stabiilsem valik).";

  const mwhWarning =
    rawSpot > 3 || rawFixed > 3 || rawGrid > 3 || rawSpotMargin > 3 || rawRenewable > 3 || rawExcise > 3;

  return {
    kwhYear,
    spotAnnualCost,
    fixedAnnualCost,
    spotMonthlyCost,
    fixedMonthlyCost,
    annualDiff,
    monthlyDiff,
    diffPercent,
    cheaper,
    reco,
    vatMultiplier,
    breakEvenSpotPrice,
    breakEvenDelta,
    mwhWarning,
    dayShare: Math.max(toNumber(input.daySharePct), 0),
    nightShare: Math.max(toNumber(input.nightSharePct), 0),
  };
}
