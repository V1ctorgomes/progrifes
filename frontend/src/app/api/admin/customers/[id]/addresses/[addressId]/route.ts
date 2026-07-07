import { NextRequest } from "next/server";
import { proxyAdminRequest } from "@/lib/admin-proxy";

interface RouteContext {
  params: Promise<{ id: string; addressId: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { id, addressId } = await params;
  return proxyAdminRequest(req, `/api/customers/${id}/addresses/${addressId}`);
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { id, addressId } = await params;
  return proxyAdminRequest(req, `/api/customers/${id}/addresses/${addressId}`);
}
