import { NextRequest, NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend-fetch";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const result = await fetchBackend("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  return NextResponse.json(result.data, { status: result.status });
}
