import { NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe";
import { generatePremiumReport } from "@/lib/pdf/generateReport";
import type { PdfReportPayload } from "@/lib/pdf/types";
import { formatDateEt } from "@/lib/pdf/layout";

export async function POST(request: Request) {
  const stripe = getStripeServer();
  const body = (await request.json()) as {
    projectId?: string;
    fullAnalysisSessionId?: string;
    pdfSessionId?: string;
    payload?: PdfReportPayload;
  };

  const projectId = body.projectId?.trim();
  const fullId = body.fullAnalysisSessionId?.trim();
  const pdfId = body.pdfSessionId?.trim();

  if (!projectId || !fullId || !pdfId) {
    return NextResponse.json({ error: "Puuduvad vajalikud parameetrid." }, { status: 400 });
  }
  if (!body.payload) {
    return NextResponse.json({ error: "Raporti sisu puudub." }, { status: 400 });
  }

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

  try {
    const bytes = await generatePremiumReport(body.payload);
    const date = formatDateEt(new Date());
    const type = body.payload.calculatorType ?? "analuus";
    const name = body.payload.projectName
      ? body.payload.projectName.trim().toLowerCase().replace(/[^a-z0-9äöüõ\- ]/gi, "").replace(/\s+/g, "-").slice(0, 48)
      : null;
    const filename = name
      ? `energiakalkulaator-${name}-${date}.pdf`
      : `energiakalkulaator-${type}-analuus-${date}.pdf`;

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

