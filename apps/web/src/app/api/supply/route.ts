import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const COOKIE = "pupils-start-supply-access";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function rpc(name: string, args: Record<string, unknown>) {
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
  return body;
}

function getToken(request: NextRequest) {
  return request.cookies.get(COOKIE)?.value ?? "";
}

export async function GET(request: NextRequest) {
  try {
    const token = getToken(request);
    if (!token) return NextResponse.json({ error: "Supply access required." }, { status: 401 });
    const tokenHash = hashToken(token);
    const [orders, supplyPersonName] = await Promise.all([
      rpc("supply_person_orders_with_identity", { p_access_token_hash: tokenHash }),
      rpc("supply_person_identity", { p_access_token_hash: tokenHash }),
    ]);
    return NextResponse.json({ supplyPersonName, orders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load assigned orders." }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getToken(request);
    if (!token) return NextResponse.json({ error: "Supply access required." }, { status: 401 });
    const body = (await request.json()) as { orderId?: string; purchaseCode?: string };
    if (body.purchaseCode?.trim()) {
      const order = await rpc("supply_person_confirm_purchase_code", {
        p_access_token_hash: hashToken(token),
        p_reference: body.purchaseCode,
      });
      return NextResponse.json({ order: Array.isArray(order) ? order[0] : order });
    }
    const order = await rpc("supply_person_mark_delivered", {
      p_access_token_hash: hashToken(token),
      p_order_id: body.orderId,
    });
    return NextResponse.json({ order: Array.isArray(order) ? order[0] : order });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to mark delivery." }, { status: 400 });
  }
}

export const supplyCookieName = COOKIE;
