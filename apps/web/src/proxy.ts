import { NextRequest, NextResponse } from "next/server";

async function isAuthorizedAdmin(request: NextRequest) {
  const accessToken = request.cookies.get("pupils-start-access")?.value;
  if (!accessToken) return false;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !publishableKey || !serviceRoleKey) return false;

  const userResponse = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: publishableKey, Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!userResponse.ok) return false;

  const user = (await userResponse.json()) as { phone?: string };
  if (!user.phone) return false;

  const adminResponse = await fetch(
    `${url}/rest/v1/admin_authorized_phones?select=id&phone_e164=eq.${encodeURIComponent(user.phone)}&is_active=eq.true&limit=1`,
    {
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
      cache: "no-store",
    },
  );

  if (!adminResponse.ok) return false;
  const rows = (await adminResponse.json()) as Array<{ id: string }>;
  return rows.length > 0;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/" || pathname.startsWith("/api/admin/")) {
    try {
      if (await isAuthorizedAdmin(request)) return NextResponse.next();
    } catch {
      // Fail closed: an auth/configuration failure must not expose the admin workspace.
    }

    if (pathname.startsWith("/api/admin/")) {
      return NextResponse.json({ error: "Admin authorization required." }, { status: 401 });
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/api/admin/:path*"],
};
