import { NextResponse } from "next/server";

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function isAuthorized(field: "phone_e164" | "email", value: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server configuration is missing.");

  const table = field === "phone_e164" ? "admin_authorized_phones" : "admin_authorized_emails";
  const response = await fetch(
    `${url}/rest/v1/${table}?select=id&${field}=eq.${encodeURIComponent(value)}&is_active=eq.true&limit=1`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" },
  );
  if (!response.ok) throw new Error("Unable to check admin authorization.");
  const rows = (await response.json()) as Array<{ id: string }>;
  return rows.length > 0;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { method?: unknown; phone?: unknown; email?: unknown };
    const method = body.method === "email" ? "email" : "phone";
    const value = method === "email" ? normalize(body.email).toLowerCase() : normalize(body.phone);

    if (!value) {
      return NextResponse.json(
        { error: method === "email" ? "Enter the admin email address." : "Enter the admin phone number." },
        { status: 400 },
      );
    }

    const authorized = await isAuthorized(method === "email" ? "email" : "phone_e164", value);
    if (!authorized) {
      return NextResponse.json(
        { error: "This sign-in identity is not authorized for admin access." },
        { status: 403 },
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error("Supabase authentication configuration is missing.");

    const response = await fetch(`${url}/auth/v1/otp`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: method === "email"
        ? JSON.stringify({ email: value, create_user: true })
        : JSON.stringify({ phone: value, create_user: true }),
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
