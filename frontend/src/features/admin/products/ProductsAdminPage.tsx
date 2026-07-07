"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { Modal } from "@/components/admin/Modal";
import { ProductForm } from "@/components/admin/ProductForm";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  categoriesAdminApi,
  getErrorMessage,
  productsAdminApi,
} from "@/lib/admin-api";
import { sortCategories } from "@/lib/categories";
import type { Product, ProductInput } from "@/types/product";
import { cn, formatCurrency } from "@/utils/cn";

type StatusFilter = "all" | "active" | "inactive";

interface ProductGroup {
  categoryId: string;
  categoryName: string;
  products: Product[];
}

function getProductImage(product: Product) {
  return product.imagens.find((item) => item.principal) ?? product.imagens[0];
}

function sortProducts(products: Product[]) {
  return [...products].sort(
    (a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome),
  );
}

export function ProductsAdminPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: categoriesAdminApi.list,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products", search, categoryFilter, statusFilter],
    queryFn: () =>
      productsAdminApi.list({
        search: search || undefined,
        categoryId: categoryFilter || undefined,
        ativo: statusFilter === "all" ? undefined : statusFilter === "active",
        limit: 50,
      }),
  });

  const products = data?.data ?? [];
  const totalProducts = data?.meta.total ?? products.length;
  const hasMorePages = (data?.meta.totalPages ?? 1) > 1;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "products"] });

  const saveMutation = useMutation({
    mutationFn: async (payload: ProductInput) => {
      if (editing) return productsAdminApi.update(editing.id, payload);
      return productsAdminApi.create(payload);
    },
    onSuccess: async () => {
      await invalidate();
      setModalOpen(false);
      setEditing(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) =>
      ativo ? productsAdminApi.deactivate(id) : productsAdminApi.activate(id),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: productsAdminApi.remove,
    onSuccess: invalidate,
  });

  const duplicateMutation = useMutation({
    mutationFn: productsAdminApi.duplicate,
    onSuccess: invalidate,
  });

  const shouldGroupByCategory = !search && !categoryFilter && statusFilter === "all";

  const groupedProducts = useMemo<ProductGroup[]>(() => {
    if (!shouldGroupByCategory) {
      return [
        {
          categoryId: "results",
          categoryName: "Resultados",
          products: sortProducts(products),
        },
      ];
    }

    const groups = new Map<string, ProductGroup>();

    for (const product of products) {
      const existing = groups.get(product.categoriaId);
      if (existing) {
        existing.products.push(product);
        continue;
      }

      groups.set(product.categoriaId, {
        categoryId: product.categoriaId,
        categoryName: product.categoria.nome,
        products: [product],
      });
    }

    const categoryOrder = new Map(
      sortCategories(categories).map((category, index) => [category.id, index]),
    );

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        products: sortProducts(group.products),
      }))
      .sort((a, b) => {
        const orderA = categoryOrder.get(a.categoryId) ?? Number.MAX_SAFE_INTEGER;
        const orderB = categoryOrder.get(b.categoryId) ?? Number.MAX_SAFE_INTEGER;
        return orderA - orderB || a.categoryName.localeCompare(b.categoryName);
      });
  }, [categories, products, shouldGroupByCategory]);

  const activeCount = products.filter((product) => product.ativo).length;
  const inactiveCount = products.length - activeCount;
  const featuredCount = products.filter((product) => product.destaque).length;
  const newCount = products.filter((product) => product.novo).length;

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            Produtos
          </h1>
          <p className="mt-1 text-sm text-brand-gray">
            Gerencie o catálogo da loja, variantes e destaques por categoria.
          </p>
        </div>
        <Button onClick={openCreate}>Novo produto</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total" value={totalProducts} hint="Produtos no catálogo" />
        <SummaryCard
          label="Ativos"
          value={activeCount}
          hint={`${inactiveCount} inativo${inactiveCount === 1 ? "" : "s"} nesta lista`}
        />
        <SummaryCard
          label="Destaque"
          value={featuredCount}
          hint="Produtos marcados para vitrine"
        />
        <SummaryCard label="Novos" value={newCount} hint="Produtos com selo de novidade" />
      </div>

      <section className="border border-neutral-200 bg-brand-white p-4 sm:p-5">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-brand-black">
          Filtros
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Input
            label="Pesquisar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome, slug, marca..."
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-black">Categoria</label>
            <select
              className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Todas</option>
              {sortCategories(categories).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-black">Status</label>
            <select
              className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
        </div>
      </section>

      {isLoading ? (
        <p className="text-sm text-brand-gray">Carregando produtos...</p>
      ) : products.length === 0 ? (
        <section className="border border-neutral-200 px-4 py-16 text-center">
          <p className="text-sm text-brand-gray">Nenhum produto encontrado com os filtros atuais.</p>
          <Button size="sm" variant="ghost" className="mt-3" onClick={openCreate}>
            Cadastrar produto
          </Button>
        </section>
      ) : (
        <div className="space-y-8">
          {groupedProducts.map((group) => (
            <ProductGroupSection
              key={group.categoryId}
              title={shouldGroupByCategory ? group.categoryName : "Resultados da busca"}
              description={
                shouldGroupByCategory
                  ? `${group.products.length} produto${group.products.length === 1 ? "" : "s"} nesta categoria`
                  : `${group.products.length} produto${group.products.length === 1 ? "" : "s"} encontrado${group.products.length === 1 ? "" : "s"}`
              }
            >
              <ul className="divide-y divide-neutral-200">
                {group.products.map((product) => (
                  <li key={product.id}>
                    <ProductRow
                      product={product}
                      onEdit={() => openEdit(product)}
                      onDuplicate={() => duplicateMutation.mutate(product.id)}
                      onToggle={() =>
                        toggleMutation.mutate({ id: product.id, ativo: product.ativo })
                      }
                      onDelete={() => {
                        if (confirm("Excluir este produto?")) {
                          deleteMutation.mutate(product.id);
                        }
                      }}
                    />
                  </li>
                ))}
              </ul>
            </ProductGroupSection>
          ))}

          {hasMorePages ? (
            <p className="text-center text-xs text-brand-gray">
              Exibindo os primeiros {products.length} de {totalProducts} produtos. Refine os filtros
              para encontrar itens específicos.
            </p>
          ) : null}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? "Editar produto" : "Novo produto"}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
      >
        <ProductForm
          initial={editing}
          categories={categories}
          onCancel={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSubmit={async (payload) => {
            try {
              await saveMutation.mutateAsync(payload);
            } catch (error) {
              throw new Error(getErrorMessage(error));
            }
          }}
        />
      </Modal>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="border border-neutral-200 bg-brand-white p-4">
      <p className="text-xs font-medium uppercase tracking-widest text-brand-gray">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-brand-black">{value}</p>
      <p className="mt-1 text-xs text-brand-gray">{hint}</p>
    </div>
  );
}

function ProductGroupSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden border border-neutral-200 bg-brand-white shadow-sm">
      <div className="border-b border-neutral-200 bg-brand-light px-4 py-3 sm:px-6">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-brand-black">
          {title}
        </h2>
        <p className="text-xs text-brand-gray">{description}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}

function ProductRow({
  product,
  onEdit,
  onDuplicate,
  onToggle,
  onDelete,
}: {
  product: Product;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const image = getProductImage(product);
  const displayPrice =
    product.mostrarPrecoPromocional && product.precoPromocional
      ? product.precoPromocional
      : product.preco;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:px-6",
        !product.ativo && "bg-neutral-50",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-neutral-200 bg-brand-light">
          {image ? (
            <img src={image.url} alt={product.nome} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-brand-gray">
              Sem foto
            </div>
          )}
          <span className="absolute left-1 top-1 bg-brand-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-brand-white">
            #{product.ordem}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-brand-black">{product.nome}</p>
            <StatusBadge active={product.ativo} label={product.ativo ? "Ativo" : "Inativo"} />
            {product.destaque ? <StatusBadge active label="Destaque" tone="amber" /> : null}
            {product.novo ? <StatusBadge active label="Novo" tone="blue" /> : null}
          </div>

          <p className="mt-1 text-xs text-brand-gray">/{product.slug}</p>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold text-brand-black">{formatCurrency(displayPrice)}</span>
            {product.mostrarPrecoPromocional && product.precoPromocional ? (
              <span className="text-xs text-brand-gray line-through">
                {formatCurrency(product.preco)}
              </span>
            ) : null}
            {product.marca ? (
              <span className="text-xs text-brand-gray">Marca: {product.marca}</span>
            ) : null}
            {product.codigoInterno ? (
              <span className="text-xs text-brand-gray">Cód.: {product.codigoInterno}</span>
            ) : null}
          </div>

          <p className="mt-1 text-xs text-brand-gray">
            Criado em {new Date(product.createdAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Link href={`/admin/produtos/${product.id}/variantes`}>
          <Button size="sm" variant="outline" type="button">
            Variantes
          </Button>
        </Link>
        <Button size="sm" variant="outline" onClick={onEdit}>
          Editar
        </Button>
        <Button size="sm" variant="ghost" onClick={onDuplicate}>
          Duplicar
        </Button>
        <Button size="sm" variant="ghost" onClick={onToggle}>
          {product.ativo ? "Desativar" : "Ativar"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete}>
          Excluir
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({
  active,
  label,
  tone = "green",
}: {
  active: boolean;
  label: string;
  tone?: "green" | "amber" | "blue";
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        !active && "bg-neutral-200 text-brand-gray",
        active && tone === "green" && "bg-emerald-100 text-emerald-800",
        active && tone === "amber" && "bg-amber-100 text-amber-800",
        active && tone === "blue" && "bg-sky-100 text-sky-800",
      )}
    >
      {label}
    </span>
  );
}
