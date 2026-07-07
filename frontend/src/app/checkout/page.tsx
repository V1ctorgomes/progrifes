import { CheckoutPage } from "@/features/checkout/CheckoutPage";
import { getPublicCategories } from "@/lib/public-api";

export const dynamic = "force-dynamic";

export default async function Page() {
  const categories = await getPublicCategories();
  return <CheckoutPage categories={categories} />;
}
