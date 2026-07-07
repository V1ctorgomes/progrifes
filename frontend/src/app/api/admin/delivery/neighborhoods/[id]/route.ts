import { NextRequest } from "next/server";
import { proxyAdminRequest } from "@/lib/admin-proxy";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyAdminRequest(req, `/api/delivery/neighborhoods/${id}`);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyAdminRequest(req, `/api/delivery/neighborhoods/${id}`);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyAdminRequest(req, `/api/delivery/neighborhoods/${id}`);
}
