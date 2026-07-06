import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIES } from "@/lib/auth-config";
import { fetchBackend } from "@/lib/backend-fetch";
import {
  type BackendAuthResponse,
  clearAuthCookies,
  getCookieHeader,
  setAuthCookies,
  toClientSession,
} from "@/lib/auth-cookies";

export async function GET(req: NextRequest) {
  const cookieHeader = getCookieHeader(req.cookies);
  const hasAccessToken = Boolean(req.cookies.get(AUTH_COOKIES.accessToken)?.value);
  const hasRefreshToken = Boolean(req.cookies.get(AUTH_COOKIES.refreshToken)?.value);

  if (!hasAccessToken && !hasRefreshToken) {
    return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  }

  if (!hasAccessToken && hasRefreshToken) {
    const refresh = await fetchBackend<BackendAuthResponse>("/api/auth/refresh", {
      method: "POST",
      headers: { Cookie: cookieHeader },
    });

    if (!refresh.ok) {
      const response = NextResponse.json(refresh.data, { status: refresh.status });
      return clearAuthCookies(response);
    }

    const response = NextResponse.json(toClientSession(refresh.data));
    return setAuthCookies(response, refresh.data);
  }

  const me = await fetchBackend<BackendAuthResponse>("/api/auth/me", {
    headers: { Cookie: cookieHeader },
  });

  if (!me.ok) {
    const response = NextResponse.json(me.data, { status: me.status });
    return clearAuthCookies(response);
  }

  return NextResponse.json(toClientSession(me.data));
}
