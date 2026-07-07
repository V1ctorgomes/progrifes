import { NextRequest } from "next/server";
import { proxyAdminRequest } from "@/lib/admin-proxy";

interface RouteContext {
  params: Promise<{ id: string; tagId: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { id, tagId } = await params;
  return proxyAdminRequest(req, `/api/customers/${id}/tags/${tagId}`);
}
