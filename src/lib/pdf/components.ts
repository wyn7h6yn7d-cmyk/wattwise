import type { PDFPage } from "pdf-lib";
import { pdfTheme } from "@/lib/pdf/theme";
import { drawDivider, drawPanel, drawText, formatDateEt, type Box, type PdfFonts } from "@/lib/pdf/layout";

export function drawHeader(
  page: PDFPage,
  fonts: PdfFonts,
  opts: { title: string; subtitle: string; date: string; pageNumber: number; pageCount: number },
) {
  const { title, subtitle, date, pageNumber, pageCount } = opts;
  const x = pdfTheme.margin;
  const y = 800;
  drawText(page, "Energiakalkulaator", {
    x,
    y,
    size: 11,
    font: fonts.bold,
    color: pdfTheme.colors.emerald,
  });
  drawText(page, title, { x, y: y - 20, size: 16, font: fonts.bold, color: pdfTheme.colors.text });
  drawText(page, subtitle, { x, y: y - 36, size: 10, font: fonts.regular, color: pdfTheme.colors.muted });
  drawText(page, `Kuupäev: ${date}`, {
    x: 430,
    y: y - 14,
    size: 9,
    font: fonts.regular,
    color: pdfTheme.colors.muted,
  });
  drawDivider(page, x, y - 52, 595.28 - pdfTheme.margin * 2);
  drawText(page, `${pageNumber} / ${pageCount}`, {
    x: 520,
    y: 26,
    size: 8.5,
    font: fonts.regular,
    color: pdfTheme.colors.muted,
  });
}

export function drawFooter(page: PDFPage, fonts: PdfFonts) {
  const x = pdfTheme.margin;
  const y = 34;
  drawDivider(page, x, y + 16, 595.28 - pdfTheme.margin * 2);
  drawText(page, "Kontakt: Kenneth Alto · kennethalto95@gmail.com", {
    x,
    y,
    size: 8.5,
    font: fonts.regular,
    color: pdfTheme.colors.muted,
  });
}

export function drawSummaryCard(
  page: PDFPage,
  fonts: PdfFonts,
  box: Box,
  opts: { headline: string; note: string; primaryLabel: string; primaryValue: string; secondary: Array<[string, string]> },
) {
  drawPanel(page, box, pdfTheme.colors.emeraldSoft);
  drawText(page, opts.headline, { x: box.x + 16, y: box.y + box.h - 22, size: 12, font: fonts.bold, color: pdfTheme.colors.text });
  drawText(page, opts.note, {
    x: box.x + 16,
    y: box.y + box.h - 40,
    size: 9,
    font: fonts.regular,
    color: pdfTheme.colors.muted,
    maxWidth: box.w - 32,
  });

  drawText(page, opts.primaryLabel, { x: box.x + 16, y: box.y + 44, size: 9, font: fonts.regular, color: pdfTheme.colors.muted });
  drawText(page, opts.primaryValue, { x: box.x + 16, y: box.y + 22, size: 18, font: fonts.bold, color: pdfTheme.colors.emerald });

  const startX = box.x + box.w * 0.55;
  let y = box.y + box.h - 70;
  for (const [k, v] of opts.secondary.slice(0, 4)) {
    drawText(page, k, { x: startX, y, size: 9, font: fonts.regular, color: pdfTheme.colors.muted });
    drawText(page, v, { x: startX, y: y - 14, size: 11, font: fonts.bold, color: pdfTheme.colors.text });
    y -= 34;
  }
}

export function drawMetricGrid(page: PDFPage, fonts: PdfFonts, box: Box, metrics: Array<{ label: string; value: string; sub?: string }>) {
  drawPanel(page, box, pdfTheme.colors.panel);
  const cols = 2;
  const rows = Math.ceil(metrics.length / cols);
  const cellW = (box.w - pdfTheme.gutter) / cols;
  const cellH = box.h / Math.max(rows, 1);

  metrics.slice(0, cols * rows).forEach((m, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = box.x + col * (cellW + pdfTheme.gutter);
    const cy = box.y + box.h - (row + 1) * cellH;
    page.drawRectangle({
      x: cx,
      y: cy + 8,
      width: cellW,
      height: cellH - 12,
      color: pdfTheme.colors.panel2,
      borderColor: pdfTheme.colors.line,
      borderWidth: 1,
    });
    drawText(page, m.label, { x: cx + 12, y: cy + cellH - 20, size: 9, font: fonts.regular, color: pdfTheme.colors.muted, maxWidth: cellW - 24 });
    drawText(page, m.value, { x: cx + 12, y: cy + cellH - 42, size: 14, font: fonts.bold, color: pdfTheme.colors.text, maxWidth: cellW - 24 });
    if (m.sub) {
      drawText(page, m.sub, { x: cx + 12, y: cy + 16, size: 8.5, font: fonts.regular, color: pdfTheme.colors.muted, maxWidth: cellW - 24 });
    }
  });
}

export function drawAssumptionsTable(
  page: PDFPage,
  fonts: PdfFonts,
  box: Box,
  rows: Array<{ label: string; value: string }>,
  title: string,
) {
  drawPanel(page, box, pdfTheme.colors.panel);
  drawText(page, title, { x: box.x + 14, y: box.y + box.h - 22, size: 11, font: fonts.bold, color: pdfTheme.colors.text });
  let y = box.y + box.h - 44;
  for (const r of rows.slice(0, 10)) {
    drawText(page, r.label, { x: box.x + 14, y, size: 9, font: fonts.regular, color: pdfTheme.colors.muted, maxWidth: box.w * 0.55 });
    drawText(page, r.value, { x: box.x + box.w * 0.6, y, size: 9.5, font: fonts.bold, color: pdfTheme.colors.text, maxWidth: box.w * 0.38 });
    y -= 16;
    if (y < box.y + 18) break;
  }
}

export function drawGroupedInputs(
  page: PDFPage,
  fonts: PdfFonts,
  box: Box,
  groups: Array<{ group: string; items: Array<{ label: string; value: string }> }>,
) {
  drawPanel(page, box, pdfTheme.colors.panel);
  drawText(page, "Sisendid (grupeeritult)", {
    x: box.x + 14,
    y: box.y + box.h - 22,
    size: 11,
    font: fonts.bold,
    color: pdfTheme.colors.text,
  });
  let y = box.y + box.h - 42;
  for (const g of groups) {
    drawText(page, g.group, { x: box.x + 14, y, size: 9.5, font: fonts.bold, color: pdfTheme.colors.emerald });
    y -= 14;
    for (const it of g.items) {
      drawText(page, `• ${it.label}`, { x: box.x + 18, y, size: 9, font: fonts.regular, color: pdfTheme.colors.muted, maxWidth: box.w * 0.62 });
      drawText(page, it.value, { x: box.x + box.w * 0.68, y, size: 9.5, font: fonts.bold, color: pdfTheme.colors.text, maxWidth: box.w * 0.30 });
      y -= 14;
      if (y < box.y + 20) return;
    }
    y -= 8;
    if (y < box.y + 20) return;
  }
}

export function drawRecommendationBox(page: PDFPage, fonts: PdfFonts, box: Box, title: string, bullets: string[]) {
  drawPanel(page, box, pdfTheme.colors.warningSoft);
  drawText(page, title, { x: box.x + 14, y: box.y + box.h - 22, size: 11, font: fonts.bold, color: pdfTheme.colors.text });
  let y = box.y + box.h - 44;
  for (const b of bullets.slice(0, 6)) {
    drawText(page, `• ${b}`, { x: box.x + 14, y, size: 9.5, font: fonts.regular, color: pdfTheme.colors.text, maxWidth: box.w - 28 });
    y -= 14;
    if (y < box.y + 18) break;
  }
}

export function drawDisclaimerBlock(page: PDFPage, fonts: PdfFonts, box: Box) {
  drawPanel(page, box, pdfTheme.colors.panel);
  const text =
    "Analüüs põhineb kasutaja sisestatud andmetel ja valitud eeldustel. Tegu on informatiivse tööriistaga ning raport ei ole finants-, investeerimis-, maksu- ega õigusnõu. Lõplike otsuste tegemisel soovitame vajadusel konsulteerida vastava ala spetsialistiga.";
  drawText(page, "Disclaimer", { x: box.x + 14, y: box.y + box.h - 22, size: 10.5, font: fonts.bold, color: pdfTheme.colors.text });
  drawText(page, text, { x: box.x + 14, y: box.y + box.h - 40, size: 9, font: fonts.regular, color: pdfTheme.colors.muted, maxWidth: box.w - 28 });
  drawText(page, "Teenust osutab hetkel eraisik Kenneth Alto. Täiendavad ettevõtte andmed lisatakse pärast ettevõtlusvormi vormistamist.", {
    x: box.x + 14,
    y: box.y + 26,
    size: 8.5,
    font: fonts.regular,
    color: pdfTheme.colors.muted,
    maxWidth: box.w - 28,
  });
}

export function calcSubtitle(type: string) {
  switch (type) {
    case "paikesejaam":
      return "Päikesejaama tasuvusanalüüs";
    case "vpp":
      return "VPP tasuvusanalüüs";
    case "elektripaketid":
      return "Elektripaketi võrdlus";
    case "ev-laadimine":
      return "EV laadimise analüüs";
    case "peak-shaving":
      return "Peak shaving analüüs";
    default:
      return "Analüüs";
  }
}

export function defaultRecommendation(type: string) {
  const base = [
    "Tulemus sõltub enim elektrihinnast, omatarbest ja investeeringu suurusest.",
    "Kui eesmärk on vähendada ostetava elektri mahtu, tasub tähelepanu pöörata omatarbe osakaalule.",
    "Kontrolli sisendeid (hind, tootmine, tarbimine) ja võrdle vähemalt ühte alternatiivset stsenaariumi.",
  ];
  if (type === "vpp") {
    return {
      title: "Tähelepanekud ja soovitused",
      bullets: [...base, "VPP tulu eeldus on peamine riskitegur — testi madal/baas/kõrge stsenaariumi."],
    };
  }
  if (type === "paikesejaam") {
    return {
      title: "Tähelepanekud ja soovitused",
      bullets: [...base, "Tasuvust parandab sageli omatarbe suurendamine (ajasta tarbimist, lisa juhtimist)."],
    };
  }
  return { title: "Tähelepanekud ja soovitused", bullets: base };
}

export function safeDateString() {
  return formatDateEt(new Date());
}

