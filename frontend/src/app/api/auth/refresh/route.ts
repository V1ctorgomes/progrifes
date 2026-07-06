import { NextRequest, NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend-fetch";
import {
  type BackendAuthResponse,
  clearAuthCookies,
  getCookieHeader,
  setAuthCookies,
  toClientSession,
} from "@/lib/auth-cookies";

export async function POST(req: NextRequest) {
  const cookieHeader = getCookieHeader(req.cookies);

  if (!cookieHeader) {
    return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  }

  const { ok, status, data } = await fetchBackend<BackendAuthResponse>("/api/auth/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
  });

  if (!ok) {
    const response = NextResponse.json(data, { status });
    return clearAuthCookies(response);
  }

  const response = NextResponse.json(toClientSession(data));
  return setAuthCookies(response, data);
}
