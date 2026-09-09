import { PDFDocument, StandardFonts, rgb, type PDFPage, type RGB } from "pdf-lib";
import { A4, pdfTheme } from "@/lib/pdf/theme";
import { drawDivider, drawPanel, drawText, formatDateEt, type Box, type PdfFonts } from "@/lib/pdf/layout";
import type { IndustrialResult } from "@/lib/calculators/industrial";
import type { IndustrialScenarioComparison } from "@/lib/calculators/industrial-scenarios";
import type { IndustrialTimeseriesResult } from "@/lib/calculators/industrial-timeseries";

function pdfSafe(text: string): string {
  return text
    .replaceAll("õ", "o")
    .replaceAll("Õ", "O")
    .replaceAll("ä", "a")
    .replaceAll("Ä", "A")
    .replaceAll("ö", "o")
    .replaceAll("Ö", "O")
    .replaceAll("ü", "u")
    .replaceAll("Ü", "U")
    .replaceAll("š", "s")
    .replaceAll("Š", "S")
    .replaceAll("ž", "z")
    .replaceAll("Ž", "Z")
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replaceAll("\u202f", " ")
    .replaceAll("\u00a0", " ")
    .replaceAll("→", "->")
    .replaceAll("←", "<-")
    .replaceAll("•", "-")
    .replaceAll("€", "EUR")
    .replaceAll("×", "x")
    .replaceAll("−", "-")
    .replaceAll("…", "...");
}

function write(page: PDFPage, content: string, opts: Parameters<typeof drawText>[2]) {
  return drawText(page, pdfSafe(content), opts);
}

const ink = rgb(0.12, 0.14, 0.16);
const muted = rgb(0.38, 0.42, 0.46);
const panel = rgb(0.97, 0.975, 0.98);
const slate = rgb(0.45, 0.5, 0.56);
const sky = rgb(0.28, 0.45, 0.62);
const amber = rgb(0.72, 0.55, 0.18);
const highlight = rgb(0.22, 0.38, 0.52);

export type IndustrialPdfInput = {
  companyName: string;
  generatedAt?: Date;
  result: IndustrialResult;
  recommendationHeadline: string;
  recommendationBody: string;
  inputs: Array<{ label: string; value: string }>;
  assumptions: string[];
  limitations: string[];
  scenarioComparison: IndustrialScenarioComparison | null;
  timeseries: IndustrialTimeseriesResult | null;
  priceModeLabel: string;
};

function money(value: number, digits = 0): string {
  return `${new Intl.NumberFormat("et-EE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0)} EUR`;
}

function num(value: number, digits: number, suffix = ""): string {
  return `${new Intl.NumberFormat("et-EE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0)}${suffix}`;
}

function drawBrandHeader(page: PDFPage, fonts: PdfFonts, title: string, date: string, pageNumber: number, pageCount: number) {
  page.drawRectangle({
    x: 0,
    y: A4.height - 64,
    width: A4.width,
    height: 64,
    color: rgb(0.09, 0.11, 0.14),
  });
  write(page, "ENERGIAKALKULAATOR.EE", {
    x: pdfTheme.margin,
    y: A4.height - 28,
    size: 9,
    font: fonts.bold,
    color: rgb(0.85, 0.88, 0.9),
  });
  write(page, title, {
    x: pdfTheme.margin,
    y: A4.height - 48,
    size: 16,
    font: fonts.bold,
    color: rgb(0.98, 0.98, 0.99),
  });
  write(page, date, {
    x: 400,
    y: A4.height - 28,
    size: 9,
    font: fonts.regular,
    color: rgb(0.72, 0.76, 0.8),
  });
  write(page, `${pageNumber} / ${pageCount}`, {
    x: 520,
    y: A4.height - 48,
    size: 9,
    font: fonts.regular,
    color: rgb(0.72, 0.76, 0.8),
  });
}

function drawReportFooter(page: PDFPage, fonts: PdfFonts) {
  drawDivider(page, pdfTheme.margin, 48, A4.width - pdfTheme.margin * 2);
  write(page, "Energiakalkulaator.ee  ·  Kenneth Alto  ·  kennethalto95@gmail.com  ·  Kontakt", {
    x: pdfTheme.margin,
    y: 32,
    size: 8,
    font: fonts.regular,
    color: muted,
    maxWidth: A4.width - pdfTheme.margin * 2,
    maxLines: 1,
  });
  write(page, "Informatiivne hinnang. Ei ole investeerimis-, finants- ega tehniline nouanne.", {
    x: pdfTheme.margin,
    y: 20,
    size: 7.5,
    font: fonts.regular,
    color: muted,
    maxWidth: A4.width - pdfTheme.margin * 2,
    maxLines: 1,
  });
}

function kpiBox(page: PDFPage, fonts: PdfFonts, box: Box, label: string, value: string) {
  drawPanel(page, box, panel);
  write(page, label, {
    x: box.x + 10,
    y: box.y + box.h - 18,
    size: 8,
    font: fonts.regular,
    color: muted,
    maxWidth: box.w - 20,
    maxLines: 2,
  });
  write(page, value, {
    x: box.x + 10,
    y: box.y + 16,
    size: 13,
    font: fonts.bold,
    color: ink,
    maxWidth: box.w - 20,
    maxLines: 1,
  });
}

function stackedBar(
  page: PDFPage,
  box: Box,
  segments: Array<{ value: number; color: RGB }>,
) {
  const total = segments.reduce((sum, s) => sum + Math.max(s.value, 0), 0);
  let x = box.x;
  page.drawRectangle({
    x: box.x,
    y: box.y,
    width: box.w,
    height: box.h,
    color: rgb(0.93, 0.94, 0.95),
  });
  if (total <= 0) return;
  for (const seg of segments) {
    const w = (Math.max(seg.value, 0) / total) * box.w;
    if (w <= 0) continue;
    page.drawRectangle({ x, y: box.y, width: w, height: box.h, color: seg.color });
    x += w;
  }
}

function bars(
  page: PDFPage,
  fonts: PdfFonts,
  box: Box,
  items: Array<{ label: string; value: number; color: RGB }>,
) {
  const max = Math.max(...items.map((i) => Math.abs(i.value)), 1);
  const barW = (box.w - 12 * (items.length - 1)) / items.length;
  items.forEach((item, index) => {
    const h = (Math.abs(item.value) / max) * (box.h - 28);
    const x = box.x + index * (barW + 12);
    page.drawRectangle({
      x,
      y: box.y + 18,
      width: barW,
      height: Math.max(h, 1),
      color: item.color,
    });
    write(page, item.label, {
      x,
      y: box.y + 4,
      size: 7,
      font: fonts.regular,
      color: muted,
      maxWidth: barW,
      maxLines: 1,
    });
  });
}

export async function generateIndustrialReport(input: IndustrialPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const fonts: PdfFonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  };
  const date = formatDateEt(input.generatedAt ?? new Date());
  const company = input.companyName.trim() || "Nimetu profiil";
  const hasTimeseries = Boolean(input.timeseries);
  const pageCount = hasTimeseries ? 5 : 4;
  const { result, scenarioComparison } = input;

  {
    const page = pdf.addPage([A4.width, A4.height]);
    drawBrandHeader(page, fonts, "Toostuslik PV + aku analuus", date, 1, pageCount);
    write(page, company, {
      x: pdfTheme.margin,
      y: 742,
      size: 18,
      font: fonts.bold,
      color: ink,
      maxWidth: A4.width - pdfTheme.margin * 2,
      maxLines: 1,
    });
    write(page, "Esialgne energiaanaluus tarbimisprofiili, PV ja aku eelduste pohjal.", {
      x: pdfTheme.margin,
      y: 722,
      size: 10,
      font: fonts.regular,
      color: muted,
      maxWidth: A4.width - pdfTheme.margin * 2,
      maxLines: 2,
    });

    const kpiW = (A4.width - pdfTheme.margin * 2 - 24) / 4;
    const kpis = [
      ["Aastane kogumoju", money(result.annualSavingsEur) + "/a"],
      ["Omatarve", `${num(result.selfConsumptionSharePercent, 0)}%`],
      ["Tipukoormus", `${num(result.peakLoadBeforeKw, 0)} → ${num(result.peakLoadAfterKw, 0)} kW`],
      ["Tasuvusaeg", result.paybackYears != null ? `${num(result.paybackYears, 1)} a` : "Ei arvutata"],
    ] as const;
    kpis.forEach((item, i) => {
      kpiBox(page, fonts, { x: pdfTheme.margin + i * (kpiW + 8), y: 612, w: kpiW, h: 78 }, item[0], item[1]);
    });

    drawPanel(page, { x: pdfTheme.margin, y: 488, w: A4.width - pdfTheme.margin * 2, h: 108 }, rgb(0.94, 0.96, 0.97));
    write(page, "Soovitus", {
      x: pdfTheme.margin + 14,
      y: 572,
      size: 11,
      font: fonts.bold,
      color: ink,
    });
    write(page, input.recommendationHeadline, {
      x: pdfTheme.margin + 14,
      y: 554,
      size: 11,
      font: fonts.bold,
      color: highlight,
      maxWidth: A4.width - pdfTheme.margin * 2 - 28,
      maxLines: 2,
    });
    write(page, input.recommendationBody, {
      x: pdfTheme.margin + 14,
      y: 530,
      size: 9,
      font: fonts.regular,
      color: muted,
      maxWidth: A4.width - pdfTheme.margin * 2 - 28,
      lineHeight: 12,
      maxLines: 4,
    });

    write(page, "Pohitulemused", {
      x: pdfTheme.margin,
      y: 462,
      size: 12,
      font: fonts.bold,
      color: ink,
    });
    const metricRows = [
      ["PV toodang", `${num(result.pvProductionMwh, 1)} MWh`],
      ["Kohapeal kasutatud PV", `${num(result.selfConsumedPvMwh, 1)} MWh`],
      ["Vorgu muuk", `${num(result.exportedPvMwh, 1)} MWh`],
      ["Omatarbe saast", money(result.selfConsumptionSavingsEur)],
      ["Vorgu muugi tulu", money(result.exportRevenueEur)],
      ["Voimsustasu saast", money(result.demandChargeSavingsEur)],
      ["Investeering", money(result.investmentEur)],
      ["Aku moju omatarbele", `${num(result.batterySelfConsumptionImpactMwh, 1)} MWh`],
    ];
    metricRows.forEach((row, i) => {
      const col = i % 2;
      const rowI = Math.floor(i / 2);
      const x = pdfTheme.margin + col * 255;
      const y = 432 - rowI * 22;
      write(page, row[0], { x, y, size: 9, font: fonts.regular, color: muted, maxWidth: 140, maxLines: 1 });
      write(page, row[1], { x: x + 148, y, size: 9, font: fonts.bold, color: ink, maxWidth: 96, maxLines: 1 });
    });

    write(page, result.summary, {
      x: pdfTheme.margin,
      y: 318,
      size: 9,
      font: fonts.regular,
      color: muted,
      maxWidth: A4.width - pdfTheme.margin * 2,
      lineHeight: 12,
      maxLines: 5,
    });

    write(page, "Energiavoog ja tipukoormus", {
      x: pdfTheme.margin,
      y: 248,
      size: 12,
      font: fonts.bold,
      color: ink,
    });
    stackedBar(page, { x: pdfTheme.margin, y: 208, w: A4.width - pdfTheme.margin * 2, h: 18 }, [
      { value: Math.max(result.selfConsumedPvMwh - result.batterySelfConsumptionImpactMwh, 0), color: slate },
      { value: result.batterySelfConsumptionImpactMwh, color: amber },
      { value: result.exportedPvMwh, color: sky },
    ]);
    write(page, `Otsene omatarve ${num(Math.max(result.selfConsumedPvMwh - result.batterySelfConsumptionImpactMwh, 0), 1)} MWh   ·   Aku ${num(result.batterySelfConsumptionImpactMwh, 1)} MWh   ·   Vorgu ${num(result.exportedPvMwh, 1)} MWh`, {
      x: pdfTheme.margin,
      y: 190,
      size: 8,
      font: fonts.regular,
      color: muted,
      maxWidth: A4.width - pdfTheme.margin * 2,
      maxLines: 1,
    });
    bars(page, fonts, { x: pdfTheme.margin, y: 78, w: 240, h: 96 }, [
      { label: "Enne", value: result.peakLoadBeforeKw, color: slate },
      { label: "Parast", value: result.peakLoadAfterKw, color: highlight },
    ]);
    bars(page, fonts, { x: 310, y: 78, w: 240, h: 96 }, [
      { label: "Omatarve", value: result.selfConsumptionSavingsEur, color: slate },
      { label: "Muuk", value: result.exportRevenueEur, color: sky },
      { label: "Voimsustasu", value: result.demandChargeSavingsEur, color: amber },
    ]);
    write(page, "Tipukoormus (kW)", { x: pdfTheme.margin, y: 176, size: 9, font: fonts.bold, color: ink });
    write(page, "Rahaline moju (EUR/a)", { x: 310, y: 176, size: 9, font: fonts.bold, color: ink });
    drawReportFooter(page, fonts);
  }

  {
    const page = pdf.addPage([A4.width, A4.height]);
    drawBrandHeader(page, fonts, "Sisendandmed ja eeldused", date, 2, pageCount);
    write(page, `Profiil: ${company}`, {
      x: pdfTheme.margin,
      y: 742,
      size: 11,
      font: fonts.bold,
      color: ink,
    });
    write(page, `Hinnareziim: ${input.priceModeLabel}`, {
      x: pdfTheme.margin,
      y: 724,
      size: 9,
      font: fonts.regular,
      color: muted,
    });

    const colW = (A4.width - pdfTheme.margin * 2 - 16) / 2;
    input.inputs.forEach((row, i) => {
      const col = i % 2;
      const rowI = Math.floor(i / 2);
      const x = pdfTheme.margin + col * (colW + 16);
      const y = 696 - rowI * 20;
      write(page, row.label, { x, y, size: 8.5, font: fonts.regular, color: muted, maxWidth: colW * 0.55, maxLines: 1 });
      write(page, row.value, { x: x + colW * 0.55, y, size: 8.5, font: fonts.bold, color: ink, maxWidth: colW * 0.42, maxLines: 1 });
    });

    write(page, "Mudeli eeldused", {
      x: pdfTheme.margin,
      y: 430,
      size: 12,
      font: fonts.bold,
      color: ink,
    });
    input.assumptions.slice(0, 10).forEach((item, i) => {
      write(page, `• ${item}`, {
        x: pdfTheme.margin,
        y: 408 - i * 16,
        size: 8.5,
        font: fonts.regular,
        color: muted,
        maxWidth: A4.width - pdfTheme.margin * 2,
        maxLines: 1,
      });
    });
    drawReportFooter(page, fonts);
  }

  {
    const page = pdf.addPage([A4.width, A4.height]);
    drawBrandHeader(page, fonts, "Stsenaariumite vordlus", date, 3, pageCount);
    if (!scenarioComparison) {
      write(page, "Stsenaariumite vordlus pole selle sisendi jaoks saadaval.", {
        x: pdfTheme.margin,
        y: 740,
        size: 10,
        font: fonts.regular,
        color: muted,
      });
    } else {
      const rows = [
        ["Stsenaarium", "Investeering", "Kogumoju", "Tasuvus", "Tipp parast"],
        ...scenarioComparison.scenarios.map((s) => [
          s.label,
          money(s.investmentEur),
          money(s.annualSavingsEur) + "/a",
          s.paybackYears != null ? `${num(s.paybackYears, 1)} a` : "—",
          `${num(s.peakLoadAfterKw, 0)} kW`,
        ]),
      ];
      const widths = [150, 90, 100, 80, 80];
      rows.forEach((cols, r) => {
        let x = pdfTheme.margin;
        const y = 740 - r * 22;
        if (r === 0) {
          page.drawRectangle({
            x: pdfTheme.margin - 4,
            y: y - 6,
            width: A4.width - pdfTheme.margin * 2 + 8,
            height: 20,
            color: rgb(0.93, 0.94, 0.96),
          });
        }
        cols.forEach((cell, c) => {
          write(page, cell, {
            x,
            y,
            size: r === 0 ? 8 : 8.5,
            font: r === 0 || c === 0 ? fonts.bold : fonts.regular,
            color: ink,
            maxWidth: widths[c]! - 6,
            maxLines: 1,
          });
          x += widths[c]!;
        });
      });

      bars(
        page,
        fonts,
        { x: pdfTheme.margin, y: 470, w: A4.width - pdfTheme.margin * 2, h: 140 },
        scenarioComparison.scenarios.map((s) => ({
          label: s.shortLabel,
          value: s.annualSavingsEur,
          color: s.id === scenarioComparison.bestSavingsId ? highlight : sky,
        })),
      );
      write(page, "Aastane kogumoju stsenaariumite lokes", {
        x: pdfTheme.margin,
        y: 622,
        size: 11,
        font: fonts.bold,
        color: ink,
      });
      write(page, scenarioComparison.conclusion.summary, {
        x: pdfTheme.margin,
        y: 430,
        size: 9,
        font: fonts.regular,
        color: muted,
        maxWidth: A4.width - pdfTheme.margin * 2,
        lineHeight: 12,
        maxLines: 6,
      });
    }
    drawReportFooter(page, fonts);
  }

  if (hasTimeseries && input.timeseries) {
    const ts = input.timeseries;
    const page = pdf.addPage([A4.width, A4.height]);
    drawBrandHeader(page, fonts, "Ajapohine simulatsioon", date, 4, pageCount);
    const facts = [
      ["Periood", `${ts.periodStartLabel} → ${ts.periodEndLabel}`],
      ["PV toodang", `${num(ts.pvProductionKwh / 1000, 2)} MWh`],
      ["Otsene omatarve", `${num(ts.directSelfConsumptionKwh / 1000, 2)} MWh`],
      ["Aku kaudu", `${num(ts.batteryDischargedToLoadKwh / 1000, 2)} MWh`],
      ["Vorgu muuk", `${num(ts.gridExportKwh / 1000, 2)} MWh`],
      ["Vorgust ost", `${num(ts.gridImportKwh / 1000, 2)} MWh`],
      ["Perioodi moju", money(ts.economics.periodImpactEur)],
      ["Aastaks skaleeritud", money(ts.economics.annualizedImpactEur) + "/a"],
    ];
    facts.forEach((row, i) => {
      const col = i % 2;
      const rowI = Math.floor(i / 2);
      const x = pdfTheme.margin + col * 255;
      const y = 742 - rowI * 20;
      write(page, row[0], { x, y, size: 9, font: fonts.regular, color: muted, maxWidth: 120, maxLines: 1 });
      write(page, row[1], { x: x + 128, y, size: 9, font: fonts.bold, color: ink, maxWidth: 118, maxLines: 1 });
    });

    const steps = ts.chartSteps;
    if (steps.length > 1) {
      const box: Box = { x: pdfTheme.margin, y: 430, w: A4.width - pdfTheme.margin * 2, h: 160 };
      drawPanel(page, box, panel);
      write(page, "Koormus ja PV (lihtsustatud seeria)", {
        x: box.x + 12,
        y: box.y + box.h - 18,
        size: 9,
        font: fonts.bold,
        color: ink,
      });
      const load = steps.map((s) => (s.durationHours > 0 ? s.consumptionKwh / s.durationHours : s.consumptionKwh));
      const pv = steps.map((s) => (s.durationHours > 0 ? s.pvProductionKwh / s.durationHours : s.pvProductionKwh));
      const soc = steps.map((s) => s.batterySocKwh);
      const maxLoad = Math.max(...load, ...pv, 1);
      const inner = { x: box.x + 16, y: box.y + 16, w: box.w - 32, h: box.h - 40 };
      const poly = (values: number[], max: number, color: RGB) => {
        for (let i = 1; i < values.length; i += 1) {
          const x1 = inner.x + ((i - 1) * inner.w) / (values.length - 1);
          const x2 = inner.x + (i * inner.w) / (values.length - 1);
          const y1 = inner.y + (values[i - 1]! / max) * inner.h;
          const y2 = inner.y + (values[i]! / max) * inner.h;
          page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 1.1, color });
        }
      };
      poly(load, maxLoad, slate);
      poly(pv, maxLoad, sky);
      write(page, "Aku SOC", {
        x: pdfTheme.margin,
        y: 408,
        size: 11,
        font: fonts.bold,
        color: ink,
      });
      const socBox: Box = { x: pdfTheme.margin, y: 250, w: A4.width - pdfTheme.margin * 2, h: 140 };
      drawPanel(page, socBox, panel);
      const socMax = Math.max(ts.usableBatteryCapacityKwh, ...soc, 1);
      const socInner = { x: socBox.x + 16, y: socBox.y + 16, w: socBox.w - 32, h: socBox.h - 28 };
      for (let i = 1; i < soc.length; i += 1) {
        const x1 = socInner.x + ((i - 1) * socInner.w) / (soc.length - 1);
        const x2 = socInner.x + (i * socInner.w) / (soc.length - 1);
        const y1 = socInner.y + (soc[i - 1]! / socMax) * socInner.h;
        const y2 = socInner.y + (soc[i]! / socMax) * socInner.h;
        page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 1.1, color: amber });
      }
    }
    drawReportFooter(page, fonts);
  }

  {
    const page = pdf.addPage([A4.width, A4.height]);
    drawBrandHeader(page, fonts, "Piirangud ja kontakt", date, pageCount, pageCount);
    write(page, "Tulemuste olemus", {
      x: pdfTheme.margin,
      y: 742,
      size: 12,
      font: fonts.bold,
      color: ink,
    });
    input.limitations.forEach((item, i) => {
      write(page, `• ${item}`, {
        x: pdfTheme.margin,
        y: 720 - i * 18,
        size: 9,
        font: fonts.regular,
        color: muted,
        maxWidth: A4.width - pdfTheme.margin * 2,
        maxLines: 2,
      });
    });

    drawPanel(page, { x: pdfTheme.margin, y: 280, w: A4.width - pdfTheme.margin * 2, h: 150 }, panel);
    write(page, "Kontakt", {
      x: pdfTheme.margin + 16,
      y: 404,
      size: 12,
      font: fonts.bold,
      color: ink,
    });
    write(page, "Energiakalkulaator.ee", {
      x: pdfTheme.margin + 16,
      y: 382,
      size: 11,
      font: fonts.bold,
      color: highlight,
    });
    write(page, "Kenneth Alto", {
      x: pdfTheme.margin + 16,
      y: 362,
      size: 10,
      font: fonts.regular,
      color: ink,
    });
    write(page, "kennethalto95@gmail.com", {
      x: pdfTheme.margin + 16,
      y: 344,
      size: 10,
      font: fonts.regular,
      color: ink,
    });
    write(page, "https://www.energiakalkulaator.ee/kontakt", {
      x: pdfTheme.margin + 16,
      y: 326,
      size: 9,
      font: fonts.regular,
      color: muted,
    });
    write(page, "Ulikooliprojekt. Tulemused on hinnangulised ja sonltuvad sisenditest.", {
      x: pdfTheme.margin + 16,
      y: 304,
      size: 8.5,
      font: fonts.regular,
      color: muted,
      maxWidth: A4.width - pdfTheme.margin * 2 - 32,
      maxLines: 2,
    });
    drawReportFooter(page, fonts);
  }

  const bytes = await pdf.save();
  return bytes;
}

export function industrialPdfFilename(companyName: string, date = new Date()): string {
  const stamp = formatDateEt(date);
  const slug = companyName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9äöüõ\- ]/gi, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);
  return slug ? `energiakalkulaator-toostus-${slug}-${stamp}.pdf` : `energiakalkulaator-toostus-${stamp}.pdf`;
}

export function downloadPdfBytes(bytes: Uint8Array, filename: string) {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  const blob = new Blob([copy], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
