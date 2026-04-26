import { NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe";
import { generatePremiumReport } from "@/lib/pdf/generateReport";
import type { PdfReportPayload } from "@/lib/pdf/types";
import { FEATURES } from "@/lib/features";

function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    projectId?: string;
    fullAnalysisSessionId?: string;
    pdfSessionId?: string;
    payload?: PdfReportPayload;
  };

  const projectId = body.projectId?.trim();
  const fullId = body.fullAnalysisSessionId?.trim();
  const pdfId = body.pdfSessionId?.trim();

  if (!body.payload) {
    return NextResponse.json({ error: "Raporti sisu puudub." }, { status: 400 });
  }

  // Temporary free testing mode: allow PDF generation without Stripe sessions.
  if (FEATURES.paywallEnabled) {
    if (!projectId || !fullId || !pdfId) {
      return NextResponse.json({ error: "Puuduvad vajalikud parameetrid." }, { status: 400 });
    }
    const stripe = getStripeServer();
    const [fullSession, pdfSession] = await Promise.all([
      stripe.checkout.sessions.retrieve(fullId),
      stripe.checkout.sessions.retrieve(pdfId),
    ]);

    const okFull =
      fullSession.payment_status === "paid" &&
      fullSession.metadata?.projectId === projectId &&
      fullSession.metadata?.purchaseType === "full_analysis";
    const okPdf =
      pdfSession.payment_status === "paid" &&
      pdfSession.metadata?.projectId === projectId &&
      pdfSession.metadata?.purchaseType === "pdf_report";

    if (!okFull || !okPdf) {
      return NextResponse.json({ error: "Ligipääs puudub." }, { status: 403 });
    }
  }

  try {
    const bytes = await generatePremiumReport(body.payload);
    const date = toIsoDate(new Date());
    const type = body.payload.calculatorType ?? "analuus";
    const filename = `energiakalkulaator-${type}-${date}.pdf`;

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename=\"${filename}\"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "PDF genereerimine ebaõnnestus." }, { status: 500 });
  }
}

