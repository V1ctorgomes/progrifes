"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertTriangle,
  Copy,
  PackageSearch,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { Modal } from "@/components/admin/Modal";
import { ProductForm } from "@/components/admin/ProductForm";
import {
  categoriesAdminApi,
  getErrorMessage,
  productsAdminApi,
} from "@/lib/admin-api";
import { sortCategories } from "@/lib/categories";
import type { Product, ProductInput } from "@/types/product";
import { cn, formatCurrency } from "@/utils/cn";

type StatusFilter = "all" | "active" | "inactive";

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

  const { data, isLoading, isFetching, refetch, isError } = useQuery({
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

  const sortedProducts = sortProducts(products);

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

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <RefreshCw className="h-8 w-8 animate-spin text-neutral-300" />
        <p className="text-sm font-medium text-neutral-500">Carregando produtos...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-100 bg-white shadow-sm">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="text-sm font-medium text-neutral-500">
          Não foi possível carregar os produtos.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded-xl bg-brand-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-brand-black">
            Produtos
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Gerencie o catálogo da loja, variantes e destaques.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex h-11 w-fit shrink-0 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 text-sm font-semibold text-brand-black shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4 text-neutral-500", isFetching && "animate-spin")} />
            {isFetching ? "Atualizando..." : "Atualizar"}
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="flex h-11 w-fit shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-black px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Novo produto
          </button>
        </div>
      </div>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
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
      </section>

      <section className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-brand-black">Filtros</h2>
            <p className="text-xs font-medium text-neutral-400">
              Refine a busca por nome, categoria ou status
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-black">Pesquisar</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome, slug, marca..."
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-black outline-none transition-colors focus:border-brand-black focus:ring-1 focus:ring-brand-black"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-black">Categoria</label>
            <select
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-black outline-none transition-colors focus:border-brand-black focus:ring-1 focus:ring-brand-black"
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
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-black outline-none transition-colors focus:border-brand-black focus:ring-1 focus:ring-brand-black"
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

      {products.length === 0 ? (
        <section className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-100 bg-white px-5 py-16 text-center shadow-sm">
          <PackageSearch className="h-10 w-10 text-neutral-300" />
          <p className="text-sm font-medium text-neutral-500">
            Nenhum produto encontrado com os filtros atuais.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-1 rounded-xl bg-brand-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Cadastrar produto
          </button>
        </section>
      ) : (
        <div className="space-y-4">
          <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
                  <PackageSearch className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-brand-black">Catálogo</h2>
                  <p className="text-xs font-medium text-neutral-400">
                    {sortedProducts.length} produto
                    {sortedProducts.length === 1 ? "" : "s"} nesta lista
                  </p>
                </div>
              </div>
            </div>
            <ul className="divide-y divide-neutral-100">
              {sortedProducts.map((product) => (
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
          </section>

          {hasMorePages ? (
            <p className="text-center text-xs font-medium text-neutral-400">
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
    <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-black hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-neutral-500">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-50 text-neutral-400">
          <PackageSearch className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-4 font-display text-3xl font-bold text-brand-black">{value}</p>
      <p className="mt-2 text-xs font-medium text-neutral-400">{hint}</p>
    </div>
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
        "flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-neutral-50/80 sm:flex-row sm:items-center",
        !product.ativo && "bg-neutral-50/60",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50">
          {image ? (
            <img src={image.url} alt={product.nome} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">
              Sem foto
            </div>
          )}
          <span className="absolute left-1.5 top-1.5 rounded-md bg-brand-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
            #{product.ordem}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-brand-black">{product.nome}</p>
            <StatusBadge active={product.ativo} label={product.ativo ? "Ativo" : "Inativo"} />
            {product.destaque ? <StatusBadge active label="Destaque" tone="amber" /> : null}
            {product.novo ? <StatusBadge active label="Novo" tone="blue" /> : null}
          </div>

          <p className="mt-1 text-xs font-medium text-neutral-400">/{product.slug}</p>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <span className="font-bold text-brand-black">{formatCurrency(displayPrice)}</span>
            {product.mostrarPrecoPromocional && product.precoPromocional ? (
              <span className="text-xs text-neutral-400 line-through">
                {formatCurrency(product.preco)}
              </span>
            ) : null}
            {product.marca ? (
              <span className="text-xs font-medium text-neutral-400">Marca: {product.marca}</span>
            ) : null}
            {product.codigoInterno ? (
              <span className="text-xs font-medium text-neutral-400">
                Cód.: {product.codigoInterno}
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-xs font-medium text-neutral-400">
            {product.categoria.nome} · Criado em{" "}
            {new Date(product.createdAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Link
          href={`/admin/produtos/${product.id}/variantes`}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-brand-black shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50"
        >
          Variantes
        </Link>
        <button
          type="button"
          onClick={onEdit}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-brand-black shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-brand-black shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50"
        >
          <Copy className="h-3.5 w-3.5" />
          Duplicar
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-brand-black shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50"
        >
          <Power className="h-3.5 w-3.5" />
          {product.ativo ? "Desativar" : "Ativar"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-red-100 bg-white px-3 text-xs font-semibold text-red-600 shadow-sm transition-all hover:border-red-200 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Excluir
        </button>
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
        "inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
        !active && "bg-neutral-100 text-neutral-600",
        active && tone === "green" && "bg-emerald-50 text-emerald-700",
        active && tone === "amber" && "bg-amber-50 text-amber-700",
        active && tone === "blue" && "bg-sky-50 text-sky-700",
      )}
    >
      {label}
    </span>
  );
}
