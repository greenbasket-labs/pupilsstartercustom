import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireConfig() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server configuration is missing.");
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
    throw new Error(
      typeof body === "string" ? body : JSON.stringify(body),
    );
  }

  return body;
}

export async function GET() {
  try {
    const [classes, products, movements] = await Promise.all([
      supabaseFetch(
        "classes?select=id,name,is_active&is_active=eq.true&order=name.asc",
      ),
      supabaseFetch(
        "products?select=id,name,class_id,price_kobo,is_active&is_active=eq.true&order=name.asc",
      ),
      supabaseFetch(
        "stock_movements?select=product_id,kind,quantity",
      ),
    ]);

    const classRows = classes as Array<{
      id: string;
      name: string;
      is_active: boolean;
    }>;

    const classMap = new Map(classRows.map((item) => [item.id, item.name]));
    const totals = new Map<string, number>();

    for (const movement of movements as Array<{
      product_id: string;
      kind: string;
      quantity: number;
    }>) {
      let delta = 0;

      if (movement.kind === "received" || movement.kind === "incoming_received") {
        delta = movement.quantity;
      } else if (movement.kind === "adjustment") {
        delta = movement.quantity;
      } else if (movement.kind === "purchase") {
        delta = -movement.quantity;
      }

      totals.set(
        movement.product_id,
        (totals.get(movement.product_id) ?? 0) + delta,
      );
    }

    const catalogue = (products as Array<{
      id: string;
      name: string;
      class_id: string;
      price_kobo: number;
      is_active: boolean;
    }>)
      .filter((product) => classMap.has(product.class_id))
      .map((product) => ({
        id: product.id,
        name: product.name,
        className: classMap.get(product.class_id)!,
        priceKobo: product.price_kobo,
        available: Math.max(0, totals.get(product.id) ?? 0),
      }));

    return NextResponse.json({ products: catalogue });
  } catch (error) {
    console.error("Catalogue request failed:", error);
    return NextResponse.json(
      { error: "Unable to load the assessment-book catalogue." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      schoolName?: string;
      contactName?: string;
      phone?: string;
      email?: string;
      items?: Array<{ productId?: string; quantity?: number }>;
    };

    const items = (body.items ?? []).map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
    }));

    if (
      !body.schoolName?.trim() ||
      !body.contactName?.trim() ||
      !body.phone?.trim() ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: "School, contact, phone, and at least one item are required." },
        { status: 400 },
      );
    }

    requireConfig();

    const result = await supabaseFetch("rpc/create_customer_order", {
      method: "POST",
      body: JSON.stringify({
        p_school_name: body.schoolName,
        p_contact_name: body.contactName,
        p_phone: body.phone,
        p_email: body.email ?? "",
        p_items: items,
      }),
    });

    const order = Array.isArray(result) ? result[0] : result;

    if (!order?.reference || !order?.order_id || !order?.total_kobo) {
      throw new Error("Supabase returned an invalid order result.");
    }

    return NextResponse.json({
      orderId: order.order_id,
      reference: order.reference,
      totalKobo: order.total_kobo,
      paymentStatus: "Pending",
      supplyStatus: "Pending Supply",
    });
  } catch (error) {
    console.error("Order creation failed:", error);
    const message =
      error instanceof Error ? error.message : "Unable to create order.";

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
