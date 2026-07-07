import { NextRequest, NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend-fetch";

export async function GET() {
  const result = await fetchBackend("/api/delivery/settings");
  return NextResponse.json(result.data, { status: result.status });
}
