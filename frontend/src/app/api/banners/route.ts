import { NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend-fetch";

export async function GET() {
  const result = await fetchBackend("/api/banners");
  return NextResponse.json(result.data, { status: result.status });
}
