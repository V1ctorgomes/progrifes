import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthProvider";

export const metadata: Metadata = {
  title: "Admin — Grifres ERP",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthProvider>{children}</AuthProvider>;
}
