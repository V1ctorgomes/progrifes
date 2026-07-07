import { NextRequest } from "next/server";
import { proxyAdminRequest } from "@/lib/admin-proxy";

interface RouteContext {
  params: Promise<{ id: string; noteId: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { id, noteId } = await params;
  return proxyAdminRequest(req, `/api/customers/${id}/notes/${noteId}`);
}
