"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  categoriesAdminApi,
  getErrorMessage,
  inventoryAdminApi,
  productsAdminApi,
  variantsAdminApi,
} from "@/lib/admin-api";
import { useAuth } from "@/hooks/useAuth";
import {
  formatEntryDate,
  INVENTORY_ENTRY_TYPE_OPTIONS,
  type CreateInventoryEntryInput,
  type InventoryEntryType,
} from "@/types/inventory-entry";
import { formatVariantLabel } from "@/lib/variants";
import type { ProductVariant } from "@/types/variant";

const emptyForm = {
  produtoId: "",
  variantId: "",
  tipo: "REPOSICAO" as InventoryEntryType,
  quantidade: "1",
  dataEntrada: "",
  valorUnitario: "",
  documento: "",
  notaFiscal: "",
  fornecedor: "",
  observacoes: "",
};

function canWriteStock(permissions: string[]) {
  return permissions.includes("*") || permissions.includes("stock:write");
}

export function StockEntriesAdminPage() {
  const queryClient = useQueryClient();
  const { permissions } = useAuth();
  const canCreate = canWriteStock(permissions);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tipo, setTipo] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, tipo, categoriaId, produtoId, fornecedor, dataInicio, dataFim]);

  const { data: categories = [] } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: categoriesAdminApi.list,
  });

  const { data: productsData } = useQuery({
    queryKey: ["admin", "products", "entries-filter"],
    queryFn: () => productsAdminApi.list({ limit: 200, ativo: true }),
  });

  const products = productsData?.data ?? [];

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin",
      "inventory-entries",
      page,
      debouncedSearch,
      tipo,
      categoriaId,
      produtoId,
      fornecedor,
      dataInicio,
      dataFim,
    ],
    queryFn: () =>
      inventoryAdminApi.listEntries({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        tipo: tipo || undefined,
        categoriaId: categoriaId || undefined,
        produtoId: produtoId || undefined,
        fornecedor: fornecedor || undefined,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
      }),
  });

  const { data: modalVariants = [] } = useQuery({
    queryKey: ["admin", "variants", form.produtoId, "entry-form"],
    queryFn: () => variantsAdminApi.listByProduct(form.produtoId),
    enabled: Boolean(form.produtoId),
  });

  const activeVariants = useMemo(
    () => modalVariants.filter((variant: ProductVariant) => variant.ativo),
    [modalVariants],
  );

  const items = data?.data ?? [];
  const meta = data?.meta;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "inventory-entries"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateInventoryEntryInput) => inventoryAdminApi.createEntry(payload),
    onSuccess: async () => {
      setFormError("");
      await invalidate();
      setModalOpen(false);
      setForm(emptyForm);
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.variantId) {
      setFormError("Selecione a variante");
      return;
    }

    const quantidade = Number(form.quantidade);
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      setFormError("Informe uma quantidade válida maior que zero");
      return;
    }

    const payload: CreateInventoryEntryInput = {
      variantId: form.variantId,
      tipo: form.tipo,
      quantidade,
      dataEntrada: form.dataEntrada || undefined,
      valorUnitario: form.valorUnitario ? Number(form.valorUnitario) : undefined,
      documento: form.documento || undefined,
      notaFiscal: form.notaFiscal || undefined,
      fornecedor: form.fornecedor || undefined,
      observacoes: form.observacoes || undefined,
    };

    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2 text-sm text-brand-gray">
            <Link href="/admin/estoque" className="hover:text-brand-black">
              Estoque
            </Link>
            <span>/</span>
            <span>Entradas</span>
          </div>
          <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            Entradas de Estoque
          </h1>
          <p className="text-sm text-brand-gray">
            Registre movimentações que aumentam o saldo com rastreabilidade completa
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCreate && (
            <Button className="hidden md:inline-flex" onClick={() => setModalOpen(true)}>
              Nova entrada
            </Button>
          )}
          <Link href="/admin/estoque/movimentacoes">
            <Button variant="outline">Movimentações</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Pesquisar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Produto, SKU, documento, responsável..."
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-black">Tipo</label>
          <select
            className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="">Todos</option>
            {INVENTORY_ENTRY_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-black">Categoria</label>
          <select
            className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
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
          <label className="mb-1.5 block text-sm font-medium text-brand-black">Produto</label>
          <select
            className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
            value={produtoId}
            onChange={(e) => setProdutoId(e.target.value)}
          >
            <option value="">Todos</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.nome}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Fornecedor"
          value={fornecedor}
          onChange={(e) => setFornecedor(e.target.value)}
          placeholder="Filtrar por fornecedor"
        />
        <Input
          label="Data inicial"
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
        />
        <Input
          label="Data final"
          type="date"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-brand-gray">Carregando entradas...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-brand-gray">Nenhuma entrada encontrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-neutral-200 text-sm">
            <thead className="bg-brand-light">
              <tr>
                <th className="px-4 py-3 text-left">Número</th>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Produto</th>
                <th className="px-4 py-3 text-left">Variante</th>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Qtd</th>
                <th className="px-4 py-3 text-left">Responsável</th>
                <th className="px-4 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-neutral-200">
                  <td className="px-4 py-3 font-mono">{item.numeroFormatado}</td>
                  <td className="px-4 py-3">{formatEntryDate(item.dataEntrada)}</td>
                  <td className="px-4 py-3 font-medium">{item.produtoNome}</td>
                  <td className="px-4 py-3">{item.varianteLabel}</td>
                  <td className="px-4 py-3 font-mono">{item.sku}</td>
                  <td className="px-4 py-3">{item.tipoLabel}</td>
                  <td className="px-4 py-3 font-medium">{item.quantidade}</td>
                  <td className="px-4 py-3">{item.responsavelNome ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/estoque/entradas/${item.id}`}
                      className="text-sm underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-brand-gray">
            Página {meta.page} de {meta.totalPages} — {meta.total} entrada(s)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setFormError("");
        }}
        title="Nova entrada de estoque"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-black">Produto</label>
            <select
              className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
              value={form.produtoId}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  produtoId: e.target.value,
                  variantId: "",
                }))
              }
              required
            >
              <option value="">Selecione...</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-black">Variante</label>
            <select
              className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
              value={form.variantId}
              onChange={(e) => setForm((current) => ({ ...current, variantId: e.target.value }))}
              required
              disabled={!form.produtoId}
            >
              <option value="">Selecione...</option>
              {activeVariants.map((variant: ProductVariant) => (
                <option key={variant.id} value={variant.id}>
                  {formatVariantLabel(variant)} — {variant.sku}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-black">
                Tipo de entrada
              </label>
              <select
                className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
                value={form.tipo}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    tipo: e.target.value as InventoryEntryType,
                  }))
                }
                required
              >
                {INVENTORY_ENTRY_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Quantidade"
              type="number"
              min={1}
              step={1}
              value={form.quantidade}
              onChange={(e) => setForm((current) => ({ ...current, quantidade: e.target.value }))}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Data da entrada"
              type="datetime-local"
              value={form.dataEntrada}
              onChange={(e) => setForm((current) => ({ ...current, dataEntrada: e.target.value }))}
            />
            <Input
              label="Valor unitário"
              type="number"
              step="0.01"
              min={0}
              value={form.valorUnitario}
              onChange={(e) => setForm((current) => ({ ...current, valorUnitario: e.target.value }))}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Documento"
              value={form.documento}
              onChange={(e) => setForm((current) => ({ ...current, documento: e.target.value }))}
            />
            <Input
              label="Nota fiscal"
              value={form.notaFiscal}
              onChange={(e) => setForm((current) => ({ ...current, notaFiscal: e.target.value }))}
            />
          </div>

          <Input
            label="Fornecedor"
            value={form.fornecedor}
            onChange={(e) => setForm((current) => ({ ...current, fornecedor: e.target.value }))}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-black">Observações</label>
            <textarea
              className="min-h-24 w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
              value={form.observacoes}
              onChange={(e) => setForm((current) => ({ ...current, observacoes: e.target.value }))}
            />
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Registrando..." : "Confirmar entrada"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
