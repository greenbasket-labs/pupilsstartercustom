import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supabaseFetch(path: string) {
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase server configuration is missing.");
  const response = await fetch(supabaseUrl + "/rest/v1/" + path, {
    headers: { apikey: serviceRoleKey, Authorization: "Bearer " + serviceRoleKey, "Content-Type": "application/json" }, cache: "no-store",
  });
  const text = await response.text();
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) throw new Error(typeof body === "string" ? body : JSON.stringify(body));
  return body;
}

export async function GET() {
  try {
    const orders = await supabaseFetch("orders?select=id,reference,school_name,contact_name,phone,total_kobo,payment_status,supply_status,created_at&order=created_at.desc");
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Customer history request failed:", error);
    return NextResponse.json({ error: "Unable to load customer history." }, { status: 500 });
  }
}
