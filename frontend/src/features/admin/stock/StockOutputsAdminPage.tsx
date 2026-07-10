"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  getErrorMessage,
  inventoryAdminApi,
  productsAdminApi,
  variantsAdminApi,
} from "@/lib/admin-api";
import { useAuth } from "@/hooks/useAuth";
import { formatVariantLabel } from "@/lib/variants";
import type { ProductVariant } from "@/types/variant";
import {
  formatMovementDate,
  INVENTORY_OUTPUT_FILTER_OPTIONS,
  INVENTORY_OUTPUT_TYPE_OPTIONS,
  type CreateInventoryOutputInput,
  type InventoryOutputType,
} from "@/types/inventory-output";

const emptyForm = {
  produtoId: "",
  variantId: "",
  tipo: "PERDA" as InventoryOutputType,
  quantidade: "1",
  motivo: "",
  documento: "",
  observacoes: "",
};

function canWriteStock(permissions: string[]) {
  return permissions.includes("*") || permissions.includes("stock:write");
}

export function StockOutputsAdminPage({ embedded = false }: { embedded?: boolean }) {
  const queryClient = useQueryClient();
  const { permissions } = useAuth();
  const canCreate = canWriteStock(permissions);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tipo, setTipo] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
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
  }, [debouncedSearch, tipo, produtoId, dataInicio]);

  const { data: productsData } = useQuery({
    queryKey: ["admin", "products", "outputs-filter"],
    queryFn: () => productsAdminApi.list({ limit: 200, ativo: true }),
  });

  const products = productsData?.data ?? [];

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin",
      "inventory-outputs",
      page,
      debouncedSearch,
      tipo,
      produtoId,
      dataInicio,
    ],
    queryFn: () =>
      inventoryAdminApi.listOutputs({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        tipo: tipo || undefined,
        produtoId: produtoId || undefined,
        dataInicio: dataInicio || undefined,
      }),
  });

  const { data: modalVariants = [] } = useQuery({
    queryKey: ["admin", "variants", form.produtoId, "output-form"],
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
    queryClient.invalidateQueries({ queryKey: ["admin", "inventory-outputs"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "inventory-movements"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateInventoryOutputInput) => inventoryAdminApi.createOutput(payload),
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
    if (!form.motivo.trim()) {
      setFormError("Informe o motivo da saída");
      return;
    }

    const quantidade = Number(form.quantidade);
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      setFormError("Informe uma quantidade válida maior que zero");
      return;
    }

    createMutation.mutate({
      variantId: form.variantId,
      tipo: form.tipo,
      quantidade,
      motivo: form.motivo.trim(),
      documento: form.documento || undefined,
      observacoes: form.observacoes || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div
        className={
          embedded
            ? "flex flex-wrap items-center justify-end gap-3"
            : "flex flex-wrap items-center justify-between gap-3"
        }
      >
        {!embedded ? (
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2 text-sm text-brand-gray">
              <Link href="/admin/estoque" className="hover:text-brand-black">
                Estoque
              </Link>
              <span>/</span>
              <span>Saídas</span>
            </div>
            <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
              Saídas de Estoque
            </h1>
            <p className="text-sm text-brand-gray">
              Registre perdas, avarias, consumo interno e demais baixas de estoque
            </p>
          </div>
        ) : null}
        {canCreate ? (
          <Button className={embedded ? undefined : "hidden md:inline-flex"} onClick={() => setModalOpen(true)}>
            Nova saída
          </Button>
        ) : null}
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
            {INVENTORY_OUTPUT_FILTER_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
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
          label="A partir de"
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-brand-gray">Carregando saídas...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-brand-gray">Nenhuma saída encontrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-neutral-200 text-sm">
            <thead className="bg-brand-light">
              <tr>
                <th className="px-4 py-3 text-left">Número</th>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Produto</th>
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
                  <td className="px-4 py-3 font-mono">
                    {item.numeroFormatado ?? (item.automatica ? "Automática" : "—")}
                  </td>
                  <td className="px-4 py-3">{formatMovementDate(item.createdAt)}</td>
                  <td className="px-4 py-3 font-medium">{item.produtoNome}</td>
                  <td className="px-4 py-3 font-mono">{item.sku}</td>
                  <td className="px-4 py-3">{item.tipoSaidaLabel}</td>
                  <td className="px-4 py-3 font-medium">{item.quantidade}</td>
                  <td className="px-4 py-3">{item.responsavelNome ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/estoque/saidas/${item.id}`}
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
            Página {meta.page} de {meta.totalPages} — {meta.total} saída(s)
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
        title="Nova saída de estoque"
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
                  {formatVariantLabel(variant)} — {variant.sku} (disp: {variant.estoque})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-black">
                Tipo da saída
              </label>
              <select
                className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
                value={form.tipo}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    tipo: e.target.value as InventoryOutputType,
                  }))
                }
                required
              >
                {INVENTORY_OUTPUT_TYPE_OPTIONS.map((option) => (
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

          <Input
            label="Motivo"
            value={form.motivo}
            onChange={(e) => setForm((current) => ({ ...current, motivo: e.target.value }))}
            required
          />

          <Input
            label="Documento"
            value={form.documento}
            onChange={(e) => setForm((current) => ({ ...current, documento: e.target.value }))}
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
              {createMutation.isPending ? "Registrando..." : "Confirmar saída"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
