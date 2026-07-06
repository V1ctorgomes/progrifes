import { NextRequest, NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend-fetch";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.toString();
  const suffix = query ? `?${query}` : "";
  const result = await fetchBackend(`/api/products${suffix}`);
  return NextResponse.json(result.data, { status: result.status });
}
