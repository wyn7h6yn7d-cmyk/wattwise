import { rgb } from "pdf-lib";

export const A4 = {
  width: 595.28,
  height: 841.89,
} as const;

export const pdfTheme = {
  margin: 44,
  gutter: 14,
  radius: 10,
  colors: {
    text: rgb(0.08, 0.1, 0.12),
    muted: rgb(0.38, 0.41, 0.46),
    line: rgb(0.88, 0.9, 0.92),
    panel: rgb(0.97, 0.98, 0.985),
    panel2: rgb(0.945, 0.96, 0.97),
    emerald: rgb(0.02, 0.65, 0.45),
    emeraldSoft: rgb(0.88, 0.97, 0.93),
    warningSoft: rgb(0.99, 0.97, 0.9),
  },
  fontSize: {
    h1: 22,
    h2: 14,
    h3: 12,
    body: 10,
    small: 8.5,
    metric: 16,
  },
} as const;

