import { PDFDocument, StandardFonts } from "pdf-lib";
import { A4, pdfTheme } from "@/lib/pdf/theme";
import {
  drawHeader,
  drawFooter,
  drawSummaryCard,
  drawMetricGrid,
  drawAssumptionsTable,
  drawRecommendationBox,
  drawDisclaimerBlockWithText,
  drawKeyValueTable,
  calcSubtitle,
  defaultRecommendation,
  safeDateString,
} from "@/lib/pdf/components";
import { drawCashflowChart } from "@/lib/pdf/charts";
import type { PdfReportPayload } from "@/lib/pdf/types";

const SHARED_DISCLAIMER =
  "Raport on informatiivne hinnang ja põhineb kasutaja sisestatud andmetel ning valitud eeldustel. Tulemused võivad erineda tegelikest tulemustest sõltuvalt turuhindadest, seadmete tehnilistest omadustest, kasutusprofiilist, ilmast, võrgu- ja lepingutingimustest ning muudest teguritest. Raport ei ole finants-, investeerimis-, maksu-, õigus- ega tehniline nõustamine. Küsimused ja tagasiside: kennethalto95@gmail.com";

export async function generatePremiumReport(payload: PdfReportPayload) {
  const analysisBasisText =
    payload.analysisBasis === "advanced"
      ? "Tulemus põhineb kasutaja sisestatud täpsematel andmetel."
      : "See tulemus kasutab osaliselt vaikimisi eeldusi.";
  const methodology = [
    {
      label: "Metoodika",
      value:
        "Analüüs põhineb kasutaja sisestatud andmetel, valitud eeldustel ja süsteemis kasutataval arvutusmudelil. Tulemused on hinnangulised ning sõltuvad sisendandmete täpsusest.",
    },
  ];
  const risksAndLimits = payload.risksAndLimits ?? [
    { label: "Riskid", value: "Tegelik tulemus võib erineda turutingimuste, kasutusprofiili ja tehniliste piirangute tõttu." },
  ];

  const pdf = await PDFDocument.create();
  const fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  };

  const date = safeDateString();
  const subtitle = calcSubtitle(payload.calculatorType);
  const pageCount = 4;
  const flattenedInputs = payload.inputs.flatMap((g) =>
    g.items.map((it) => ({ group: g.group, label: it.label, value: it.value })),
  );
  const resultRows = payload.metrics.map((m) => ({ label: m.label, value: m.value }));
  const disclaimerText = payload.disclaimer
    ? `${payload.disclaimer} ${SHARED_DISCLAIMER}`
    : SHARED_DISCLAIMER;

  // Page 1 — Title / Summary
  {
    const page = pdf.addPage([A4.width, A4.height]);
    drawHeader(page, fonts, {
      title: "Energiakalkulaatori analüüs",
      subtitle,
      date,
      pageNumber: 1,
      pageCount,
    });

    const primary = payload.metrics[0] ?? { label: "Peamine tulemus", value: "—" };
    drawSummaryCard(page, fonts, { x: pdfTheme.margin, y: 560, w: A4.width - pdfTheme.margin * 2, h: 180 }, {
      headline: "Kokkuvõte",
      note:
        payload.summary ??
        `Tegu on sisestatud andmete ja valitud eelduste põhjal koostatud informatiivse analüüsiga. ${analysisBasisText}`,
      primaryLabel: primary.label,
      primaryValue: primary.value,
      secondary: payload.metrics.slice(1, 5).map((m) => [m.label, m.value]),
    });

    drawMetricGrid(page, fonts, { x: pdfTheme.margin, y: 350, w: A4.width - pdfTheme.margin * 2, h: 180 }, payload.metrics.slice(0, 6));

    drawFooter(page, fonts);
  }

  // Page 2 — Inputs & assumptions
  {
    const page = pdf.addPage([A4.width, A4.height]);
    drawHeader(page, fonts, { title: "Sisendid ja eeldused", subtitle, date, pageNumber: 2, pageCount });

    drawKeyValueTable(page, fonts, { x: pdfTheme.margin, y: 236, w: A4.width - pdfTheme.margin * 2, h: 534 }, {
      title: "Sisendite tabel",
      leftHeader: "Sisend",
      rightHeader: "Väärtus",
      rows: flattenedInputs,
      maxRows: 28,
    });

    drawAssumptionsTable(
      page,
      fonts,
      { x: pdfTheme.margin, y: 118, w: A4.width - pdfTheme.margin * 2, h: 100 },
      [{ label: "Arvutuse alus", value: analysisBasisText }, ...(payload.assumptions ?? [
        { label: "Märkus", value: "Eeldused on valitud konservatiivselt ja võivad erineda tegelikkusest." },
      ])],
      "Eeldused (kokkuvõte)",
    );

    drawFooter(page, fonts);
  }

  // Page 3 — Main results + charts
  {
    const page = pdf.addPage([A4.width, A4.height]);
    drawHeader(page, fonts, { title: "Põhitulemused", subtitle, date, pageNumber: 3, pageCount });

    drawMetricGrid(page, fonts, { x: pdfTheme.margin, y: 560, w: A4.width - pdfTheme.margin * 2, h: 200 }, payload.metrics.slice(0, 6));
    drawKeyValueTable(page, fonts, { x: pdfTheme.margin, y: 264, w: A4.width - pdfTheme.margin * 2, h: 278 }, {
      title: "Tulemuste tabel",
      leftHeader: "Mõõdik",
      rightHeader: "Väärtus",
      rows: resultRows,
      maxRows: 14,
    });

    if (payload.charts?.cashflowByYear && payload.charts.cashflowByYear.length > 0) {
      drawCashflowChart(
        page,
        fonts,
        { x: pdfTheme.margin, y: 120, w: A4.width - pdfTheme.margin * 2, h: 130 },
        payload.charts.cashflowByYear,
        "Rahavoo mini-graafik",
      );
    } else {
      drawAssumptionsTable(
        page,
        fonts,
        { x: pdfTheme.margin, y: 120, w: A4.width - pdfTheme.margin * 2, h: 130 },
        [
          { label: "Graafik", value: "Selle kalkulaatori V1 raportis kuvatakse graafikud piiratud kujul." },
          { label: "Soovitus", value: "Sisesta täpsustavaid andmeid ja värskenda analüüsi, et lisagraafikud aktiveeruksid." },
        ],
        "Graafikud",
      );
    }

    drawFooter(page, fonts);
  }

  // Page 4 — Detailed analysis + recommendation + disclaimer
  {
    const page = pdf.addPage([A4.width, A4.height]);
    drawHeader(page, fonts, { title: "Detailsem analüüs", subtitle, date, pageNumber: 4, pageCount });

    const rec = payload.recommendation ?? defaultRecommendation(payload.calculatorType);
    drawRecommendationBox(page, fonts, { x: pdfTheme.margin, y: 520, w: A4.width - pdfTheme.margin * 2, h: 220 }, rec.title, rec.bullets);

    drawAssumptionsTable(page, fonts, { x: pdfTheme.margin, y: 418, w: A4.width - pdfTheme.margin * 2, h: 102 }, methodology, "Arvutuse metoodika");
    drawAssumptionsTable(page, fonts, { x: pdfTheme.margin, y: 220, w: A4.width - pdfTheme.margin * 2, h: 188 }, risksAndLimits, "Riskid ja piirangud");
    drawDisclaimerBlockWithText(
      page,
      fonts,
      { x: pdfTheme.margin, y: 80, w: A4.width - pdfTheme.margin * 2, h: 130 },
      disclaimerText,
    );
    drawFooter(page, fonts);
  }

  return await pdf.save();
}

