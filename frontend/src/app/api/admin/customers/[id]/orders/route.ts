import { NextRequest } from "next/server";
import { proxyAdminRequest } from "@/lib/admin-proxy";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const query = req.nextUrl.searchParams.toString();
  const suffix = query ? `?${query}` : "";
  return proxyAdminRequest(req, `/api/customers/${id}/orders${suffix}`);
}
