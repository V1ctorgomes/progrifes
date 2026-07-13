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

function cookieHeaderFromTokens(accessToken?: string, refreshToken?: string) {
  const parts: string[] = [];
  if (accessToken) parts.push(`${AUTH_COOKIES.accessToken}=${accessToken}`);
  if (refreshToken) parts.push(`${AUTH_COOKIES.refreshToken}=${refreshToken}`);
  return parts.join("; ");
}

export async function GET(req: NextRequest) {
  const cookieHeader = getCookieHeader(req.cookies);
  const hasAccessToken = Boolean(req.cookies.get(AUTH_COOKIES.accessToken)?.value);
  const hasRefreshToken = Boolean(req.cookies.get(AUTH_COOKIES.refreshToken)?.value);
  const existingRefresh = req.cookies.get(AUTH_COOKIES.refreshToken)?.value;

  if (!hasAccessToken && !hasRefreshToken) {
    return NextResponse.json({ user: null, permissions: [] });
  }

  async function refreshAndGetMe(currentCookieHeader: string) {
    const refresh = await fetchBackend<BackendAuthResponse>("/api/auth/refresh", {
      method: "POST",
      headers: { Cookie: currentCookieHeader },
    });

    if (!refresh.ok || !refresh.data.accessToken) {
      const response = NextResponse.json(refresh.data, { status: refresh.status });
      return clearAuthCookies(response);
    }

    const refreshedCookies = cookieHeaderFromTokens(
      refresh.data.accessToken,
      refresh.data.refreshToken ?? existingRefresh,
    );

    const me = await fetchBackend<BackendAuthResponse>("/api/auth/me", {
      headers: { Cookie: refreshedCookies },
    });

    if (!me.ok) {
      const response = NextResponse.json(me.data, { status: me.status });
      return clearAuthCookies(response);
    }

    const response = NextResponse.json(toClientSession(me.data));
    return setAuthCookies(response, refresh.data);
  }

  if (!hasAccessToken && hasRefreshToken) {
    return refreshAndGetMe(cookieHeader);
  }

  const me = await fetchBackend<BackendAuthResponse>("/api/auth/me", {
    headers: { Cookie: cookieHeader },
  });

  if (me.ok) {
    return NextResponse.json(toClientSession(me.data));
  }

  // Access expirado/inválido: tenta refresh antes de derrubar a sessão
  if (hasRefreshToken && (me.status === 401 || me.status === 403)) {
    return refreshAndGetMe(cookieHeader);
  }

  const response = NextResponse.json(me.data, { status: me.status });
  return clearAuthCookies(response);
}
