import type { PDFPage } from "pdf-lib";
import { pdfTheme } from "@/lib/pdf/theme";
import { drawPanel, drawText, type Box, type PdfFonts } from "@/lib/pdf/layout";

export function drawCashflowChart(
  page: PDFPage,
  fonts: PdfFonts,
  box: Box,
  values: number[],
  title: string,
) {
  drawPanel(page, box, pdfTheme.colors.panel);
  drawText(page, title, { x: box.x + 14, y: box.y + box.h - 22, size: 11, font: fonts.bold, color: pdfTheme.colors.text });

  const inner: Box = { x: box.x + 14, y: box.y + 18, w: box.w - 28, h: box.h - 50 };
  const maxAbs = values.reduce((m, v) => Math.max(m, Math.abs(v)), 1);
  const bars = Math.min(values.length, 20);
  const barW = Math.max(inner.w / bars - 2, 6);
  const zeroY = inner.y + inner.h * 0.2; // jätame rohkem ruumi positiivsele

  // soft grid lines
  for (const g of [0.25, 0.5, 0.75]) {
    const gy = inner.y + inner.h * g;
    page.drawLine({
      start: { x: inner.x, y: gy },
      end: { x: inner.x + inner.w, y: gy },
      thickness: 0.6,
      color: pdfTheme.colors.line,
      opacity: 0.6,
    });
  }

  // axes baseline
  page.drawLine({
    start: { x: inner.x, y: zeroY },
    end: { x: inner.x + inner.w, y: zeroY },
    thickness: 1,
    color: pdfTheme.colors.line,
  });

  for (let i = 0; i < bars; i++) {
    const v = values[i] ?? 0;
    const x = inner.x + i * (barW + 2);
    const h = (Math.abs(v) / maxAbs) * (inner.h * 0.75);
    const y = v >= 0 ? zeroY : zeroY - h;
    page.drawRectangle({
      x,
      y,
      width: barW,
      height: Math.max(h, 1),
      color: v >= 0 ? pdfTheme.colors.emerald : pdfTheme.colors.emerald,
      opacity: v >= 0 ? 0.78 : 0.38,
    });
    if (i % 5 === 0) {
      drawText(page, String(i + 1), {
        x,
        y: inner.y - 2,
        size: 8,
        font: fonts.regular,
        color: pdfTheme.colors.muted,
      });
    }
  }

  drawText(page, "Aastad", { x: inner.x, y: box.y + 6, size: 8.5, font: fonts.regular, color: pdfTheme.colors.muted });
  drawText(page, "EUR", { x: box.x + box.w - 34, y: box.y + box.h - 22, size: 8.5, font: fonts.regular, color: pdfTheme.colors.muted });
}

