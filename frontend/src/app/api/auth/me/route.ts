import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIES, getBackendUrl } from "@/lib/auth-config";
import { clearAuthCookies, getCookieHeader } from "@/lib/auth-cookies";

export async function GET(req: NextRequest) {
  const cookieHeader = getCookieHeader(req.cookies);

  if (!req.cookies.get(AUTH_COOKIES.accessToken)?.value) {
    const refreshToken = req.cookies.get(AUTH_COOKIES.refreshToken)?.value;

    if (refreshToken) {
      const refreshRes = await fetch(`${getBackendUrl()}/api/auth/refresh`, {
        method: "POST",
        headers: { Cookie: cookieHeader },
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const response = NextResponse.json({
          user: refreshData.user,
          permissions: refreshData.permissions,
        });

        if (refreshData.accessToken) {
          response.cookies.set(AUTH_COOKIES.accessToken, refreshData.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 15 * 60,
          });
        }

        if (refreshData.refreshToken) {
          response.cookies.set(AUTH_COOKIES.refreshToken, refreshData.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60,
          });
        }

        return response;
      }
    }

    return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  }

  const backendRes = await fetch(`${getBackendUrl()}/api/auth/me`, {
    headers: { Cookie: cookieHeader },
  });

  const data = await backendRes.json();

  if (!backendRes.ok) {
    const response = NextResponse.json(data, { status: backendRes.status });
    return clearAuthCookies(response);
  }

  return NextResponse.json(data);
}
