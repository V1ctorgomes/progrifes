import { StockAuditDetailPage } from "@/features/admin/stock/StockAuditDetailPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <StockAuditDetailPage auditId={id} />;
}
