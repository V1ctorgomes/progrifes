import { NextRequest } from "next/server";
import { proxyAdminRequest } from "@/lib/admin-proxy";

function withQuery(req: NextRequest, path: string) {
  const query = req.nextUrl.searchParams.toString();
  const suffix = query ? `?${query}` : "";
  return proxyAdminRequest(req, `${path}${suffix}`);
}

export async function GET(req: NextRequest) {
  return withQuery(req, "/api/delivery-persons");
}

export async function POST(req: NextRequest) {
  return proxyAdminRequest(req, "/api/delivery-persons");
}
