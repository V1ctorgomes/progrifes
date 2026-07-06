import { NextRequest } from "next/server";
import { proxyAdminRequest } from "@/lib/admin-proxy";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return proxyAdminRequest(req, `/api/attributes/${id}`);
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return proxyAdminRequest(req, `/api/attributes/${id}`);
}
