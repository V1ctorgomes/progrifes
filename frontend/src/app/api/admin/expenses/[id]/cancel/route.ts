import { NextRequest } from "next/server";
import { proxyAdminRequest } from "@/lib/admin-proxy";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyAdminRequest(req, `/api/expenses/${id}/cancel`);
}
