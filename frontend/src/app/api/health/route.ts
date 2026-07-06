import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/auth-config";
import { fetchBackend } from "@/lib/backend-fetch";

export async function GET() {
  const health = await fetchBackend("/api/health");

  return NextResponse.json(
    {
      frontend: "ok",
      backendUrl: getBackendUrl(),
      backend: health.ok ? health.data : { status: "offline", ...health.data },
    },
    { status: health.ok ? 200 : 503 },
  );
}
