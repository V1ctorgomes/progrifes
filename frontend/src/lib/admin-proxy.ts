import { NextRequest, NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend-fetch";
import { getCookieHeader } from "@/lib/auth-cookies";

export async function proxyAdminRequest(
  req: NextRequest,
  backendPath: string,
  init?: RequestInit,
) {
  const cookieHeader = getCookieHeader(req.cookies);
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const body = hasBody ? await req.text() : undefined;

  const result = await fetchBackend(backendPath, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
      ...init?.headers,
    },
    body: body || undefined,
  });

  return NextResponse.json(result.data, { status: result.status });
}
