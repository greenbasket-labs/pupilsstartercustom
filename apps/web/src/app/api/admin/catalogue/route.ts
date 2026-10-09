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
    throw new Error(typeof body === "string" ? body : JSON.stringify(body));
  }

  return body;
}

async function callAdminRpc(name: string, args: Record<string, unknown>) {
  return supabaseFetch(`rpc/${name}`, {
    method: "POST",
    body: JSON.stringify(args),
  });
}

export async function GET() {
  try {
    const [classes, products, movements] = await Promise.all([
      supabaseFetch(
        "classes?select=id,name,is_active,created_at,updated_at&order=name.asc",
      ),
      supabaseFetch(
        "products?select=id,name,class_id,price_kobo,is_active,created_at,updated_at&order=name.asc",
      ),
      supabaseFetch(
        "stock_movements?select=id,product_id,kind,quantity,note,order_id,created_at&order=created_at.desc",
      ),
    ]);

    return NextResponse.json({ classes, products, movements });
  } catch (error) {
    console.error("Admin catalogue request failed:", error);
    return NextResponse.json(
      { error: "Unable to load admin catalogue and inventory." },
      { status: 500 },
    );
  }
}

type AdminAction =
  | { action: "create_class"; name: string }
  | { action: "update_class"; id: string; name: string }
  | { action: "set_class_active"; id: string; isActive: boolean }
  | { action: "delete_class"; id: string }
  | { action: "create_product"; name: string; classId: string; priceKobo: number }
  | {
      action: "update_product";
      id: string;
      name: string;
      classId: string;
      priceKobo: number;
    }
  | { action: "set_product_active"; id: string; isActive: boolean }
  | { action: "delete_product"; id: string }
  | {
      action: "record_stock";
      productId: string;
      kind: "received" | "incoming" | "incoming_received" | "adjustment";
      quantity: number;
      note?: string;
    };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AdminAction;

    switch (body.action) {
      case "create_class":
        return NextResponse.json({
          class: await callAdminRpc("admin_create_class", {
            p_name: body.name,
          }),
        });

      case "update_class":
        return NextResponse.json({
          class: await callAdminRpc("admin_update_class", {
            p_id: body.id,
            p_name: body.name,
          }),
        });

      case "set_class_active":
        return NextResponse.json({
          class: await callAdminRpc("admin_set_class_active", {
            p_id: body.id,
            p_is_active: body.isActive,
          }),
        });

      case "delete_class":
        await callAdminRpc("admin_delete_class", { p_id: body.id });
        return NextResponse.json({ ok: true });

      case "create_product":
        return NextResponse.json({
          product: await callAdminRpc("admin_create_product", {
            p_name: body.name,
            p_class_id: body.classId,
            p_price_kobo: body.priceKobo,
          }),
        });

      case "update_product":
        return NextResponse.json({
          product: await callAdminRpc("admin_update_product", {
            p_id: body.id,
            p_name: body.name,
            p_class_id: body.classId,
            p_price_kobo: body.priceKobo,
          }),
        });

      case "set_product_active":
        return NextResponse.json({
          product: await callAdminRpc("admin_set_product_active", {
            p_id: body.id,
            p_is_active: body.isActive,
          }),
        });

      case "delete_product":
        await callAdminRpc("admin_delete_product", { p_id: body.id });
        return NextResponse.json({ ok: true });

      case "record_stock":
        return NextResponse.json({
          movement: await callAdminRpc("admin_record_stock_movement", {
            p_product_id: body.productId,
            p_kind: body.kind,
            p_quantity: body.quantity,
            p_note: body.note ?? null,
          }),
        });

      default:
        return NextResponse.json({ error: "Unknown admin action." }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin catalogue action failed:", error);
    return NextResponse.json({ error: "Unable to save admin data." }, { status: 400 });
  }
}