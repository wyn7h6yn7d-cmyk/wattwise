import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeServer } from "@/lib/stripe";

export async function POST(request: Request) {
  const stripe = getStripeServer();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET puudub" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "stripe-signature puudub" }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    return NextResponse.json({ error: "Webhook signature kontroll ebaõnnestus" }, { status: 400 });
  }

  // V1 on stateless: me ei salvesta DB-sse (hiljem lisa projects/entitlements tabel).
  // Oluline: PDF genereerimine ja full-analysis gating kontrollivad makset Stripe API kaudu.
  if (event.type === "checkout.session.completed") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const session = event.data.object as Stripe.Checkout.Session;
  }

  return NextResponse.json({ received: true });
}

