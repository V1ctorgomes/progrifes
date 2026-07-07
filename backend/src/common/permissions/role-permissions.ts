import { UserRole } from "@prisma/client";

export type Permission = string;

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMINISTRADOR]: ["*"],
  [UserRole.GERENTE]: [
    "products:read",
    "products:write",
    "categories:read",
    "categories:write",
    "orders:read",
    "orders:write",
    "stock:read",
    "stock:write",
    "customers:read",
    "customers:write",
    "suppliers:read",
    "suppliers:write",
    "purchases:read",
    "purchases:write",
    "purchases:approve",
    "finance:read",
    "finance:write",
    "receivables:read",
    "receivables:write",
    "payables:read",
    "payables:write",
    "cashflow:read",
    "cashflow:write",
    "cashflow:adjust",
    "cashflow:close",
    "expenses:read",
    "expenses:write",
  ],
  [UserRole.FUNCIONARIO]: [
    "products:read",
    "categories:read",
    "orders:read",
    "stock:read",
    "customers:read",
    "suppliers:read",
    "purchases:read",
    "finance:read",
    "receivables:read",
    "payables:read",
    "cashflow:read",
    "expenses:read",
  ],
};

export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = getPermissionsForRole(role);
  return permissions.includes("*") || permissions.includes(permission);
}
