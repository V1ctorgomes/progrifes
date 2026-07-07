import { Suspense } from "react";
import { CheckoutSuccessPage } from "@/features/checkout/CheckoutSuccessPage";
import { getPublicCategories } from "@/lib/public-api";

export const dynamic = "force-dynamic";

export default async function Page() {
  const categories = await getPublicCategories();

  return (
    <Suspense fallback={<p className="p-8 text-sm text-brand-gray">Carregando...</p>}>
      <CheckoutSuccessPage categories={categories} />
    </Suspense>
  );
}
