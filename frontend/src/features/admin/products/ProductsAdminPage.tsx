"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Modal } from "@/components/admin/Modal";
import { ProductForm } from "@/components/admin/ProductForm";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  categoriesAdminApi,
  getErrorMessage,
  productsAdminApi,
} from "@/lib/admin-api";
import type { Product, ProductInput } from "@/types/product";

export function ProductsAdminPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
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
        ativo:
          statusFilter === "all"
            ? undefined
            : statusFilter === "active",
        limit: 50,
      }),
  });

  const products = data?.data ?? [];

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

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.nome])),
    [categories],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            Produtos
          </h1>
          <p className="text-sm text-brand-gray">Gerencie o catálogo da loja</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          Novo produto
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
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
            {categories.map((category) => (
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
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-brand-gray">Carregando produtos...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-neutral-200 text-sm">
            <thead className="bg-brand-light">
              <tr>
                <th className="px-4 py-3 text-left">Imagem</th>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">Categoria</th>
                <th className="px-4 py-3 text-left">Preço</th>
                <th className="px-4 py-3 text-left">Ativo</th>
                <th className="px-4 py-3 text-left">Destaque</th>
                <th className="px-4 py-3 text-left">Criado em</th>
                <th className="px-4 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const image =
                  product.imagens.find((item) => item.principal) ?? product.imagens[0];
                return (
                  <tr key={product.id} className="border-t border-neutral-200">
                    <td className="px-4 py-3">
                      {image && (
                        <img
                          src={image.url}
                          alt={product.nome}
                          className="h-12 w-12 rounded object-cover"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{product.nome}</td>
                    <td className="px-4 py-3">
                      {categoryMap.get(product.categoriaId) ?? product.categoria.nome}
                    </td>
                    <td className="px-4 py-3">
                      R$ {product.preco.toFixed(2).replace(".", ",")}
                    </td>
                    <td className="px-4 py-3">{product.ativo ? "Sim" : "Não"}</td>
                    <td className="px-4 py-3">{product.destaque ? "Sim" : "Não"}</td>
                    <td className="px-4 py-3">
                      {new Date(product.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditing(product);
                            setModalOpen(true);
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => duplicateMutation.mutate(product.id)}
                        >
                          Duplicar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            toggleMutation.mutate({ id: product.id, ativo: product.ativo })
                          }
                        >
                          {product.ativo ? "Desativar" : "Ativar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Excluir este produto?")) {
                              deleteMutation.mutate(product.id);
                            }
                          }}
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
