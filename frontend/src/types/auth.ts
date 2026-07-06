export type UserRole = "ADMINISTRADOR" | "GERENTE" | "FUNCIONARIO";

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  cargo: UserRole;
}

export interface AuthSession {
  user: AuthUser;
  permissions: string[];
}

export interface LoginCredentials {
  email: string;
  senha: string;
}
