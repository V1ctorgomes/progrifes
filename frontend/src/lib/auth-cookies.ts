import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_MAX_AGE,
  AUTH_COOKIES,
  REFRESH_TOKEN_MAX_AGE,
  authCookieOptions,
} from "@/lib/auth-config";

interface BackendAuthResponse {
  user: {
    id: string;
    nome: string;
    email: string;
    cargo: string;
  };
  permissions: string[];
  accessToken?: string;
  refreshToken?: string;
}

export function setAuthCookies(
  response: NextResponse,
  data: BackendAuthResponse,
): NextResponse {
  if (data.accessToken) {
    response.cookies.set(AUTH_COOKIES.accessToken, data.accessToken, {
      ...authCookieOptions,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });
  }

  if (data.refreshToken) {
    response.cookies.set(AUTH_COOKIES.refreshToken, data.refreshToken, {
      ...authCookieOptions,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  }

  return response;
}

export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.set(AUTH_COOKIES.accessToken, "", {
    ...authCookieOptions,
    maxAge: 0,
  });
  response.cookies.set(AUTH_COOKIES.refreshToken, "", {
    ...authCookieOptions,
    maxAge: 0,
  });
  return response;
}

export function toClientSession(data: BackendAuthResponse) {
  return {
    user: data.user,
    permissions: data.permissions,
  };
}

export function getCookieHeader(
  cookies: { get: (name: string) => { value: string } | undefined },
): string {
  const parts: string[] = [];

  const access = cookies.get(AUTH_COOKIES.accessToken)?.value;
  const refresh = cookies.get(AUTH_COOKIES.refreshToken)?.value;

  if (access) {
    parts.push(`${AUTH_COOKIES.accessToken}=${access}`);
  }

  if (refresh) {
    parts.push(`${AUTH_COOKIES.refreshToken}=${refresh}`);
  }

  return parts.join("; ");
}
