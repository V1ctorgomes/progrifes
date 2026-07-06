import { NextRequest, NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend-fetch";
import {
  type BackendAuthResponse,
  setAuthCookies,
  toClientSession,
} from "@/lib/auth-cookies";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { ok, status, data } = await fetchBackend<BackendAuthResponse>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!ok) {
    return NextResponse.json(data, { status });
  }

  const response = NextResponse.json(toClientSession(data));
  return setAuthCookies(response, data);
}
