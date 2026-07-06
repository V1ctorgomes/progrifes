import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/auth-config";
import { clearAuthCookies, getCookieHeader } from "@/lib/auth-cookies";

export async function POST(req: NextRequest) {
  const cookieHeader = getCookieHeader(req.cookies);

  const backendRes = await fetch(`${getBackendUrl()}/api/auth/logout`, {
    method: "POST",
    headers: {
      Cookie: cookieHeader,
    },
  });

  const data = await backendRes.json().catch(() => ({ message: "Logout realizado" }));
  const response = NextResponse.json(data, { status: backendRes.ok ? 200 : backendRes.status });
  return clearAuthCookies(response);
}
