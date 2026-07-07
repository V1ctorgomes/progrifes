import { NextRequest, NextResponse } from "next/server";
import { proxyAdminRequest } from "@/lib/admin-proxy";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.toString();
  const suffix = query ? `?${query}` : "";
  return proxyAdminRequest(req, `/api/orders/admin/all${suffix}`);
}
