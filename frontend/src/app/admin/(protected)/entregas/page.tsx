import { Suspense } from "react";
import { DeliveryHubAdminPage } from "@/features/admin/delivery/DeliveryHubAdminPage";

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-brand-gray">Carregando...</p>}>
      <DeliveryHubAdminPage />
    </Suspense>
  );
}
