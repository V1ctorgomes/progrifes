export interface JwtPayload {
  sub: string;
  email: string;
  cargo: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  cargo: string;
}
