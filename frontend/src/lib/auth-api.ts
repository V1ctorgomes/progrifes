import axios, { isAxiosError } from "axios";
import type { AuthSession, AuthUser, LoginCredentials } from "@/types/auth";

const api = axios.create({
  baseURL: "/api/auth",
  withCredentials: true,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) {
      return message[0] ?? "Erro na requisição";
    }
    if (typeof message === "string") {
      return message;
    }
    if (error.response?.status === 503 || error.response?.status === 502) {
      return "API indisponível. Verifique se o backend está online e se BACKEND_URL está configurado no frontend.";
    }
  }

  return "Não foi possível completar a requisição";
}

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  try {
    const { data } = await api.post<AuthSession>("/login", credentials);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function logout(): Promise<void> {
  await api.post("/logout");
}

export async function refreshSession(): Promise<AuthSession> {
  const { data } = await api.post<AuthSession>("/refresh");
  return data;
}

export async function getSession(): Promise<AuthSession | null> {
  try {
    const { data } = await api.get<{ user: AuthUser | null; permissions: string[] }>("/me");
    if (!data.user) return null;
    return { user: data.user, permissions: data.permissions };
  } catch {
    return null;
  }
}
