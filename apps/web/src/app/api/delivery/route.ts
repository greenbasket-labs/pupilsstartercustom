import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function callRpc(name: string, args: Record<string, unknown>) {
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase server configuration is missing.");
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  const text = await response.text();
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) throw new Error(typeof body === "string" ? body : JSON.stringify(body));
  return Array.isArray(body) ? body[0] : body;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { reference?: string; deliveryCode?: string };
    if (!body.reference?.trim() || !body.deliveryCode?.trim()) {
      return NextResponse.json({ error: "Order reference and delivery code are required." }, { status: 400 });
    }
    const order = await callRpc("school_confirm_delivery_code", {
      p_reference: body.reference,
      p_delivery_code: body.deliveryCode,
    });
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to confirm delivery." },
      { status: 400 },
    );
  }
}
