import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

function requireConfig() {
  if (!supabaseUrl || !serviceRoleKey || !paystackSecretKey) {
    throw new Error("Payment server configuration is missing.");
  }
}

async function supabaseFetch(path: string, init?: RequestInit) {
  requireConfig();

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey!,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    throw new Error(typeof body === "string" ? body : JSON.stringify(body));
  }

  return body;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { reference?: string };

    if (!body.reference?.trim()) {
      return NextResponse.json(
        { error: "Paystack reference is required." },
        { status: 400 },
      );
    }

    const reference = body.reference.trim();

    const payments = await supabaseFetch(
      `payments?provider=eq.paystack&provider_reference=eq.${encodeURIComponent(reference)}&select=id,order_id,provider_reference,amount_kobo,currency,status&limit=1`,
    ) as Array<{
      id: string;
      order_id: string;
      provider_reference: string;
      amount_kobo: number;
      currency: string;
      status: string;
    }>;

    const payment = payments[0];
    if (!payment) {
      return NextResponse.json(
        { error: "Payment record not found." },
        { status: 404 },
      );
    }

    if (payment.status === "Paid") {
      return NextResponse.json({
        reference,
        status: "Paid",
        paymentStatus: "Paid",
        inventoryReduced: false,
      });
    }

    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    const paystackBody = (await paystackResponse.json()) as {
      status?: boolean;
      message?: string;
      data?: {
        id?: number;
        reference?: string;
        status?: string;
        amount?: number;
        currency?: string;
        channel?: string;
        gateway_response?: string;
        paid_at?: string | null;
      };
    };

    const transaction = paystackBody.data;

    if (
      !paystackResponse.ok ||
      !paystackBody.status ||
      !transaction ||
      transaction.reference !== payment.provider_reference ||
      transaction.amount !== payment.amount_kobo ||
      transaction.currency !== payment.currency
    ) {
      return NextResponse.json(
        { error: "Paystack transaction could not be verified against the order payment." },
        { status: 409 },
      );
    }

    const verified = transaction.status === "success";
    const paymentStatus = verified ? "Paid" : "Failed";

    await supabaseFetch(
      `payments?id=eq.${encodeURIComponent(payment.id)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          provider_transaction_id: transaction.id ?? null,
          status: paymentStatus,
          channel: transaction.channel ?? null,
          gateway_response: transaction.gateway_response ?? null,
          paid_at: verified ? transaction.paid_at ?? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        }),
      },
    );

    if (verified) {
      await supabaseFetch(
        `orders?id=eq.${encodeURIComponent(payment.order_id)}&payment_status=eq.Pending`,
        {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            payment_status: "Paid",
            paid_at: transaction.paid_at ?? new Date().toISOString(),
          }),
        },
      );
    }

    return NextResponse.json({
      reference,
      status: transaction.status ?? "unknown",
      paymentStatus,
      inventoryReduced: false,
    });
  } catch (error) {
    console.error("Paystack verification failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to verify payment.",
      },
      { status: 500 },
    );
  }
}
