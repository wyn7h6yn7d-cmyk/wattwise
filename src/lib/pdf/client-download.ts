"use client";

import type { UnlockState } from "@/lib/unlock";
import type { PdfReportPayload } from "@/lib/pdf/types";

export async function clientDownloadPdf(
  projectId: string,
  unlock: UnlockState,
  payload: PdfReportPayload,
  downloadFilename: string,
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
    a.download = downloadFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return { ok: true };
  } catch {
    return { ok: false, error: "PDF allalaadimine ebaõnnestus." };
  }
}
