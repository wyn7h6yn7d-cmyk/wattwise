import { NextResponse } from "next/server";
import { getStripeServer, getSiteUrl } from "@/lib/stripe";

type PurchaseType = "full_analysis" | "pdf_report";

export async function POST(request: Request) {
  const stripe = getStripeServer();
  const body = (await request.json()) as {
    projectId?: string;
    purchaseType?: PurchaseType;
    fullAnalysisSessionId?: string;
  };

  const projectId = body.projectId?.trim();
  const purchaseType = body.purchaseType;

  if (!projectId) {
    return NextResponse.json({ error: "projectId puudub" }, { status: 400 });
  }
  if (purchaseType !== "full_analysis" && purchaseType !== "pdf_report") {
    return NextResponse.json({ error: "purchaseType on vigane" }, { status: 400 });
  }

  // Kui PDF ost eeldab täisanalüüsi, kontrollime seda serveris.
  if (purchaseType === "pdf_report") {
    const fullId = body.fullAnalysisSessionId?.trim();
    if (!fullId) {
      return NextResponse.json(
        { error: "PDF raport eeldab täisanalüüsi (fullAnalysisSessionId puudub)." },
        { status: 400 },
      );
    }
    const fullSession = await stripe.checkout.sessions.retrieve(fullId);
    const paid = fullSession.payment_status === "paid";
    const metaOk = fullSession.metadata?.projectId === projectId && fullSession.metadata?.purchaseType === "full_analysis";
    if (!paid || !metaOk) {
      return NextResponse.json(
        { error: "Täisanalüüs peab olema eelnevalt tasutud selle projekti jaoks." },
        { status: 403 },
      );
    }
  }

  const priceId =
    purchaseType === "full_analysis"
      ? process.env.STRIPE_PRICE_FULL_ANALYSIS
      : process.env.STRIPE_PRICE_PDF_REPORT;

  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe Price ID env var puudub" },
      { status: 500 },
    );
  }

  const siteUrl = getSiteUrl();
  const baseReturn = `${siteUrl}/kalkulaatorid/paikesejaam?projectId=${encodeURIComponent(projectId)}`;
  const successUrl = `${baseReturn}&session_id={CHECKOUT_SESSION_ID}&purchaseType=${purchaseType}&status=success`;
  const cancelUrl = `${baseReturn}&purchaseType=${purchaseType}&status=cancel`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      projectId,
      purchaseType,
    },
    allow_promotion_codes: false,
  });

  return NextResponse.json({ url: session.url });
}

