import { NextResponse } from "next/server";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Development access is unavailable." }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("pupils-start-dev-admin", "local-development-admin", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
