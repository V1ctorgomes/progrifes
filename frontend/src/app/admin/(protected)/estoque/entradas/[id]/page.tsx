import { StockEntryDetailPage } from "@/features/admin/stock/StockEntryDetailPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <StockEntryDetailPage entryId={id} />;
}
