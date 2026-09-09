import { describe, expect, it } from "vitest";
import { INDUSTRIAL_ECONOMICS_DEFAULTS, calculateIndustrial } from "../calculators/industrial";
import { calculateIndustrialScenarios, recommendIndustrialScenario } from "../calculators/industrial-scenarios";
import { generateIndustrialReport, industrialPdfFilename } from "./generateIndustrialReport";

describe("industrial PDF report", () => {
  it("builds a downloadable PDF with branding pages", async () => {
    const input = {
      companyName: "Demo tehas",
      annualConsumptionMwh: 2000,
      daytimeSharePercent: 70,
      peakLoadKw: 800,
      averageElectricityPriceEurPerMwh: 110,
      pvPowerKw: 800,
      pvSpecificYieldKwhPerKw: 950,
      batteryCapacityKwh: 500,
      batteryPowerKw: 250,
      batteryPurpose: "self_consumption" as const,
      investmentEur: null,
      ...INDUSTRIAL_ECONOMICS_DEFAULTS,
    };
    const result = calculateIndustrial(input);
    const comparison = calculateIndustrialScenarios(input);
    const rec = recommendIndustrialScenario(comparison);
    const bytes = await generateIndustrialReport({
      companyName: input.companyName,
      result,
      recommendationHeadline: rec.headline,
      recommendationBody: rec.body,
      priceModeLabel: "Keskmine hind",
      scenarioComparison: comparison,
      timeseries: null,
      inputs: [
        { label: "Profiil", value: input.companyName },
        { label: "PV", value: "800 kW" },
      ],
      assumptions: result.assumptions,
      limitations: ["Tulemused on hinnangulised."],
    });
    expect(bytes.byteLength).toBeGreaterThan(1000);
    expect(bytes[0]).toBe(0x25); // %
    expect(industrialPdfFilename("Demo tehas")).toContain("toostus");
  });
});
