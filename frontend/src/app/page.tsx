import { HomePage } from "@/features/home/HomePage";
import { toStoreProducts } from "@/lib/products";
import { getPublicBanners, getPublicCategories, getPublicProducts } from "@/lib/public-api";

export const revalidate = 30;

export default async function Page() {
  const [banners, categories, featured, recent] = await Promise.all([
    getPublicBanners(),
    getPublicCategories(),
    getPublicProducts({ destaque: true, limit: 4 }),
    getPublicProducts({ novo: true, limit: 4 }),
  ]);

  return (
    <HomePage
      banners={banners}
      categories={categories}
      featuredProducts={toStoreProducts(featured.data)}
      recentProducts={toStoreProducts(recent.data)}
    />
  );
}
