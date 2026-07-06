import axios, { isAxiosError } from "axios";
import type { AuthSession, LoginCredentials } from "@/types/auth";

const api = axios.create({
  baseURL: "/api/auth",
  withCredentials: true,
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
    if (error.response?.status === 503) {
      return "API indisponível. Verifique se o backend está online.";
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
    const { data } = await api.get<AuthSession>("/me");
    return data;
  } catch {
    try {
      return await refreshSession();
    } catch {
      return null;
    }
  }
}
