import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireConfig() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server configuration is missing.");
  }
}

async function supabaseFetch(path: string) {
  requireConfig();
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: serviceRoleKey!,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const text = await response.text();
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) {
    throw new Error(typeof body === "string" ? body : JSON.stringify(body));
  }
  return body;
}

export async function GET() {
  try {
    const [orders, items] = await Promise.all([
      supabaseFetch(
        "orders?select=id,reference,school_name,contact_name,phone,email,total_kobo,payment_status,supply_status,created_at,paid_at&order=created_at.desc",
      ),
      supabaseFetch(
        "order_items?select=id,order_id,product_name,class_name,unit_price_kobo,quantity,line_total_kobo&order=created_at.asc",
      ),
    ]);

    return NextResponse.json({ orders, items });
  } catch (error) {
    console.error("Admin orders request failed:", error);
    return NextResponse.json(
      { error: "Unable to load orders." },
      { status: 500 },
    );
  }
}
