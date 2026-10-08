import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("pupils-start-access", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  response.cookies.set("pupils-start-refresh", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
