"use client";

import type { UnlockState } from "@/lib/unlock";
import type { PdfReportPayload } from "@/lib/pdf/types";

function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildPdfFilename(calculatorType: PdfReportPayload["calculatorType"]): string {
  return `energiakalkulaator-${calculatorType}-${toIsoDate(new Date())}.pdf`;
}

export async function clientDownloadPdf(
  projectId: string,
  unlock: UnlockState,
  payload: PdfReportPayload,
  _downloadFilename: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!projectId.trim()) {
    return { ok: false, error: "Projekt puudub." };
  }
  try {
    const res = await fetch("/api/pdf/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        projectId,
        fullAnalysisSessionId: unlock.fullAnalysisSessionId,
        pdfSessionId: unlock.pdfSessionId,
        payload,
      }),
    });
    if (!res.ok) {
      return { ok: false, error: "PDF genereerimine ebaõnnestus." };
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildPdfFilename(payload.calculatorType);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return { ok: true };
  } catch {
    return { ok: false, error: "PDF allalaadimine ebaõnnestus." };
  }
}
