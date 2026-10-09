import { NextResponse } from "next/server";
import { createHash, randomBytes, randomInt } from "node:crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireConfig() {
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase server configuration is missing.");
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
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) throw new Error(typeof body === "string" ? body : JSON.stringify(body));
  return body;
}

async function rpc(name: string, args: Record<string, unknown>) {
  return supabaseFetch(`rpc/${name}`, { method: "POST", body: JSON.stringify(args) });
}

function newAccessToken() {
  return randomBytes(32).toString("hex");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function newDeliveryCode() {
  return String(randomInt(100000, 1000000));
}

export async function GET() {
  try {
    const [persons, orders] = await Promise.all([
      supabaseFetch("supply_persons?select=id,name,phone,is_active,created_at,updated_at&order=name.asc"),
      supabaseFetch(
        "orders?select=id,reference,school_name,contact_name,phone,total_kobo,payment_status,supply_status,supply_person_id,delivery_code,created_at&payment_status=eq.Paid&supply_status=in.(Pending%20Supply,Assigned)&order=created_at.desc",
      ),
    ]);
    return NextResponse.json({ persons, orders });
  } catch (error) {
    console.error("Admin supply request failed:", error);
    return NextResponse.json({ error: "Unable to load supply data." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: string;
      name?: string;
      phone?: string;
      personId?: string;
      orderId?: string;
      isActive?: boolean;
    };

    if (body.action === "create_person") {
      const token = newAccessToken();
      const personResult = await rpc("admin_create_supply_person", {
        p_name: body.name ?? "",
        p_phone: body.phone ?? "",
        p_access_token_hash: hashToken(token),
      });
      const person = Array.isArray(personResult) ? personResult[0] : personResult;
      const origin = new URL(request.url).origin;
      return NextResponse.json({
        person,
        accessUrl: `${origin}/supply/access?token=${token}`,
      });
    }

    if (body.action === "set_person_active") {
      return NextResponse.json({
        person: await rpc("admin_set_supply_person_active", {
          p_id: body.personId,
          p_is_active: body.isActive === true,
        }),
      });
    }

    if (body.action === "assign") {
      const orderId = body.orderId;
      const personId = body.personId;
      if (!orderId || !personId) {
        return NextResponse.json({ error: "Order and supply person are required." }, { status: 400 });
      }
      const order = await rpc("admin_assign_supply_person", {
        p_order_id: orderId,
        p_supply_person_id: personId,
        p_delivery_code: newDeliveryCode(),
      });
      return NextResponse.json({ order: Array.isArray(order) ? order[0] : order });
    }

    if (body.action === "mark_delivered") {
      return NextResponse.json({
        order: await rpc("admin_mark_order_supplied", { p_order_id: body.orderId }),
      });
    }

    return NextResponse.json({ error: "Unknown supply action." }, { status: 400 });
  } catch (error) {
    console.error("Admin supply action failed:", error);
    return NextResponse.json(
      { error: "Unable to save supply data." },
      { status: 400 },
    );
  }
}
