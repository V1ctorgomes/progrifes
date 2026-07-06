import { NextRequest } from "next/server";
import { proxyAdminRequest } from "@/lib/admin-proxy";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyAdminRequest(req, `/api/products/${id}`);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyAdminRequest(req, `/api/products/${id}`);
}
