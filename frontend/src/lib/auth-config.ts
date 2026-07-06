const isProduction = process.env.NODE_ENV === "production";

export const AUTH_COOKIES = {
  accessToken: "access_token",
  refreshToken: "refresh_token",
} as const;

export const authCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/",
};

export const ACCESS_TOKEN_MAX_AGE = 15 * 60;
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

export function getBackendUrl(): string {
  return process.env.BACKEND_URL ?? "http://localhost:3001";
}
