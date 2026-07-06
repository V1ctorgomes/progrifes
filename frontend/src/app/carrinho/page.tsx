import { CartPage } from "@/features/cart/CartPage";
import { getPublicCategories } from "@/lib/public-api";

export const dynamic = "force-dynamic";

export default async function Page() {
  const categories = await getPublicCategories();
  return <CartPage categories={categories} />;
}
