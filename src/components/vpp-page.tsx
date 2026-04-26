"use client";

import { useMemo, useState } from "react";
import { canViewFullAnalysis } from "@/lib/unlock";
import { useProjectUnlock } from "@/lib/useProjectUnlock";
import { PaywallCard } from "@/components/paywall-card";
import { FEATURES } from "@/lib/features";
import { clientDownloadPdf } from "@/lib/pdf/client-download";
import { CalculatorPdfActions } from "@/components/calculator-pdf-actions";
import { UsedAssumptionsBlock } from "@/components/used-assumptions-block";
import { AdvancedInputAccordion } from "@/components/advanced-input-accordion";
import { calculateVppModel } from "@/lib/calculators/vpp";
import { ChartCard } from "@/components/charts/ChartCard";
import { toNumber as num } from "@/lib/units";

const fmtEur = (value: number) =>
  new Intl.NumberFormat("et-EE", { maximumFractionDigits: 0 }).format(value) + " €";

function formatYearLabel(index: number) {
  return `A${index + 1}`;
}

function averageCashflowEur(cashflows: number[] | undefined) {
  const values = cashflows?.filter((v) => Number.isFinite(v)) ?? [];
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

type RevenueType = "annual" | "arbitrage" | "per_kw_year";

export function VppPageClient() {
  const { projectId, unlock, purchaseBusy, startCheckout, checkPaymentStatus, message, setMessage } =
    useProjectUnlock();
  const [mode, setMode] = useState<"quick" | "advanced">("quick");
  const [capacityKwh, setCapacityKwh] = useState("");
  const [powerKw, setPowerKw] = useState("");
  const [investmentEur, setInvestmentEur] = useState("");
  const [annualRevenueEur, setAnnualRevenueEur] = useState("");
  const [lifetimeYears, setLifetimeYears] = useState("");
  const [efficiencyPct, setEfficiencyPct] = useState("");
  const [cyclesPerYear, setCyclesPerYear] = useState("");
  const [degradationPct, setDegradationPct] = useState("");
  const [annualOandMEur, setAnnualOandMEur] = useState("");
  const [minimumResidualPct, setMinimumResidualPct] = useState("");
  const [revenueType, setRevenueType] = useState<RevenueType>("annual");
  const [arbitrageSpreadEurMwh, setArbitrageSpreadEurMwh] = useState("");
  const [revenuePerKwYear, setRevenuePerKwYear] = useState("");
  const [financingCostPct, setFinancingCostPct] = useState("");
  const [calculationPeriodYears, setCalculationPeriodYears] = useState("");
  const [riskCoefficientPct, setRiskCoefficientPct] = useState("");
  const [availabilityPct, setAvailabilityPct] = useState("");
  const [hasCalculated, setHasCalculated] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const model = useMemo(() => calculateVppModel({
    capacityKwh,
    powerKw,
    investmentEur,
    annualRevenueEur,
    lifetimeYears,
    efficiencyPct,
    cyclesPerYear,
    degradationPct,
    annualOandMEur,
    minimumResidualPct,
    revenueType,
    arbitrageSpreadEurMwh,
    revenuePerKwYear,
    financingCostPct,
    calculationPeriodYears,
    riskCoefficientPct,
    availabilityPct,
  }), [
    annualOandMEur,
    annualRevenueEur,
    efficiencyPct,
    investmentEur,
    lifetimeYears,
    capacityKwh,
    powerKw,
    cyclesPerYear,
    degradationPct,
    minimumResidualPct,
    revenueType,
    arbitrageSpreadEurMwh,
    revenuePerKwYear,
    financingCostPct,
    calculationPeriodYears,
    riskCoefficientPct,
    availabilityPct,
  ]);
  const hasRequiredInputs =
    num(capacityKwh) > 0 &&
    num(powerKw) > 0 &&
    num(investmentEur) > 0 &&
    num(annualRevenueEur) > 0 &&
    num(lifetimeYears) > 0;

  const assumptionsInfo = useMemo(() => {
    const userInputs: string[] = [];
    if (num(capacityKwh) > 0) userInputs.push(`Aku maht: ${capacityKwh} kWh`);
    if (num(powerKw) > 0) userInputs.push(`Aku võimsus: ${powerKw} kW`);
    if (num(investmentEur) > 0) userInputs.push(`Investeering: ${investmentEur} €`);
    if (revenueType === "annual" && num(annualRevenueEur) > 0) userInputs.push(`Aastane tulu: ${annualRevenueEur} €`);
    if (mode === "advanced") userInputs.push(`Tulu tüüp: ${revenueType}`);

    const defaultAssumptions: string[] = [];
    defaultAssumptions.push(`Kättesaadavus: ${num(availabilityPct) > 0 ? num(availabilityPct) : 95}%`);
    defaultAssumptions.push(`Efektiivsus: ${num(efficiencyPct) > 0 ? num(efficiencyPct) : 90}%`);
    defaultAssumptions.push(`Riskikorrektuur: ${100 - (num(riskCoefficientPct) > 0 ? num(riskCoefficientPct) : 85)}%`);
    defaultAssumptions.push(`Hoolduskulu: ${num(annualOandMEur) > 0 ? annualOandMEur : "0"} €/a`);
    defaultAssumptions.push(`Eluiga: ${num(lifetimeYears) > 0 ? lifetimeYears : "—"} a`);

    return {
      userInputs,
      defaultAssumptions,
      apiValues: [],
      mostInfluentialInputs: [
        "Aastane brutotulu / tulu tüüp",
        "Riskikoefitsient ja kättesaadavus",
        "Investeeringu suurus",
      ],
    };
  }, [
    capacityKwh,
    powerKw,
    investmentEur,
    annualRevenueEur,
    revenueType,
    mode,
    efficiencyPct,
    availabilityPct,
    riskCoefficientPct,
    annualOandMEur,
    lifetimeYears,
  ]);

  const handleCalculate = () => {
    if (!hasRequiredInputs) {
      setValidationMessage("Täida vajalikud väljad enne arvutamist.");
      setHasCalculated(false);
      return;
    }
    setValidationMessage(null);
    setHasCalculated(true);
  };

  const handleReset = () => {
    setCapacityKwh("");
    setPowerKw("");
    setInvestmentEur("");
    setAnnualRevenueEur("");
    setLifetimeYears("");
    setEfficiencyPct("");
    setCyclesPerYear("");
    setDegradationPct("");
    setAnnualOandMEur("");
    setMinimumResidualPct("");
    setRevenueType("annual");
    setArbitrageSpreadEurMwh("");
    setRevenuePerKwYear("");
    setFinancingCostPct("");
    setCalculationPeriodYears("");
    setRiskCoefficientPct("");
    setAvailabilityPct("");
    setValidationMessage(null);
    setHasCalculated(false);
  };

  const sanityWarnings = useMemo(() => {
    const warnings: string[] = [];
    const cap = num(capacityKwh);
    const pwr = num(powerKw);
    const annual = model.grossRevenueYear;
    if (cap > 0 && (cap < 10 || cap > 1000)) {
      warnings.push("Aku maht tundub ebarealistlik. Kontrolli, et sisestasid väärtuse kWh ühikus.");
    }
    if (pwr > 0 && (pwr < 3 || pwr > 500)) {
      warnings.push("Aku võimsus tundub ebarealistlik. Kontrolli, et sisestasid väärtuse kW ühikus.");
    }
    if (cap > 0 && annual / cap > 250) {
      warnings.push("Aastane tulueeldus on väga optimistlik võrreldes aku mahuga. Kontrolli konservatiivset stsenaariumi.");
    }
    if ((model.perScenario[1]?.netRevYear1 ?? 0) <= 0) {
      warnings.push("Baasstsenaariumis on netotulu null või negatiivne - tasuvusaega ei saa usaldusväärselt hinnata.");
    }
    return warnings;
  }, [capacityKwh, powerKw, model.grossRevenueYear, model.perScenario]);

  const downloadPdf = async () => {
    if (!projectId) return;
    const out = await clientDownloadPdf(projectId, unlock, {
      calculatorType: "vpp",
      summary:
        "VPP raport koondab sisestatud akuparameetrid, tulueeldused ja riskikordajad, et hinnata tasuvust.",
      analysisBasis: mode === "advanced" ? "advanced" : "defaults",
      inputs: [
        {
          group: "Aku ja investeering",
          items: [
            { label: "Aku maht", value: capacityKwh ? `${capacityKwh} kWh` : "—" },
            { label: "Aku võimsus", value: powerKw ? `${powerKw} kW` : "—" },
            { label: "Investeering", value: investmentEur ? `${investmentEur} €` : "—" },
          ],
        },
        {
          group: "Tulud ja eluiga",
          items: [
            { label: "Tulu tüüp", value: revenueType },
            { label: "Aastane brutotulu", value: fmtEur(model.grossRevenueYear) },
            { label: "Eluiga", value: `${lifetimeYears} a` },
            { label: "Efektiivsus", value: `${efficiencyPct}%` },
          ],
        },
        {
          group: "Kulud ja eeldused",
          items: [
            { label: "Hooldus (€/a)", value: annualOandMEur ? `${annualOandMEur} €` : "—" },
            { label: "Tsüklid aastas", value: `${cyclesPerYear || "—"}` },
            { label: "Riskikoefitsient", value: `${riskCoefficientPct}%` },
            { label: "Kättesaadavus", value: `${availabilityPct}%` },
          ],
        },
      ],
      assumptions: [
        {
          label: "Märkus",
          value: "VPP tulu sõltub turulepääsust, lepingutingimustest, aku kasutusest ja hinnakõikumisest.",
        },
      ],
      formulas: [
        {
          label: "Arvutuse metoodika",
          value:
            "Analüüs põhineb kasutaja sisestatud andmetel, valitud eeldustel ja süsteemis kasutataval arvutusmudelil. Tulemused on hinnangulised ning sõltuvad sisendandmete täpsusest.",
        },
      ],
      risksAndLimits: [
        { label: "Tururisk", value: "Börsihinna kõikumine ja turulepääsu tingimused mõjutavad tulu tugevalt." },
        { label: "Tehniline risk", value: "Aku degradatsioon ja kättesaadavus võivad vähendada realiseeruvat tulu." },
        { label: "Lepingurisk", value: "Lepingutingimused ja teenustasud võivad muuta netotulemust." },
      ],
      disclaimer:
        "Tegu on informatiivse mudeliga. Tegelik VPP tulu sõltub turust, lepingutest ja tehnilisest kasutusest.",
      metrics: [
        { label: "Aastane brutotulu", value: fmtEur(model.perScenario[1]?.grossRevenueYear ?? 0) },
        { label: "Baas: netotulu (aasta 1)", value: fmtEur(model.perScenario[1]?.netRevYear1 ?? 0) },
        {
          label: "Baas: tasuvusaeg",
          value:
            model.perScenario[1]?.paybackYears !== null ? `${model.perScenario[1].paybackYears.toFixed(1)} a` : "—",
        },
        { label: "Baas: kogukasum", value: fmtEur(model.perScenario[1]?.totalProfit ?? 0) },
        { label: "Peamine riskitegur", value: model.mainRiskFactor },
        { label: "Arvutusperiood", value: `${calculationPeriodYears} a` },
      ],
      charts: {
        cashflowByYear: model.perScenario[1]?.cashflows ?? [],
      },
    }, "energiakalkulaator-vpp-analuus.pdf");
    if (!out.ok) setMessage(out.error);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {message ? (
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>{message}</p>
            <button type="button" className="btn-ghost" onClick={() => setMessage(null)}>
              Peida
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn-ghost" onClick={checkPaymentStatus}>
              Kontrolli ligipääsu staatust
            </button>
          </div>
        </div>
      ) : null}

      <section className="glass-panel rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-zinc-50">VPP tasuvusmudel</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Lihtne hinnang aku osalemisele paindlikkuse teenustes. Sisesta eeldused ja vaata, mis suurusjärgus
          võiks tulemus olla.
        </p>
        <div className="mt-4 inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              mode === "quick" ? "bg-emerald-400/20 text-emerald-100" : "text-zinc-300"
            }`}
            onClick={() => setMode("quick")}
          >
            Kiire hinnang
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              mode === "advanced" ? "bg-emerald-400/20 text-emerald-100" : "text-zinc-300"
            }`}
            onClick={() => setMode("advanced")}
          >
            Täpsem arvutus
          </button>
        </div>

        <h3 className="mt-6 text-xl font-semibold text-zinc-50">Sisendid</h3>
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-300">
          <p className="font-medium text-zinc-100">Kust andmed leida?</p>
          <p className="mt-2">
            Kui sul ei ole kõiki andmeid kohe käepärast, alusta hinnanguga. Täpsemad sisendid annavad täpsema
            tulemuse.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-400">
            <li>Aku maht ja võimsus: aku/inverteri andmeleht või paigaldaja pakkumine.</li>
            <li>Investeering: aku, inverteri, paigalduse ja liitumise kogukulu.</li>
            <li>Tulupotentsiaal: agregaatori või teenusepakkuja hinnang, vajadusel konservatiivne eeldus.</li>
            <li>Kui täpset numbrit ei tea, sisesta realistlik vahemik ja võrdle mitut stsenaariumi.</li>
          </ul>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="field-label">
            <span className="field-label-text">Aku maht (kWh)</span>
            <input
              className="input"
              value={capacityKwh}
              inputMode="decimal"
              onChange={(e) => setCapacityKwh(e.target.value)}
              placeholder="nt 100"
            />
            <span className="field-hint">Leiad aku tehnilisest pakkumisest või seadme andmelehelt. See näitab, kui palju energiat aku mahutab.</span>
          </label>
          <label className="field-label">
            <span className="field-label-text">Aku võimsus (kW)</span>
            <input
              className="input"
              value={powerKw}
              inputMode="decimal"
              onChange={(e) => setPowerKw(e.target.value)}
              placeholder="nt 50"
            />
            <span className="field-hint">Leiad inverteri või aku tehnilistest andmetest. See näitab, kui kiiresti saab akut laadida või tühjendada.</span>
          </label>
          <label className="field-label">
            <span className="field-label-text">Investeering (€)</span>
            <input
              className={`input ${num(investmentEur) <= 0 ? "input-warning" : ""}`}
              value={investmentEur}
              inputMode="numeric"
              onChange={(e) => setInvestmentEur(e.target.value)}
              placeholder="nt 60000"
            />
            <span className="field-hint">Kasuta aku, inverteri, paigalduse ja liitumise kogukulu. Kui täpset pakkumist pole, sisesta ligikaudne eelarve.</span>
          </label>
          <label className="field-label">
            <span className="field-label-text">Aastane tulupotentsiaal (€)</span>
            <input
              className={`input ${num(annualRevenueEur) <= 0 ? "input-warning" : ""}`}
              value={annualRevenueEur}
              inputMode="numeric"
              onChange={(e) => setAnnualRevenueEur(e.target.value)}
              placeholder="nt 12000"
            />
            <span className="field-hint">Kasuta teenusepakkuja, agregaatori või projekti hinnangut. Kui seda pole, sisesta konservatiivne hinnang ja testi mitut stsenaariumi.</span>
          </label>
          <label className="field-label">
            <span className="field-label-text">Aku eluiga (a)</span>
            <select className="input" value={lifetimeYears} onChange={(e) => setLifetimeYears(e.target.value)}>
              <option value="">Vali</option>
              <option value="5">5</option>
              <option value="7">7</option>
              <option value="10">10</option>
              <option value="12">12</option>
              <option value="15">15</option>
            </select>
            <span className="field-hint">Leiad aku tootja andmetest või garantiitingimustest. Sageli hinnatakse eluiga aastates või tsüklite arvuna.</span>
          </label>
          {mode === "advanced" ? (
            <div className="sm:col-span-2 grid gap-3">
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setEfficiencyPct("92");
                    setCyclesPerYear("220");
                    setDegradationPct("2");
                    setAnnualOandMEur("250");
                    setMinimumResidualPct("10");
                    setRevenueType("annual");
                    setArbitrageSpreadEurMwh("85");
                    setRevenuePerKwYear("180");
                    setFinancingCostPct("6");
                    setCalculationPeriodYears("10");
                    setRiskCoefficientPct("100");
                    setAvailabilityPct("95");
                  }}
                >
                  Taasta vaikimisi
                </button>
              </div>
              <AdvancedInputAccordion title="1) Põhiandmed" defaultOpen>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="field-label">
                    <span className="field-label-text">Tulu tüüp</span>
                    <select className="input" value={revenueType} onChange={(e) => setRevenueType(e.target.value as RevenueType)}>
                      <option value="annual">Kasutaja sisestatud aastane tulu</option>
                      <option value="arbitrage">Arbitraaž spread (€/MWh)</option>
                      <option value="per_kw_year">Tulu €/kW/aastas</option>
                    </select>
                    <span className="field-hint">Vali, mille alusel brutotulu arvutatakse.</span>
                  </label>
                  {revenueType === "arbitrage" ? (
                    <label className="field-label">
                      <span className="field-label-text">Arbitraaž spread (€/MWh)</span>
                      <input
                        className="input"
                        value={arbitrageSpreadEurMwh}
                        inputMode="decimal"
                        onChange={(e) => setArbitrageSpreadEurMwh(e.target.value)}
                        placeholder="nt 85"
                      />
                      <span className="field-hint">Keskmine hinnaerinevus laadimise/tühjenduse vahel.</span>
                    </label>
                  ) : null}
                  {revenueType === "per_kw_year" ? (
                    <label className="field-label">
                      <span className="field-label-text">Tulu (€/kW/aastas)</span>
                      <input
                        className="input"
                        value={revenuePerKwYear}
                        inputMode="decimal"
                        onChange={(e) => setRevenuePerKwYear(e.target.value)}
                        placeholder="nt 180"
                      />
                      <span className="field-hint">Lepinguline tulu võimsusühiku kohta aastas.</span>
                    </label>
                  ) : null}
                </div>
              </AdvancedInputAccordion>
              <AdvancedInputAccordion title="2) Hinnad ja kulud" defaultOpen>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="field-label">
                    <span className="field-label-text">Hoolduskulu (€/a)</span>
                    <input className="input" value={annualOandMEur} inputMode="numeric" onChange={(e) => setAnnualOandMEur(e.target.value)} placeholder="nt 250" />
                    <span className="field-hint">Aastane püsikulu, mis vähendab netotulu.</span>
                  </label>
                  <label className="field-label">
                    <span className="field-label-text">Finantseerimiskulu (%)</span>
                    <input className="input" value={financingCostPct} inputMode="decimal" onChange={(e) => setFinancingCostPct(e.target.value)} placeholder="nt 6" />
                    <span className="field-hint">Kapitali hind aastases arvestuses.</span>
                  </label>
                  <label className="field-label">
                    <span className="field-label-text">Minimaalne jääkväärtus (%)</span>
                    <input className="input" value={minimumResidualPct} inputMode="decimal" onChange={(e) => setMinimumResidualPct(e.target.value)} placeholder="nt 10" />
                    <span className="field-hint">Eeldatav väärtus perioodi lõpus investeeringust.</span>
                  </label>
                </div>
              </AdvancedInputAccordion>
              <AdvancedInputAccordion title="3) Tehnilised eeldused" defaultOpen>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="field-label">
                    <span className="field-label-text">Efektiivsus (%)</span>
                    <input className={`input ${num(efficiencyPct) < 70 ? "input-warning" : ""}`} value={efficiencyPct} inputMode="decimal" onChange={(e) => setEfficiencyPct(e.target.value)} placeholder="nt 92" />
                    <span className="field-hint">Näitab, kui suur osa salvestatud energiast jõuab hiljem kasutusse tagasi. Kui ei tea, kasuta ligikaudset väärtust.</span>
                  </label>
                  <label className="field-label">
                    <span className="field-label-text">Tsüklite arv aastas</span>
                    <input className="input" value={cyclesPerYear} inputMode="numeric" onChange={(e) => setCyclesPerYear(e.target.value)} placeholder="nt 220" />
                    <span className="field-hint">Kui sageli aku aktiivselt turul osaleb.</span>
                  </label>
                  <label className="field-label">
                    <span className="field-label-text">Aku degradatsioon (%/a)</span>
                    <input className="input" value={degradationPct} inputMode="decimal" onChange={(e) => setDegradationPct(e.target.value)} placeholder="nt 2" />
                    <span className="field-hint">Tootlikkuse vähenemine aastate jooksul.</span>
                  </label>
                </div>
              </AdvancedInputAccordion>
              <AdvancedInputAccordion title="4) Täpsemad seaded" defaultOpen>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="field-label">
                    <span className="field-label-text">Arvutusperiood (a)</span>
                    <input className="input" value={calculationPeriodYears} inputMode="numeric" onChange={(e) => setCalculationPeriodYears(e.target.value)} placeholder="nt 10" />
                    <span className="field-hint">Mitu aastat detailset rahavoogu hinnatakse.</span>
                  </label>
                  <label className="field-label">
                    <span className="field-label-text">Riskikoefitsient (%)</span>
                    <input className="input" value={riskCoefficientPct} inputMode="decimal" onChange={(e) => setRiskCoefficientPct(e.target.value)} placeholder="nt 90" />
                    <span className="field-hint">Kasuta seda ebakindluse arvestamiseks. Suurem riskikorrektuur teeb tulemuse ettevaatlikumaks.</span>
                  </label>
                  <label className="field-label">
                    <span className="field-label-text">Kättesaadavus (%)</span>
                    <input className="input" value={availabilityPct} inputMode="decimal" onChange={(e) => setAvailabilityPct(e.target.value)} placeholder="nt 95" />
                    <span className="field-hint">Näitab, kui suure osa ajast on aku teenuse pakkumiseks valmis. Kui ei tea, kasuta konservatiivset hinnangut.</span>
                  </label>
                </div>
              </AdvancedInputAccordion>
            </div>
          ) : null}
        </div>

        <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-zinc-200">
          <strong className="block text-zinc-50">Märkus</strong>
          <p className="mt-1 text-zinc-300">
            VPP tulu sõltub turulepääsust, lepingutingimustest, aku kasutusest ja hinnakõikumisest.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-glow w-full sm:w-auto" onClick={handleCalculate}>
            Arvuta tulemus
          </button>
          <button type="button" className="btn-ghost w-full sm:w-auto" onClick={handleReset}>
            Lähtesta
          </button>
        </div>
        {validationMessage ? (
          <p className="mt-3 rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
            {validationMessage}
          </p>
        ) : null}
      </section>

      <PaywallCard
        locked={!canViewFullAnalysis(unlock)}
        title={FEATURES.paywallEnabled ? "Detailne vaade" : "Detailne analüüs"}
        description="avab VPP detailse simulatsiooni (stsenaariumid, risk, cashflow tabel, eksport) selle projekti jaoks."
        ctaLabel={purchaseBusy === "full_analysis" ? "Laen..." : "Ava detailne vaade"}
        secondaryLabel="Kontrolli ligipääsu staatust"
        onCta={() => startCheckout("full_analysis", { returnSlug: "vpp" })}
        onSecondary={checkPaymentStatus}
        footer={
          <>
            Projekt: <span className="font-medium text-zinc-200">{projectId}</span>
          </>
        }
      >
        <h2 className="text-2xl font-semibold text-zinc-50">Tulemused</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Mida see tähendab? Vaata esmalt baastsenaariumi netotulu ja tasuvusaega, seejärel võrdle konservatiivset
          ning optimistlikku vaadet.
        </p>
        {!hasCalculated ? (
          <div className="mt-4 rounded-2xl border border-white/12 bg-white/[0.03] p-4 text-sm text-zinc-300">
            <p className="font-medium text-zinc-100">Sisesta andmed ja vajuta "Arvuta tulemus".</p>
          </div>
        ) : null}
        {hasCalculated && sanityWarnings.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4 text-sm text-amber-100">
            <p className="font-medium">Kontrolli sisendeid enne otsust</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {sanityWarnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {hasCalculated && hasRequiredInputs ? (
          <>
        <div className="mt-5 rounded-2xl border border-emerald-300/30 bg-emerald-400/15 p-5 shadow-[0_0_30px_rgba(20,184,166,0.12)]">
          <p className="text-xs uppercase tracking-wide text-emerald-100/80">Peamine tulemus</p>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <strong className="text-4xl font-semibold text-emerald-100 sm:text-5xl">
              {Math.round(model.perScenario[1]?.netRevYear1 ?? 0).toLocaleString("et-EE")}
            </strong>
            <span className="pb-1 text-base text-emerald-50/90 sm:text-lg">EUR/a</span>
          </div>
          <p className="mt-2 text-sm text-emerald-50/90">Selle sisendi põhjal on baastsenaariumi netotulu selles suurusjärgus.</p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="metric-card metric-card-primary metric-card-accent-emerald">
            <p className="metric-label">Olulisim: aastane netotulu (baas)</p>
            <div className="metric-main">
              <strong className="metric-value">
                {Math.round(model.perScenario[1]?.netRevYear1 ?? 0).toLocaleString("et-EE")}
              </strong>
              <span className="metric-unit">EUR/a</span>
            </div>
            <p className="metric-help">Aastane brutotulu pärast eelduste arvestamist ja hoolduskulu mahaarvamist.</p>
          </div>
          <div className="metric-card metric-card-accent-teal">
            <p className="metric-label">Aastane brutotulu (baas)</p>
            <div className="metric-main">
              <strong className="metric-value">
                {Math.round(model.perScenario[1]?.grossRevenueYear ?? 0).toLocaleString("et-EE")}
              </strong>
              <span className="metric-unit">EUR/a</span>
            </div>
            <p className="metric-help">Tulupõhine lähteväärtus enne kulusid ja riskikorrektuuri.</p>
          </div>
          <div className="metric-card metric-card-accent-teal">
            <p className="metric-label">Baas: tasuvusaeg</p>
            <div className="metric-main">
              <strong className="metric-value">
                {model.perScenario[1]?.paybackYears !== null ? model.perScenario[1].paybackYears.toFixed(1) : "—"}
              </strong>
              {model.perScenario[1]?.paybackYears !== null ? <span className="metric-unit">aastat</span> : null}
            </div>
            <p className="metric-help">Mitu aastat kulub investeeringu tagasi teenimiseks.</p>
          </div>
          <div className="metric-card metric-card-accent-emerald">
            <p className="metric-label">Baas: kogukasum (eluiga)</p>
            <div className="metric-main">
              <strong className="metric-value">
                {Math.round(model.perScenario[1]?.totalProfit ?? 0).toLocaleString("et-EE")}
              </strong>
              <span className="metric-unit">EUR</span>
            </div>
            <p className="metric-help">Kogukasum kogu valitud eluaja jooksul.</p>
          </div>
        </div>
        {model.perScenario[1]?.paybackYears === null ? (
          <p className="mt-3 text-sm text-amber-200">
            Tasuvusaega ei saa arvutada, sest baastsenaariumi netotulu on null või negatiivne.
          </p>
        ) : null}

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-300">
          <p className="font-medium text-zinc-100">Märkused</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Brutotulu arvutus sõltub valitud tulu tüübist (aastane, arbitraaž või €/kW/a).</li>
            <li>Netotulu arvestab kättesaadavust, riskikordajat, hoolduskulu ja finantseerimiskulu.</li>
            <li>Vaata kolme stsenaariumi ja vali konservatiivne eeldus, kui tulemus läheb otsuse aluseks.</li>
          </ul>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="card">
            <h3 className="section-title">Stsenaariumid</h3>
            <div className="grid gap-3 text-sm">
              {model.perScenario.map((s) => (
                <div key={s.key} className="compare-row">
                  <span className="compare-label">{s.label}</span>
                  <strong>
                    {s.paybackYears !== null ? `${s.paybackYears.toFixed(1)} a` : "—"} · Kogukasum {fmtEur(s.totalProfit)}
                  </strong>
                </div>
              ))}
            </div>
          </article>
          <article className="card">
            <h3 className="section-title">Baasstsenaariumi kokkuvõte</h3>
            <div className="grid gap-2 text-sm">
              <div className="compare-row">
                <span className="compare-label">Keskmine aastane rahavoog</span>
                <strong>{fmtEur(averageCashflowEur(model.perScenario[1]?.cashflows))}</strong>
              </div>
              <div className="compare-row">
                <span className="compare-label">Tasuvusaeg</span>
                <strong>{model.perScenario[1]?.paybackYears !== null ? `${model.perScenario[1].paybackYears.toFixed(1)} a` : "—"}</strong>
              </div>
              <div className="compare-row">
                <span className="compare-label">Kogukasum (eluiga)</span>
                <strong>{fmtEur(model.perScenario[1]?.totalProfit ?? 0)}</strong>
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-400">
              Kompaktne vaade peamiste otsusenäitajatega ilma mini-graafikuta.
            </p>
          </article>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="card">
            <h3 className="section-title">Tundlikkus (tulu ±20%)</h3>
            {(() => {
              const low = model.perScenario[0]?.paybackYears ?? null;
              const base = model.perScenario[1]?.paybackYears ?? null;
              const high = model.perScenario[2]?.paybackYears ?? null;
              return (
                <div className="grid gap-3 text-sm">
                  <div className="compare-row">
                    <span className="compare-label">Konservatiivne (70%)</span>
                    <strong>{low !== null ? `${low.toFixed(1)} a` : "—"}</strong>
                  </div>
                  <div className="compare-row">
                    <span className="compare-label">Baas</span>
                    <strong>{base !== null ? `${base.toFixed(1)} a` : "—"}</strong>
                  </div>
                  <div className="compare-row">
                    <span className="compare-label">Optimistlik (130%)</span>
                    <strong>{high !== null ? `${high.toFixed(1)} a` : "—"}</strong>
                  </div>
                </div>
              );
            })()}
            <p className="mt-3 text-xs text-zinc-400">Peamine riskitegur: {model.mainRiskFactor}.</p>
          </article>

          <article className="card">
            <h3 className="section-title">Soovitused</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-300">
              <li>Testi vähemalt 3 stsenaariumi: madal / baas / kõrge tulu.</li>
              <li>Kui eesmärk on stabiilsus, kasuta konservatiivset tulueeldust ja jäta varu hoolduseks.</li>
              <li>Kui tasuvus on pikk, vaata üle investeering või realistlik tulu.</li>
            </ul>
          </article>
        </div>
        <ChartCard
          title="Rahavoog (baas)"
          description="Aastapõhine rahavoog valitud perioodil (tekstilise loendina)."
          chartClassName="min-h-[220px]"
        >
          {(() => {
            const cashflows = model.perScenario[1]?.cashflows ?? [];
            if (!cashflows.length) {
              return <p className="text-sm text-zinc-400">Rahavoogude andmed puuduvad.</p>;
            }
            const marks = [0, Math.floor((cashflows.length - 1) / 2), cashflows.length - 1]
              .filter((idx, pos, arr) => arr.indexOf(idx) === pos);
            return (
              <div className="grid gap-2 text-sm">
                {marks.map((idx) => (
                  <div key={idx} className="compare-row">
                    <span className="compare-label">{formatYearLabel(idx)}</span>
                    <strong>{fmtEur(cashflows[idx] ?? 0)}</strong>
                  </div>
                ))}
                <p className="mt-2 text-xs text-zinc-400">
                  Näitame esimest, keskmist ja viimast aastat, et trend oleks loetav ka mobiilis.
                </p>
              </div>
            );
          })()}
        </ChartCard>
        <UsedAssumptionsBlock {...assumptionsInfo} />

        <CalculatorPdfActions
          projectId={projectId}
          unlock={unlock}
          purchaseBusy={purchaseBusy}
          startCheckout={startCheckout}
          checkPaymentStatus={checkPaymentStatus}
          onDownload={downloadPdf}
          returnSlug="vpp"
        />
          </>
        ) : (
          <p className="mt-3 text-sm text-zinc-400">
            Sisesta vajalikud andmed ja vajuta "Arvuta tulemus", et näha tulemusi.
          </p>
        )}
      </PaywallCard>
    </div>
  );
}

