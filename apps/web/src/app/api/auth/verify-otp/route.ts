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
    const body = (await request.json()) as {
      method?: unknown;
      phone?: unknown;
      email?: unknown;
      token?: unknown;
    };

    const method = body.method === "email" ? "email" : "phone";
    const value = method === "email" ? normalize(body.email).toLowerCase() : normalize(body.phone);
    const token = normalize(body.token);

    if (!value || !token) {
      return NextResponse.json({ error: "Sign-in identity and OTP are required." }, { status: 400 });
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

    const response = await fetch(`${url}/auth/v1/token?grant_type=otp`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: method === "email"
        ? JSON.stringify({ email: value, token, type: "email" })
        : JSON.stringify({ phone: value, token, type: "sms" }),
    });

    const result = (await response.json().catch(() => null)) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      user?: { id?: string; phone?: string; email?: string };
      msg?: string;
      message?: string;
    } | null;

    if (!response.ok || !result?.access_token || !result.refresh_token) {
      return NextResponse.json(
        { error: result?.msg ?? result?.message ?? "Invalid or expired OTP." },
        { status: response.status || 401 },
      );
    }

    const identityMatches =
      method === "email" ? result.user?.email === value : result.user?.phone === value;

    if (!result.user?.id || !identityMatches) {
      return NextResponse.json({ error: "Admin identity could not be verified." }, { status: 403 });
    }

    const next = NextResponse.json({ ok: true });
    next.cookies.set("pupils-start-access", result.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Math.max(60, result.expires_in ?? 3600),
    });
    next.cookies.set("pupils-start-refresh", result.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return next;
  } catch (error) {
    console.error("Admin OTP verification failed:", error);
    return NextResponse.json({ error: "Unable to complete admin sign-in." }, { status: 500 });
  }
}
