import { PDFDocument, StandardFonts } from "pdf-lib";
import { A4, pdfTheme } from "@/lib/pdf/theme";
import { drawHeader, drawFooter, drawSummaryCard, drawMetricGrid, drawAssumptionsTable, drawGroupedInputs, drawRecommendationBox, drawDisclaimerBlock, calcSubtitle, defaultRecommendation, safeDateString } from "@/lib/pdf/components";
import { drawCashflowChart } from "@/lib/pdf/charts";
import type { PdfReportPayload } from "@/lib/pdf/types";

export async function generatePremiumReport(payload: PdfReportPayload) {
  const pdf = await PDFDocument.create();
  const fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  };

  const date = safeDateString();
  const subtitle = calcSubtitle(payload.calculatorType);
  const pageCount = 4;

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
      note: "Tegu on sisestatud andmete ja valitud eelduste põhjal koostatud informatiivse analüüsiga.",
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

    drawGroupedInputs(page, fonts, { x: pdfTheme.margin, y: 250, w: A4.width - pdfTheme.margin * 2, h: 520 }, payload.inputs);

    drawAssumptionsTable(
      page,
      fonts,
      { x: pdfTheme.margin, y: 120, w: A4.width - pdfTheme.margin * 2, h: 110 },
      payload.assumptions ?? [
        { label: "Märkus", value: "Eeldused on valitud konservatiivselt ja võivad erineda tegelikkusest." },
      ],
      "Eeldused (kokkuvõte)",
    );

    drawFooter(page, fonts);
  }

  // Page 3 — Main results + charts
  {
    const page = pdf.addPage([A4.width, A4.height]);
    drawHeader(page, fonts, { title: "Põhitulemused", subtitle, date, pageNumber: 3, pageCount });

    drawMetricGrid(page, fonts, { x: pdfTheme.margin, y: 520, w: A4.width - pdfTheme.margin * 2, h: 240 }, payload.metrics.slice(0, 8));

    if (payload.charts?.cashflowByYear && payload.charts.cashflowByYear.length > 0) {
      drawCashflowChart(
        page,
        fonts,
        { x: pdfTheme.margin, y: 260, w: A4.width - pdfTheme.margin * 2, h: 240 },
        payload.charts.cashflowByYear,
        "Rahavoo ülevaade (aastate lõikes)",
      );
    } else {
      drawAssumptionsTable(
        page,
        fonts,
        { x: pdfTheme.margin, y: 260, w: A4.width - pdfTheme.margin * 2, h: 240 },
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

    drawAssumptionsTable(
      page,
      fonts,
      { x: pdfTheme.margin, y: 300, w: A4.width - pdfTheme.margin * 2, h: 200 },
      [
        { label: "Võtmetegurid", value: "Elektrihind, omatarve, investeering, tootmine/tulu eeldus." },
        { label: "Riskid", value: "Hinna kõikumine, sisendite ebatäpsus, tehnilised piirangud, regulatiivsed muutused." },
        { label: "Järgmine samm", value: "Tee üks alternatiivne stsenaarium ja võrdle, milline sisend mõjutab tulemust enim." },
      ],
      "Võtmetegurid ja riskid",
    );

    drawDisclaimerBlock(page, fonts, { x: pdfTheme.margin, y: 120, w: A4.width - pdfTheme.margin * 2, h: 160 });
    drawFooter(page, fonts);
  }

  return await pdf.save();
}

