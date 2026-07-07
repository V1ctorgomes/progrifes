import { NextRequest } from "next/server";
import { proxyAdminRequest } from "@/lib/admin-proxy";

interface RouteContext {
  params: Promise<{ variantId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { variantId } = await params;
  return proxyAdminRequest(req, `/api/inventory/${variantId}`);
}
