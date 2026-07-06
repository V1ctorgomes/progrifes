import { HomePage } from "@/features/home/HomePage";
import { getPublicBanners, getPublicCategories } from "@/lib/public-api";

export const revalidate = 30;

export default async function Page() {
  const [banners, categories] = await Promise.all([
    getPublicBanners(),
    getPublicCategories(),
  ]);

  return <HomePage banners={banners} categories={categories} />;
}
