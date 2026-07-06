"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AuthLoading } from "@/components/auth/AuthLoading";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/admin/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!isAuthenticated) {
    return <AuthLoading />;
  }

  return <>{children}</>;
}
