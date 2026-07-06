import { NextResponse } from "next/server";
import { fetchBackend } from "@/lib/backend-fetch";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const { slug } = await params;
  const result = await fetchBackend(`/api/categories/slug/${slug}`);
  return NextResponse.json(result.data, { status: result.status });
}
