"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ProductVariantsAdminPage } from "@/features/admin/variants/ProductVariantsAdminPage";
import { productsAdminApi } from "@/lib/admin-api";

export default function Page() {
  const { id } = useParams<{ id: string }>();

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["admin", "product", id],
    queryFn: () => productsAdminApi.getById(id),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return <p className="text-sm text-brand-gray">Carregando produto...</p>;
  }

  if (isError || !product) {
    return <p className="text-sm text-red-600">Produto não encontrado.</p>;
  }

  return <ProductVariantsAdminPage product={product} />;
}
