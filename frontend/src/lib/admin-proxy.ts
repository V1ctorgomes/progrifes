import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIES } from "@/lib/auth-config";
import { fetchBackend } from "@/lib/backend-fetch";
import {
  type BackendAuthResponse,
  getCookieHeader,
  setAuthCookies,
} from "@/lib/auth-cookies";

function cookieHeaderFromTokens(accessToken?: string, refreshToken?: string) {
  const parts: string[] = [];
  if (accessToken) parts.push(`${AUTH_COOKIES.accessToken}=${accessToken}`);
  if (refreshToken) parts.push(`${AUTH_COOKIES.refreshToken}=${refreshToken}`);
  return parts.join("; ");
}

export async function proxyAdminRequest(
  req: NextRequest,
  backendPath: string,
  init?: RequestInit,
) {
  const cookieHeader = getCookieHeader(req.cookies);
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const body = hasBody ? await req.text() : undefined;

  const requestInit: RequestInit = {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
      ...init?.headers,
    },
    body: body || undefined,
  };

  let result = await fetchBackend(backendPath, requestInit);

  const hasRefresh = Boolean(req.cookies.get(AUTH_COOKIES.refreshToken)?.value);

  if (result.status === 401 && hasRefresh) {
    const refresh = await fetchBackend<BackendAuthResponse>("/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
    });

    if (refresh.ok && refresh.data.accessToken) {
      const refreshedCookies = cookieHeaderFromTokens(
        refresh.data.accessToken,
        refresh.data.refreshToken ?? req.cookies.get(AUTH_COOKIES.refreshToken)?.value,
      );

      result = await fetchBackend(backendPath, {
        ...requestInit,
        headers: {
          ...(requestInit.headers as Record<string, string>),
          Cookie: refreshedCookies,
        },
      });

      const response = NextResponse.json(result.data, { status: result.status });
      return setAuthCookies(response, refresh.data);
    }
  }

  return NextResponse.json(result.data, { status: result.status });
}
