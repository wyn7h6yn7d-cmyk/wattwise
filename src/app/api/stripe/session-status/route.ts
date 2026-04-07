import { NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe";

export async function GET(request: Request) {
  const stripe = getStripeServer();
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id")?.trim();

  if (!sessionId) {
    return NextResponse.json({ error: "session_id puudub" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const paid = session.payment_status === "paid";

  return NextResponse.json({
    paid,
    id: session.id,
    payment_status: session.payment_status,
    metadata: session.metadata ?? {},
  });
}

