import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/auth-config";
import {
  clearAuthCookies,
  getCookieHeader,
  setAuthCookies,
  toClientSession,
} from "@/lib/auth-cookies";

export async function POST(req: NextRequest) {
  const cookieHeader = getCookieHeader(req.cookies);

  const backendRes = await fetch(`${getBackendUrl()}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
  });

  const data = await backendRes.json();

  if (!backendRes.ok) {
    const response = NextResponse.json(data, { status: backendRes.status });
    return clearAuthCookies(response);
  }

  const response = NextResponse.json(toClientSession(data));
  return setAuthCookies(response, data);
}
