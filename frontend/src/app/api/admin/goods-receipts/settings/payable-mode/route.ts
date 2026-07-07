import { NextRequest } from "next/server";
import { proxyAdminRequest } from "@/lib/admin-proxy";

export async function GET(req: NextRequest) {
  return proxyAdminRequest(req, "/api/goods-receipts/settings/payable-mode");
}

export async function PUT(req: NextRequest) {
  return proxyAdminRequest(req, "/api/goods-receipts/settings/payable-mode");
}
