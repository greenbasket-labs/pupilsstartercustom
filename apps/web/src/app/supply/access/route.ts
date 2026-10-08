import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!token || !supabaseUrl || !serviceRoleKey) {
    return NextResponse.redirect(new URL("/supply?error=invalid-access", request.url));
  }

  const hash = createHash("sha256").update(token).digest("hex");
  const response = await fetch(
    `${supabaseUrl}/rest/v1/supply_persons?select=id&access_token_hash=eq.${encodeURIComponent(hash)}&is_active=eq.true&limit=1`,
    { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` }, cache: "no-store" },
  );

  if (!response.ok || ((await response.json()) as unknown[]).length === 0) {
    return NextResponse.redirect(new URL("/supply?error=invalid-access", request.url));
  }

  const result = NextResponse.redirect(new URL("/supply", request.url));
  result.cookies.set("pupils-start-supply-access", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return result;
}
