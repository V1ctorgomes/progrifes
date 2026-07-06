import { NextRequest } from "next/server";
import { proxyAdminRequest } from "@/lib/admin-proxy";

interface RouteContext {
  params: Promise<{ valueId: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { valueId } = await params;
  return proxyAdminRequest(req, `/api/attributes/values/${valueId}`);
}
