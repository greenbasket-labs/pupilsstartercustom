import { NextResponse } from "next/server";

function normalizePhone(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function isAuthorizedPhone(phone: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server configuration is missing.");

  const response = await fetch(
    `${url}/rest/v1/admin_authorized_phones?select=id&phone_e164=eq.${encodeURIComponent(phone)}&is_active=eq.true&limit=1`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" },
  );
  if (!response.ok) throw new Error("Unable to check admin authorization.");
  const rows = (await response.json()) as Array<{ id: string }>;
  return rows.length > 0;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: unknown };
    const phone = normalizePhone(body.phone);

    if (!phone) return NextResponse.json({ error: "Enter the admin phone number." }, { status: 400 });
    if (!(await isAuthorizedPhone(phone))) {
      return NextResponse.json({ error: "This phone number is not authorized for admin access." }, { status: 403 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error("Supabase authentication configuration is missing.");

    const response = await fetch(`${url}/auth/v1/otp`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ phone, create_user: true }),
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as { msg?: string; message?: string } | null;
      return NextResponse.json(
        { error: error?.msg ?? error?.message ?? "Unable to send OTP." },
        { status: response.status },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin OTP request failed:", error);
    return NextResponse.json({ error: "Unable to start admin sign-in." }, { status: 500 });
  }
}
