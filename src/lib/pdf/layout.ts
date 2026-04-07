import type { PDFPage, PDFFont, RGB } from "pdf-lib";
import { pdfTheme } from "@/lib/pdf/theme";

export type PdfFonts = {
  regular: PDFFont;
  bold: PDFFont;
};

export type Box = { x: number; y: number; w: number; h: number };

export function drawText(
  page: PDFPage,
  text: string,
  opts: {
    x: number;
    y: number;
    size: number;
    font: PDFFont;
    color: RGB;
    maxWidth?: number;
    lineHeight?: number;
  },
) {
  const { x, y, size, font, color, maxWidth, lineHeight } = opts;

  if (!maxWidth) {
    page.drawText(text, { x, y, size, font, color });
    return { height: size };
  }

  // Lihtne word-wrap (PDF-is vaja stabiilset ja deterministlikku renderdust)
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    const width = font.widthOfTextAtSize(test, size);
    if (width <= maxWidth) current = test;
    else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);

  const lh = lineHeight ?? size * 1.25;
  let yy = y;
  for (const line of lines) {
    page.drawText(line, { x, y: yy, size, font, color });
    yy -= lh;
  }
  return { height: lines.length * lh };
}

export function drawPanel(page: PDFPage, box: Box, fill = pdfTheme.colors.panel) {
  // pdf-lib ei toeta "borderRadius" tüübi järgi igal versioonil; hoia ristkülikud puhtad ja print-sõbralikud.
  page.drawRectangle({
    x: box.x,
    y: box.y,
    width: box.w,
    height: box.h,
    color: fill,
    borderColor: pdfTheme.colors.line,
    borderWidth: 1,
  });
}

export function drawDivider(page: PDFPage, x: number, y: number, w: number) {
  page.drawLine({
    start: { x, y },
    end: { x: x + w, y },
    thickness: 1,
    color: pdfTheme.colors.line,
  });
}

export function formatDateEt(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

