import { NextRequest, NextResponse } from "next/server";

async function verifyAdmin(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !publishableKey || !serviceRoleKey) return null;

  const userResponse = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: publishableKey, Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!userResponse.ok) return null;

  const user = (await userResponse.json()) as { phone?: string };
  if (!user.phone) return null;

  const adminResponse = await fetch(
    `${url}/rest/v1/admin_authorized_phones?select=id&phone_e164=eq.${encodeURIComponent(user.phone)}&is_active=eq.true&limit=1`,
    {
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
      cache: "no-store",
    },
  );
  if (!adminResponse.ok) return null;

  const rows = (await adminResponse.json()) as Array<{ id: string }>;
  return rows.length > 0 ? user.phone : null;
}

async function refreshAccessToken(refreshToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;

  const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: publishableKey, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  });

  if (!response.ok) return null;
  return (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
  };
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname !== "/" && !pathname.startsWith("/api/admin/")) {
    return NextResponse.next();
  }

  try {
    let accessToken = request.cookies.get("pupils-start-access")?.value;
    let refreshed: { access_token: string; refresh_token: string; expires_in?: number } | null = null;

    if (accessToken) {
      if (await verifyAdmin(accessToken)) return NextResponse.next();
    }

    const refreshToken = request.cookies.get("pupils-start-refresh")?.value;
    if (refreshToken) {
      refreshed = await refreshAccessToken(refreshToken);
      if (refreshed && (await verifyAdmin(refreshed.access_token))) {
        const response = NextResponse.next();
        response.cookies.set("pupils-start-access", refreshed.access_token, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: Math.max(60, refreshed.expires_in ?? 3600),
        });
        response.cookies.set("pupils-start-refresh", refreshed.refresh_token, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        });
        return response;
      }
    }

    if (pathname.startsWith("/api/admin/")) {
      return NextResponse.json({ error: "Admin authorization required." }, { status: 401 });
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  } catch {
    if (pathname.startsWith("/api/admin/")) {
      return NextResponse.json({ error: "Admin authorization required." }, { status: 401 });
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/", "/api/admin/:path*"],
};
