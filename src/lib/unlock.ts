export type PurchaseType = "full_analysis" | "pdf_report";

export type UnlockState = {
  fullAnalysisUnlocked: boolean;
  pdfUnlocked: boolean;
  fullAnalysisSessionId: string | null;
  pdfSessionId: string | null;
};

export function canViewFullAnalysis(unlock: UnlockState) {
  return Boolean(unlock.fullAnalysisUnlocked);
}

export function canDownloadPdf(unlock: UnlockState) {
  // UX reegel: PDF on lubatud ainult siis, kui täisanalüüs + PDF on mõlemad unlockitud.
  return Boolean(unlock.fullAnalysisUnlocked && unlock.pdfUnlocked);
}

