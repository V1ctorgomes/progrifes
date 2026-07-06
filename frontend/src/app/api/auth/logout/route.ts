import { NextRequest, NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend-fetch";
import { clearAuthCookies, getCookieHeader } from "@/lib/auth-cookies";

export async function POST(req: NextRequest) {
  const cookieHeader = getCookieHeader(req.cookies);

  const { ok, status, data } = await fetchBackend("/api/auth/logout", {
    method: "POST",
    headers: { Cookie: cookieHeader },
  });

  const response = NextResponse.json(data, { status: ok ? 200 : status });
  return clearAuthCookies(response);
}
