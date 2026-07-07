import { NextRequest } from "next/server";
import { proxyAdminRequest } from "@/lib/admin-proxy";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.toString();
  const suffix = query ? `?${query}` : "";
  return proxyAdminRequest(req, `/api/accounts-payable${suffix}`);
}

export async function POST(req: NextRequest) {
  return proxyAdminRequest(req, "/api/accounts-payable");
}
