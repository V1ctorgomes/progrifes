import { StockMovementDetailPage } from "@/features/admin/stock/StockMovementDetailPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <StockMovementDetailPage movementId={id} />;
}
