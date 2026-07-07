import { NextRequest } from "next/server";
import { proxyAdminRequest } from "@/lib/admin-proxy";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyAdminRequest(req, `/api/deliveries/${id}`);
}
