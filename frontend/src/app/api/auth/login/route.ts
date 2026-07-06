import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/auth-config";
import {
  getCookieHeader,
  setAuthCookies,
  toClientSession,
} from "@/lib/auth-cookies";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const backendRes = await fetch(`${getBackendUrl()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await backendRes.json();

  if (!backendRes.ok) {
    return NextResponse.json(data, { status: backendRes.status });
  }

  const response = NextResponse.json(toClientSession(data));
  return setAuthCookies(response, data);
}
