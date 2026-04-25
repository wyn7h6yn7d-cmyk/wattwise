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
    text: rgb(0.1, 0.12, 0.14),
    muted: rgb(0.36, 0.4, 0.45),
    line: rgb(0.84, 0.88, 0.9),
    panel: rgb(0.985, 0.99, 0.992),
    panel2: rgb(0.955, 0.975, 0.97),
    emerald: rgb(0.05, 0.6, 0.42),
    emeraldSoft: rgb(0.91, 0.98, 0.94),
    warningSoft: rgb(0.95, 0.98, 0.95),
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

