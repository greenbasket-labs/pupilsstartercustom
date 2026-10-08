import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

function requireConfig() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server configuration is missing.");
  }
  if (!paystackSecretKey) {
    throw new Error("Paystack server configuration is missing.");
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
    const body = (await request.json()) as {
      orderId?: string;
      email?: string;
    };

    if (!body.orderId || !body.email?.trim()) {
      return NextResponse.json(
        { error: "Order ID and email are required to start payment." },
        { status: 400 },
      );
    }

    const email = body.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Enter a valid email address for payment." },
        { status: 400 },
      );
    }

    const orders = await supabaseFetch(
      `orders?id=eq.${encodeURIComponent(body.orderId)}&select=id,reference,total_kobo,payment_status,email&limit=1`,
    ) as Array<{
      id: string;
      reference: string;
      total_kobo: number;
      payment_status: string;
      email: string | null;
    }>;

    const order = orders[0];
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.payment_status === "Paid") {
      return NextResponse.json(
        { error: "This order has already been paid." },
        { status: 409 },
      );
    }

    const existingPayments = await supabaseFetch(
      `payments?order_id=eq.${encodeURIComponent(order.id)}&provider=eq.paystack&status=eq.Pending&select=provider_reference,provider_access_code,authorization_url&order=created_at.desc&limit=1`,
    ) as Array<{
      provider_reference: string;
      provider_access_code: string | null;
      authorization_url: string | null;
    }>;

    if (existingPayments[0]?.authorization_url) {
      return NextResponse.json({
        orderId: order.id,
        reference: existingPayments[0].provider_reference,
        authorizationUrl: existingPayments[0].authorization_url,
        accessCode: existingPayments[0].provider_access_code,
      });
    }

    await supabaseFetch(`orders?id=eq.${encodeURIComponent(order.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ email }),
    });

    const providerReference = order.reference;

    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: order.total_kobo,
          currency: "NGN",
          reference: providerReference,
        }),
        cache: "no-store",
      },
    );

    const paystackBody = (await paystackResponse.json()) as {
      status?: boolean;
      message?: string;
      data?: {
        authorization_url?: string;
        access_code?: string;
        reference?: string;
      };
    };

    if (
      !paystackResponse.ok ||
      !paystackBody.status ||
      !paystackBody.data?.authorization_url ||
      !paystackBody.data.reference
    ) {
      throw new Error(
        paystackBody.message ?? "Unable to initialize Paystack transaction.",
      );
    }

    await supabaseFetch("payments", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        order_id: order.id,
        provider: "paystack",
        provider_reference: paystackBody.data.reference,
        amount_kobo: order.total_kobo,
        currency: "NGN",
        status: "Pending",
        provider_access_code: paystackBody.data.access_code ?? null,
        authorization_url: paystackBody.data.authorization_url,
      }),
    });

    return NextResponse.json({
      orderId: order.id,
      reference: paystackBody.data.reference,
      authorizationUrl: paystackBody.data.authorization_url,
      accessCode: paystackBody.data.access_code ?? null,
    });
  } catch (error) {
    console.error("Paystack initialization failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to initialize payment.",
      },
      { status: 500 },
    );
  }
}
