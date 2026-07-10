import { Suspense } from "react";
import { StockHubAdminPage } from "@/features/admin/stock/StockHubAdminPage";

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-brand-gray">Carregando...</p>}>
      <StockHubAdminPage />
    </Suspense>
  );
}
