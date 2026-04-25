import { toNumber } from "../units";

export type VppRevenueType = "annual" | "arbitrage" | "per_kw_year";

export type VppInput = {
  capacityKwh: string;
  powerKw: string;
  investmentEur: string;
  annualRevenueEur: string;
  lifetimeYears: string;
  efficiencyPct: string;
  cyclesPerYear: string;
  degradationPct: string;
  annualOandMEur: string;
  minimumResidualPct: string;
  revenueType: VppRevenueType;
  arbitrageSpreadEurMwh: string;
  revenuePerKwYear: string;
  financingCostPct: string;
  calculationPeriodYears: string;
  riskCoefficientPct: string;
  availabilityPct: string;
};

export function calculateVppModel(input: VppInput) {
  const cap = Math.max(toNumber(input.capacityKwh), 0);
  const pwr = Math.max(toNumber(input.powerKw), 0);
  const inv = Math.max(toNumber(input.investmentEur), 0);
  const userRevenue = Math.max(toNumber(input.annualRevenueEur), 0);
  const eff = Math.min(Math.max(toNumber(input.efficiencyPct), 50), 99.9) / 100;
  const cycles = Math.max(toNumber(input.cyclesPerYear), 0);
  const degr = Math.min(Math.max(toNumber(input.degradationPct), 0), 25) / 100;
  const years = Math.max(Math.round(toNumber(input.lifetimeYears)), 1);
  const calcYears = Math.max(Math.round(toNumber(input.calculationPeriodYears)), 1);
  const opex = Math.max(toNumber(input.annualOandMEur), 0);
  const residual = Math.min(Math.max(toNumber(input.minimumResidualPct), 0), 100) / 100;
  const spread = Math.max(toNumber(input.arbitrageSpreadEurMwh), 0);
  const perKwYear = Math.max(toNumber(input.revenuePerKwYear), 0);
  const finance = Math.min(Math.max(toNumber(input.financingCostPct), 0), 100) / 100;
  const risk = Math.min(Math.max(toNumber(input.riskCoefficientPct), 0), 100) / 100;
  const availability = Math.min(Math.max(toNumber(input.availabilityPct), 0), 100) / 100;

  let grossRevenueYear = 0;
  if (input.revenueType === "annual") grossRevenueYear = userRevenue;
  else if (input.revenueType === "per_kw_year") grossRevenueYear = pwr * perKwYear;
  else grossRevenueYear = (cap / 1000) * cycles * spread * eff;

  const scenarios = [
    { key: "konservatiivne", label: "Konservatiivne (70%)", multiplier: 0.7 },
    { key: "baas", label: "Baas", multiplier: 1 },
    { key: "optimistlik", label: "Optimistlik (130%)", multiplier: 1.3 },
  ] as const;

  const perScenario = scenarios.map((s) => {
    const financingCostEurYear = inv * finance;
    const netRevenueYear = grossRevenueYear * availability * risk * s.multiplier - opex - financingCostEurYear;
    const payback = netRevenueYear > 0 ? inv / netRevenueYear : null;
    const totalProfit = netRevenueYear * years - inv;
    const cashflows = Array.from({ length: calcYears }, (_, idx) => netRevenueYear * (1 - degr) ** idx);
    const salvageValue = inv * residual;
    return {
      ...s,
      cashflows,
      salvageValue,
      grossRevenueYear: grossRevenueYear * s.multiplier,
      netRevYear1: netRevenueYear,
      totalProfit: totalProfit + salvageValue,
      paybackYears: payback,
    };
  });

  const penaltyFactors = [
    { label: "kättesaadavus", impact: 1 - availability },
    { label: "riskikoefitsient", impact: 1 - risk },
    { label: "degradatsioon", impact: degr },
    { label: "finantseerimiskulu", impact: finance },
  ];
  const mainRiskFactor = penaltyFactors.sort((a, b) => b.impact - a.impact)[0]?.label ?? "tururisk";

  return {
    inv,
    eff,
    years,
    calcYears,
    opex,
    revenueType: input.revenueType,
    perScenario,
    mainRiskFactor,
    grossRevenueYear,
  };
}
