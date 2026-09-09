"use client";

import { UsedAssumptionsBlock } from "@/components/used-assumptions-block";
import { BatterySocChart, TimeseriesLoadPvBatteryChart } from "@/components/industrial/industrial-charts";
import { ConsumptionProfileChart } from "@/components/industrial/consumption-profile-chart";
import { IndustrialEnergyFlowChart } from "@/components/industrial/industrial-energy-flow-chart";
import { IndustrialKpiSummary } from "@/components/industrial/industrial-kpi-summary";
import { IndustrialMoneyBreakdown } from "@/components/industrial/industrial-money-breakdown";
import { IndustrialPeakChart } from "@/components/industrial/industrial-peak-chart";
import { IndustrialPriceBasis, type IndustrialPriceBasisProps } from "@/components/industrial/industrial-price-basis";
import {
  IndustrialRecommendationCard,
  type IndustrialInterpretation,
} from "@/components/industrial/industrial-recommendation-card";
import { IndustrialScenarioComparisonPanel } from "@/components/industrial/industrial-scenario-comparison";
import { IndustrialTimeseriesPanel } from "@/components/industrial/industrial-timeseries-panel";
import { fmtEt } from "@/components/industrial/format-et";
import type { ConsumptionChartSeries } from "@/lib/consumption/consumption-profile-insight";
import type { IndustrialResult } from "@/lib/calculators/industrial";
import type { IndustrialScenarioComparison } from "@/lib/calculators/industrial-scenarios";
import type { IndustrialTimeseriesResult } from "@/lib/calculators/industrial-timeseries";
import type { MatchPriceSeriesResult } from "@/lib/market/match-price-series";
import type { ReactNode } from "react";

function DashSection({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="min-w-0 border border-zinc-800/90 bg-zinc-950/70 p-4 sm:p-5">
      <header className="mb-4 border-b border-zinc-800/80 pb-3">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-50 sm:text-base">{title}</h2>
        {description ? <p className="mt-1 text-xs leading-relaxed text-zinc-500 sm:text-sm">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

export function IndustrialResultsDashboard({
  result,
  interpretation,
  scenarioComparison,
  timeseriesResult,
  annualConsumptionMwh,
  priceModeLabel,
  priceBasis,
  priceMatch,
  csvChartSeries,
  assumptions,
  onPrintReport,
}: {
  result: IndustrialResult;
  interpretation: IndustrialInterpretation;
  scenarioComparison: IndustrialScenarioComparison | null;
  timeseriesResult: IndustrialTimeseriesResult | null;
  annualConsumptionMwh: number;
  priceModeLabel: string;
  priceBasis: Omit<IndustrialPriceBasisProps, "variant">;
  priceMatch: MatchPriceSeriesResult | null;
  csvChartSeries: ConsumptionChartSeries | null;
  assumptions: {
    userInputs: string[];
    defaultAssumptions: string[];
    apiValues: string[];
    mostInfluentialInputs: string[];
  };
  onPrintReport: () => void;
}) {
  const gridImportMwh = Math.max(annualConsumptionMwh - result.selfConsumedPvMwh, 0);
  const selfEur = timeseriesResult?.economics.selfConsumptionValueEur ?? result.selfConsumptionSavingsEur;
  const exportEur = timeseriesResult?.economics.exportRevenueEur ?? result.exportRevenueEur;
  const demandEur = timeseriesResult?.economics.demandChargeSavingsEur ?? result.demandChargeSavingsEur;

  return (
    <div id="industrial-results" className="grid max-w-full gap-6 overflow-x-hidden">
      <IndustrialKpiSummary result={result} />

      <IndustrialRecommendationCard interpretation={interpretation} />

      <DashSection
        title="Hindade alus"
        description="Millist ostu- ja müügihinda aastane mudel ja ajapõhine majandus tegelikult kasutavad."
      >
        <IndustrialPriceBasis variant="result" {...priceBasis} />
      </DashSection>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-glow w-full sm:w-auto" onClick={onPrintReport}>
          Laadi PDF raport
        </button>
        <p className="w-full text-xs text-zinc-500 sm:w-auto sm:self-center">
          Avab print-vaate — salvesta brauserist PDF-ina.
        </p>
      </div>

      <DashSection
        title="Põhitulemus"
        description="Valitud PV ja aku eelduste aastane mõju. See ei ole optimeerimismootor."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["PV toodang", `${fmtEt(result.pvProductionMwh, 1)} MWh`],
            ["Kohapeal kasutatud PV", `${fmtEt(result.selfConsumedPvMwh, 1)} MWh`],
            ["Võrku müüdav PV", `${fmtEt(result.exportedPvMwh, 1)} MWh`],
            ["Omatarbe sääst", `${fmtEt(result.selfConsumptionSavingsEur, 0)} €`],
            ["Võrku müügi tulu", `${fmtEt(result.exportRevenueEur, 0)} €`],
            ["Võimsustasu sääst", `${fmtEt(result.demandChargeSavingsEur, 0)} €`],
          ].map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-3 border-b border-zinc-800/80 py-2">
              <span className="text-sm text-zinc-500">{label}</span>
              <span className="font-mono text-sm tabular-nums text-zinc-100">{value}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">{result.summary}</p>
        <div className="mt-4">
          <UsedAssumptionsBlock {...assumptions} />
        </div>
      </DashSection>

      <DashSection title="Energiavood" description="Kuhu PV toodang läheb, kui palju tuleb võrgust ja kuidas tipp muutub.">
        <div className="grid gap-4 xl:grid-cols-2">
          <IndustrialEnergyFlowChart
            pvProductionMwh={result.pvProductionMwh}
            selfConsumedMwh={result.selfConsumedPvMwh}
            exportedMwh={result.exportedPvMwh}
            batteryImpactMwh={result.batterySelfConsumptionImpactMwh}
            gridImportMwh={gridImportMwh}
          />
          <IndustrialPeakChart beforeKw={result.peakLoadBeforeKw} afterKw={result.peakLoadAfterKw} />
        </div>
        {csvChartSeries ? (
          <div className="mt-4">
            <ConsumptionProfileChart series={csvChartSeries} />
          </div>
        ) : null}
      </DashSection>

      {scenarioComparison ? (
        <DashSection title="Stsenaariumite võrdlus" description="Sama sisend, neli investeerimisloogikat.">
          <IndustrialScenarioComparisonPanel comparison={scenarioComparison} />
        </DashSection>
      ) : null}

      <DashSection
        title="Ajapõhine simulatsioon"
        description="CSV korral: tarbimine, PV ja aku sammude kaupa. Käsitsi režiimis see plokk ootab tarbimisprofiili."
      >
        {timeseriesResult ? (
          <>
            <div className="grid gap-4">
              <TimeseriesLoadPvBatteryChart result={timeseriesResult} />
              <BatterySocChart result={timeseriesResult} />
            </div>
            <div className="mt-4">
              <IndustrialTimeseriesPanel
                result={timeseriesResult}
                priceModeLabel={priceModeLabel}
                priceMatch={priceMatch}
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-zinc-400">
            Ajapõhine simulatsioon ilmub pärast CSV tarbimisprofiili importi ja arvutuse tegemist.
          </p>
        )}
      </DashSection>

      <DashSection title="Rahalise mõju jaotus" description="Eurodes: omatarve, võrku müük ja võimsustasu.">
        <IndustrialMoneyBreakdown
          selfConsumptionEur={selfEur}
          exportEur={exportEur}
          demandChargeEur={demandEur}
        />
        {timeseriesResult ? (
          <p className="mt-3 text-xs text-zinc-500">
            Hinnarežiim: {priceModeLabel}. Ajapõhine jaotus kasutab{" "}
            {timeseriesResult.economics.priceMode === "step_series"
              ? "ajatempli hindu (börs või CSV), mitte perioodi keskmist"
              : "vormi keskmist ostu- ja müügihinda igal sammul"}
            . Perioodi mõju {fmtEt(timeseriesResult.economics.periodImpactEur, 0)} € · aastaks
            skaleeritud {fmtEt(timeseriesResult.economics.annualizedImpactEur, 0)} €/a. Ülemised KPI-d
            jäävad vormi keskmise ostuhinna peale.
          </p>
        ) : (
          <p className="mt-3 text-xs text-zinc-500">
            Ilma CSV-ta kasutatakse aastase mudeli jaotust vormi keskmise ostu- ja müügihinnaga.
            Ajapõhine majandus täpsustub pärast tarbimisprofiili importi.
          </p>
        )}
      </DashSection>
    </div>
  );
}
