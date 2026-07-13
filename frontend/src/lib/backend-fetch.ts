import { getBackendUrl } from "@/lib/auth-config";

interface BackendResult<T = Record<string, unknown>> {
  ok: boolean;
  status: number;
  data: T;
}

/** Evita hang infinito após hibernação / conexão morta. */
const BACKEND_TIMEOUT_MS = 15_000;

export async function fetchBackend<T = Record<string, unknown>>(
  path: string,
  options?: RequestInit,
): Promise<BackendResult<T>> {
  const backendUrl = getBackendUrl().replace(/\/$/, "");

  try {
    const response = await fetch(`${backendUrl}${path}`, {
      ...options,
      signal: options?.signal ?? AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const data = (await response.json()) as T;
      return { ok: response.ok, status: response.status, data };
    }

    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      data: {
        message: text || "Resposta inválida da API",
      } as T,
    };
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");

    return {
      ok: false,
      status: timedOut ? 504 : 503,
      data: {
        message: timedOut
          ? "A API demorou demais para responder. Tente novamente."
          : "Não foi possível conectar à API. Verifique se o backend está online e se BACKEND_URL está configurado no frontend.",
        backendUrl,
      } as T,
    };
  }
}
