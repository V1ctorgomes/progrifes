import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIES } from "@/lib/auth-config";

const publicAdminPaths = ["/admin/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const isPublicAdminPath = publicAdminPaths.some((path) => pathname.startsWith(path));
  const hasAccessToken = Boolean(request.cookies.get(AUTH_COOKIES.accessToken)?.value);
  const hasRefreshToken = Boolean(request.cookies.get(AUTH_COOKIES.refreshToken)?.value);
  const isAuthenticated = hasAccessToken || hasRefreshToken;

  if (isPublicAdminPath && isAuthenticated) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (!isPublicAdminPath && !isAuthenticated) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
