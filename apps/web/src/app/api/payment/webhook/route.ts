import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

function requireConfig() {
  if (!supabaseUrl || !serviceRoleKey || !paystackSecretKey) {
    throw new Error("Payment webhook server configuration is missing.");
  }
}

function isValidSignature(rawBody: string, signature: string) {
  if (!signature) return false;

  const expected = createHmac("sha512", paystackSecretKey!)
    .update(rawBody)
    .digest("hex");

  const providedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
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

async function callFulfillmentRpc(args: Record<string, unknown>) {
  return supabaseFetch("rpc/fulfill_paystack_charge_success", {
    method: "POST",
    body: JSON.stringify(args),
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";

  try {
    requireConfig();

    if (!isValidSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
    }

    const body = JSON.parse(rawBody) as {
      event?: string;
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

    const data = body.data;

    if (body.event !== "charge.success" || data?.status !== "success") {
      return NextResponse.json({ received: true, processed: false });
    }

    if (
      typeof data.id !== "number" ||
      !data.reference ||
      typeof data.amount !== "number" ||
      data.currency !== "NGN"
    ) {
      return NextResponse.json({ error: "Invalid Paystack webhook payload." }, { status: 400 });
    }

    const result = await callFulfillmentRpc({
      p_event_type: body.event,
      p_provider_transaction_id: data.id,
      p_provider_reference: data.reference,
      p_amount_kobo: data.amount,
      p_currency: data.currency,
      p_channel: data.channel ?? null,
      p_gateway_response: data.gateway_response ?? null,
      p_paid_at: data.paid_at ?? null,
      p_payload: body,
    });

    return NextResponse.json({
      received: true,
      processed: true,
      fulfillment: result,
    });
  } catch (error) {
    console.error("Paystack webhook processing failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to process Paystack webhook.",
      },
      { status: 500 },
    );
  }
}
