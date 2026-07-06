import { AdminShell } from "@/layouts/AdminLayout";

export default function AdminProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminShell>{children}</AdminShell>;
}
