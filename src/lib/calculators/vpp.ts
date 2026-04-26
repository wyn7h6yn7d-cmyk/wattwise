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

export type VppCoreInput = {
  batteryKwh: number;
  batteryKw: number;
  investment: number;
  annualRevenuePotential: number;
  roundtripEfficiencyPercent: number;
  availabilityPercent: number;
  riskDiscountPercent: number;
  annualMaintenanceCost: number;
  lifetimeYears: number;
};

export type VppCoreResult = {
  grossRevenue: number;
  netRevenue: number;
  paybackYears: number | null;
  totalProfit: number;
  conservativeNetRevenue: number;
  baseNetRevenue: number;
  optimisticNetRevenue: number;
};

export function calculateVppCore(input: VppCoreInput): VppCoreResult {
  const investment = Math.max(input.investment, 0);
  const grossRevenue = Math.max(input.annualRevenuePotential, 0);
  const efficiency = Math.min(Math.max(input.roundtripEfficiencyPercent, 0), 100) / 100;
  const availability = Math.min(Math.max(input.availabilityPercent, 0), 100) / 100;
  const riskDiscount = Math.min(Math.max(input.riskDiscountPercent, 0), 100) / 100;
  const maintenance = Math.max(input.annualMaintenanceCost, 0);
  const lifetimeYears = Math.max(Math.round(input.lifetimeYears), 1);

  const netRevenue = grossRevenue * efficiency * availability * (1 - riskDiscount) - maintenance;
  const paybackYears = netRevenue > 0 ? investment / netRevenue : null;
  const totalProfit = netRevenue * lifetimeYears - investment;

  return {
    grossRevenue,
    netRevenue,
    paybackYears,
    totalProfit,
    conservativeNetRevenue: netRevenue * 0.7,
    baseNetRevenue: netRevenue,
    optimisticNetRevenue: netRevenue * 1.3,
  };
}

export function calculateVppModel(input: VppInput) {
  const read = (value: string, fallback: number) => {
    const raw = value.trim();
    if (!raw) return fallback;
    const parsed = toNumber(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const cap = Math.max(toNumber(input.capacityKwh), 0);
  const pwr = Math.max(toNumber(input.powerKw), 0);
  const inv = Math.max(toNumber(input.investmentEur), 0);
  const userRevenue = Math.max(toNumber(input.annualRevenueEur), 0);
  const eff = Math.min(Math.max(read(input.efficiencyPct, 90), 50), 99.9) / 100;
  const cycles = Math.max(read(input.cyclesPerYear, 0), 0);
  const degr = Math.min(Math.max(toNumber(input.degradationPct), 0), 25) / 100;
  const years = Math.max(Math.round(toNumber(input.lifetimeYears)), 1);
  const calcYears = Math.max(Math.round(read(input.calculationPeriodYears, years)), 1);
  const opex = Math.max(read(input.annualOandMEur, 0), 0);
  const residual = Math.min(Math.max(toNumber(input.minimumResidualPct), 0), 100) / 100;
  const spread = Math.max(toNumber(input.arbitrageSpreadEurMwh), 0);
  const perKwYear = Math.max(toNumber(input.revenuePerKwYear), 0);
  const riskDiscountPct = Math.min(Math.max(100 - read(input.riskCoefficientPct, 85), 0), 100);
  const availabilityPct = Math.min(Math.max(read(input.availabilityPct, 95), 0), 100);
  const efficiencyPct = Math.min(Math.max(read(input.efficiencyPct, 90), 0), 100);

  let annualRevenuePotential = 0;
  if (input.revenueType === "annual") annualRevenuePotential = userRevenue;
  else if (input.revenueType === "per_kw_year") annualRevenuePotential = pwr * perKwYear;
  else annualRevenuePotential = (cap / 1000) * cycles * spread;

  const core = calculateVppCore({
    batteryKwh: cap,
    batteryKw: pwr,
    investment: inv,
    annualRevenuePotential,
    roundtripEfficiencyPercent: efficiencyPct,
    availabilityPercent: availabilityPct,
    riskDiscountPercent: riskDiscountPct,
    annualMaintenanceCost: opex,
    lifetimeYears: years,
  });

  const scenarios = [
    { key: "konservatiivne", label: "Konservatiivne (70%)", multiplier: 0.7 },
    { key: "baas", label: "Baas", multiplier: 1 },
    { key: "optimistlik", label: "Optimistlik (130%)", multiplier: 1.3 },
  ] as const;

  const perScenario = scenarios.map((s) => {
    const netRevenueYear = core.netRevenue * s.multiplier;
    const payback = netRevenueYear > 0 ? inv / netRevenueYear : null;
    const totalProfit = netRevenueYear * years - inv;
    const cashflows = Array.from({ length: calcYears }, (_, idx) => netRevenueYear * (1 - degr) ** idx);
    return {
      ...s,
      cashflows,
      salvageValue: inv * residual,
      grossRevenueYear: core.grossRevenue,
      netRevYear1: netRevenueYear,
      totalProfit,
      paybackYears: payback,
    };
  });

  const penaltyFactors = [
    { label: "kättesaadavus", impact: 1 - availabilityPct / 100 },
    { label: "riskiallahindlus", impact: riskDiscountPct / 100 },
    { label: "degradatsioon", impact: degr },
    { label: "efektiivsus", impact: 1 - efficiencyPct / 100 },
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
    grossRevenueYear: core.grossRevenue,
  };
}
