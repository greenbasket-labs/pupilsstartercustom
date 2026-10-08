import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireConfig() {
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase server configuration is missing.");
}

async function supabaseFetch(path: string) {
  requireConfig();
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: { apikey: serviceRoleKey!, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  const text = await response.text();
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) throw new Error(typeof body === "string" ? body : JSON.stringify(body));
  return body;
}

export async function GET() {
  try {
    const [orders, products, movements] = await Promise.all([
      supabaseFetch("orders?select=id,total_kobo,payment_status,supply_status"),
      supabaseFetch("products?select=id,is_active"),
      supabaseFetch("stock_movements?select=product_id,kind,quantity"),
    ]);

    const orderRows = orders as Array<{ id:string; total_kobo:number; payment_status:string; supply_status:string }>;
    const productRows = products as Array<{ id:string; is_active:boolean }>;
    const movementRows = movements as Array<{ product_id:string; kind:string; quantity:number }>;

    let availableStock = 0;
    let incomingStock = 0;
    for (const movement of movementRows) {
      if (movement.kind === "received" || movement.kind === "incoming_received" || movement.kind === "adjustment") {
        availableStock += movement.quantity;
      } else if (movement.kind === "incoming") {
        incomingStock += movement.quantity;
      } else if (movement.kind === "purchase") {
        availableStock -= movement.quantity;
      }
    }

    const paidOrders = orderRows.filter(order => order.payment_status === "Paid");
    const pendingSupply = paidOrders.filter(order => order.supply_status !== "Supplied");
    const supplied = paidOrders.filter(order => order.supply_status === "Supplied");
    const totalSalesKobo = paidOrders.reduce((sum, order) => sum + order.total_kobo, 0);

    return NextResponse.json({
      orders: { total: orderRows.length, paid: paidOrders.length, pendingSupply: pendingSupply.length, supplied: supplied.length, totalSalesKobo },
      inventory: { available: availableStock, incoming: incomingStock, activeProducts: productRows.filter(product => product.is_active).length },
    });
  } catch (error) {
    console.error("Admin overview request failed:", error);
    return NextResponse.json({ error: "Unable to load admin overview." }, { status: 500 });
  }
}
