import { NextRequest } from "next/server";
import { proxyAdminRequest } from "@/lib/admin-proxy";

interface RouteContext {
  params: Promise<{ id: string; addressId: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id, addressId } = await params;
  return proxyAdminRequest(req, `/api/customers/${id}/addresses/${addressId}/principal`);
}
