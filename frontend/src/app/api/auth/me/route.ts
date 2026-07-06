import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIES } from "@/lib/auth-config";
import { fetchBackend } from "@/lib/backend-fetch";
import { clearAuthCookies, getCookieHeader } from "@/lib/auth-cookies";

export async function GET(req: NextRequest) {
  const cookieHeader = getCookieHeader(req.cookies);
  const hasAccessToken = Boolean(req.cookies.get(AUTH_COOKIES.accessToken)?.value);
  const hasRefreshToken = Boolean(req.cookies.get(AUTH_COOKIES.refreshToken)?.value);

  if (!hasAccessToken && !hasRefreshToken) {
    return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  }

  if (!hasAccessToken && hasRefreshToken) {
    const refresh = await fetchBackend("/api/auth/refresh", {
      method: "POST",
      headers: { Cookie: cookieHeader },
    });

    if (!refresh.ok) {
      const response = NextResponse.json(refresh.data, { status: refresh.status });
      return clearAuthCookies(response);
    }

    const response = NextResponse.json({
      user: refresh.data.user,
      permissions: refresh.data.permissions,
    });

    if (refresh.data.accessToken) {
      response.cookies.set(AUTH_COOKIES.accessToken, refresh.data.accessToken as string, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60,
      });
    }

    if (refresh.data.refreshToken) {
      response.cookies.set(AUTH_COOKIES.refreshToken, refresh.data.refreshToken as string, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    return response;
  }

  const me = await fetchBackend("/api/auth/me", {
    headers: { Cookie: cookieHeader },
  });

  if (!me.ok) {
    const response = NextResponse.json(me.data, { status: me.status });
    return clearAuthCookies(response);
  }

  return NextResponse.json(me.data);
}
