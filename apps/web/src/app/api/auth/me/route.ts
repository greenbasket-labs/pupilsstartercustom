import { NextResponse } from "next/server";

async function getUser(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase authentication configuration is missing.");

  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: key, Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  return (await response.json()) as { id: string; phone?: string };
}

async function getAdmin(phone: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server configuration is missing.");

  const response = await fetch(
    `${url}/rest/v1/admin_authorized_phones?select=id,display_name&phone_e164=eq.${encodeURIComponent(phone)}&is_active=eq.true&limit=1`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" },
  );
  if (!response.ok) throw new Error("Unable to check admin authorization.");
  const rows = (await response.json()) as Array<{ id: string; display_name: string | null }>;
  return rows[0] ?? null;
}

export async function GET(request: Request) {
  try {
    const cookie = request.headers.get("cookie") ?? "";
    const match = cookie.match(/(?:^|;\s*)pupils-start-access=([^;]+)/);
    if (!match) return NextResponse.json({ authenticated: false }, { status: 401 });

    const user = await getUser(decodeURIComponent(match[1]));
    if (!user?.phone) return NextResponse.json({ authenticated: false }, { status: 401 });

    const admin = await getAdmin(user.phone);
    if (!admin) return NextResponse.json({ authenticated: false }, { status: 403 });

    return NextResponse.json({
      authenticated: true,
      userId: user.id,
      phone: user.phone,
      displayName: admin.display_name,
    });
  } catch (error) {
    console.error("Admin session check failed:", error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
