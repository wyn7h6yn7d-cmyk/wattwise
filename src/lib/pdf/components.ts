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
  const topY = box.y + box.h - 22;
  drawText(page, opts.headline, { x: box.x + 16, y: topY, size: 12, font: fonts.bold, color: pdfTheme.colors.text });
  const note = drawText(page, opts.note, {
    x: box.x + 16,
    y: topY - 18,
    size: 9,
    font: fonts.regular,
    color: pdfTheme.colors.muted,
    maxWidth: box.w - 32,
    lineHeight: 12,
    maxLines: 4,
  });

  const primaryLabelY = box.y + 44;
  const primaryValueY = box.y + 22;
  drawText(page, opts.primaryLabel, { x: box.x + 16, y: primaryLabelY, size: 9, font: fonts.regular, color: pdfTheme.colors.muted, maxLines: 1 });
  drawText(page, opts.primaryValue, { x: box.x + 16, y: primaryValueY, size: 18, font: fonts.bold, color: pdfTheme.colors.emerald, maxWidth: box.w * 0.48, maxLines: 1 });

  const startX = box.x + box.w * 0.56;
  const rightW = box.x + box.w - startX - 16;
  let y = topY - 18 - note.height - 12;
  const minY = box.y + 28;
  for (const [k, v] of opts.secondary.slice(0, 4)) {
    if (y < minY) break;
    const kh = drawText(page, k, {
      x: startX,
      y,
      size: 9,
      font: fonts.regular,
      color: pdfTheme.colors.muted,
      maxWidth: rightW,
      lineHeight: 12,
      maxLines: 2,
    });
    const valueY = y - kh.height - 3;
    const vh = drawText(page, v, {
      x: startX,
      y: valueY,
      size: 11,
      font: fonts.bold,
      color: pdfTheme.colors.text,
      maxWidth: rightW,
      lineHeight: 12,
      maxLines: 2,
    });
    y = valueY - vh.height - 8;
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
    // Hoia grid stabiilne: label max 2 rida, value 1 rida (vältida kattumist).
    const topY = cy + cellH - 20;
    const label = drawText(page, m.label, {
      x: cx + 12,
      y: topY,
      size: 9,
      font: fonts.regular,
      color: pdfTheme.colors.muted,
      maxWidth: cellW - 24,
      maxLines: 2,
    });
    drawText(page, m.value, {
      x: cx + 12,
      y: topY - label.height - 6,
      size: 13.5,
      font: fonts.bold,
      color: pdfTheme.colors.text,
      maxWidth: cellW - 24,
      maxLines: 1,
    });
    if (m.sub) {
      drawText(page, m.sub, { x: cx + 12, y: cy + 18, size: 8.5, font: fonts.regular, color: pdfTheme.colors.muted, maxWidth: cellW - 24, maxLines: 2 });
    }
  });
}

export function drawKeyValueTable(
  page: PDFPage,
  fonts: PdfFonts,
  box: Box,
  opts: {
    title: string;
    leftHeader: string;
    rightHeader: string;
    rows: Array<{ label: string; value: string; group?: string }>;
    maxRows?: number;
  },
) {
  const { title, leftHeader, rightHeader, rows, maxRows = 20 } = opts;
  drawPanel(page, box, pdfTheme.colors.panel);
  drawText(page, title, { x: box.x + 14, y: box.y + box.h - 22, size: 11, font: fonts.bold, color: pdfTheme.colors.text });

  const tableX = box.x + 14;
  const tableY = box.y + 16;
  const tableW = box.w - 28;
  const tableH = box.h - 46;
  const headerH = 18;
  const leftW = Math.round(tableW * 0.56);
  const rightW = tableW - leftW;

  page.drawRectangle({
    x: tableX,
    y: tableY + tableH - headerH,
    width: tableW,
    height: headerH,
    color: pdfTheme.colors.emeraldSoft,
    borderColor: pdfTheme.colors.line,
    borderWidth: 1,
  });
  drawText(page, leftHeader, {
    x: tableX + 8,
    y: tableY + tableH - 13,
    size: 8.5,
    font: fonts.bold,
    color: pdfTheme.colors.text,
    maxWidth: leftW - 12,
    maxLines: 1,
  });
  drawText(page, rightHeader, {
    x: tableX + leftW + 8,
    y: tableY + tableH - 13,
    size: 8.5,
    font: fonts.bold,
    color: pdfTheme.colors.text,
    maxWidth: rightW - 12,
    maxLines: 1,
  });
  page.drawLine({
    start: { x: tableX + leftW, y: tableY },
    end: { x: tableX + leftW, y: tableY + tableH },
    thickness: 1,
    color: pdfTheme.colors.line,
  });

  let y = tableY + tableH - headerH - 4;
  const usableRows = rows.slice(0, maxRows);
  for (let i = 0; i < usableRows.length; i += 1) {
    const row = usableRows[i];
    const rowTop = y;
    const label = row.group ? `${row.group} · ${row.label}` : row.label;
    const lh = drawText(page, label, {
      x: tableX + 8,
      y: rowTop - 10,
      size: 8.5,
      font: fonts.regular,
      color: pdfTheme.colors.muted,
      maxWidth: leftW - 14,
      lineHeight: 11,
      maxLines: 3,
    });
    const rh = drawText(page, row.value, {
      x: tableX + leftW + 8,
      y: rowTop - 10,
      size: 8.8,
      font: fonts.bold,
      color: pdfTheme.colors.text,
      maxWidth: rightW - 14,
      lineHeight: 11,
      maxLines: 3,
    });
    const rowH = Math.max(lh.height, rh.height) + 8;
    y -= rowH;
    if (i % 2 === 0) {
      page.drawRectangle({
        x: tableX,
        y,
        width: tableW,
        height: rowH,
        color: pdfTheme.colors.panel2,
        opacity: 0.45,
      });
    }
    page.drawLine({
      start: { x: tableX, y },
      end: { x: tableX + tableW, y },
      thickness: 0.7,
      color: pdfTheme.colors.line,
    });
    if (y < tableY + 10) break;
  }
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
  const leftPad = 14;
  const rightPad = 14;
  const gap = 28;
  const leftW = 170; // fikseeritud vasak veerg, et parempoolne tekst ei jookseks peale
  const rightW = Math.max(box.w - leftPad - rightPad - leftW - gap, 80);

  let y = box.y + box.h - 44;
  for (const r of rows.slice(0, 10)) {
    const lh = 12;
    const label = drawText(page, r.label, {
      x: box.x + leftPad,
      y,
      size: 9,
      font: fonts.regular,
      color: pdfTheme.colors.muted,
      maxWidth: leftW,
      lineHeight: lh,
      maxLines: 3,
    });
    const value = drawText(page, r.value, {
      x: box.x + leftPad + leftW + gap,
      y,
      size: 9.5,
      font: fonts.bold,
      color: pdfTheme.colors.text,
      maxWidth: rightW,
      lineHeight: lh,
      maxLines: 6,
    });
    y -= Math.max(label.height, value.height) + 8;
    if (y < box.y + 22) break;
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
      const label = drawText(page, `• ${it.label}`, {
        x: box.x + 18,
        y,
        size: 9,
        font: fonts.regular,
        color: pdfTheme.colors.muted,
        maxWidth: box.w * 0.60,
        lineHeight: 12,
        maxLines: 3,
      });
      const value = drawText(page, it.value, {
        x: box.x + box.w * 0.68,
        y,
        size: 9.5,
        font: fonts.bold,
        color: pdfTheme.colors.text,
        maxWidth: box.w * 0.30,
        lineHeight: 12,
        maxLines: 3,
      });
      y -= Math.max(label.height, value.height) + 4;
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
  const minY = box.y + 20;
  for (const b of bullets.slice(0, 6)) {
    if (y < minY) break;
    const h = drawText(page, `• ${b}`, {
      x: box.x + 14,
      y,
      size: 9.5,
      font: fonts.regular,
      color: pdfTheme.colors.text,
      maxWidth: box.w - 28,
      lineHeight: 12,
      maxLines: 4,
    });
    y -= h.height + 6;
  }
}

export function drawDisclaimerBlock(page: PDFPage, fonts: PdfFonts, box: Box) {
  drawPanel(page, box, pdfTheme.colors.panel2);
  const text =
    "Analüüs põhineb kasutaja sisestatud andmetel ja valitud eeldustel. Tegu on informatiivse tööriistaga ning raport ei ole finants-, investeerimis-, maksu- ega õigusnõu. Lõplike otsuste tegemisel soovitame vajadusel konsulteerida vastava ala spetsialistiga.";
  drawText(page, "Disclaimer", { x: box.x + 14, y: box.y + box.h - 22, size: 10.5, font: fonts.bold, color: pdfTheme.colors.text });
  drawText(page, text, { x: box.x + 14, y: box.y + box.h - 40, size: 9, font: fonts.regular, color: pdfTheme.colors.muted, maxWidth: box.w - 28 });
  drawText(page, "Kontakt: Kenneth Alto · kennethalto95@gmail.com", {
    x: box.x + 14,
    y: box.y + 26,
    size: 8.5,
    font: fonts.regular,
    color: pdfTheme.colors.muted,
    maxWidth: box.w - 28,
  });
}

export function drawDisclaimerBlockWithText(page: PDFPage, fonts: PdfFonts, box: Box, disclaimerText?: string) {
  drawPanel(page, box, pdfTheme.colors.panel2);
  const text =
    disclaimerText ??
    "Analüüs põhineb kasutaja sisestatud andmetel ja valitud eeldustel. Tegu on informatiivse tööriistaga ning raport ei ole finants-, investeerimis-, maksu- ega õigusnõu. Lõplike otsuste tegemisel soovitame vajadusel konsulteerida vastava ala spetsialistiga.";
  drawText(page, "Disclaimer", { x: box.x + 14, y: box.y + box.h - 22, size: 10.5, font: fonts.bold, color: pdfTheme.colors.text });
  drawText(page, text, { x: box.x + 14, y: box.y + box.h - 40, size: 9, font: fonts.regular, color: pdfTheme.colors.muted, maxWidth: box.w - 28 });
  drawText(page, "Kontakt: Kenneth Alto · kennethalto95@gmail.com", {
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

