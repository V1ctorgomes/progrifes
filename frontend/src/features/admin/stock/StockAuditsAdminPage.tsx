"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  AUDIT_STATUS_COLORS,
  formatAuditDate,
  INVENTORY_AUDIT_STATUS_OPTIONS,
  INVENTORY_AUDIT_TYPE_OPTIONS,
  type CreateInventoryAuditInput,
  type InventoryAuditType,
} from "@/types/inventory-audit";

const emptyForm = {
  nome: "",
  tipo: "GERAL" as InventoryAuditType,
  dataInventario: "",
  categoriaId: "",
  produtoId: "",
  variantId: "",
  observacoes: "",
};

function canWriteStock(permissions: string[]) {
  return permissions.includes("*") || permissions.includes("stock:write");
}

export function StockAuditsAdminPage({ embedded = false }: { embedded?: boolean }) {
  const queryClient = useQueryClient();
  const { permissions } = useAuth();
  const canCreate = canWriteStock(permissions);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [tipo, setTipo] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, tipo]);

  const { data: categories = [] } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: categoriesAdminApi.list,
  });

  const { data: productsData } = useQuery({
    queryKey: ["admin", "products", "audits"],
    queryFn: () => productsAdminApi.list({ limit: 200, ativo: true }),
  });

  const products = productsData?.data ?? [];

  const { data: partialVariants = [] } = useQuery({
    queryKey: ["admin", "variants", form.produtoId, "audit-partial"],
    queryFn: () => variantsAdminApi.listByProduct(form.produtoId),
    enabled: form.tipo === "PARCIAL" && Boolean(form.produtoId),
  });

  const { data: singleVariants = [] } = useQuery({
    queryKey: ["admin", "variants", form.produtoId, "audit-variante"],
    queryFn: () => variantsAdminApi.listByProduct(form.produtoId),
    enabled: form.tipo === "VARIANTE" && Boolean(form.produtoId),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "inventory-audits", page, debouncedSearch, status, tipo],
    queryFn: () =>
      inventoryAdminApi.listAudits({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        status: status || undefined,
        tipo: tipo || undefined,
      }),
  });

  const items = data?.data ?? [];
  const meta = data?.meta;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "inventory-audits"] });

  const createMutation = useMutation({
    mutationFn: (payload: CreateInventoryAuditInput) => inventoryAdminApi.createAudit(payload),
    onSuccess: async (audit) => {
      setFormError("");
      await invalidate();
      setModalOpen(false);
      setForm(emptyForm);
      setSelectedVariantIds([]);
      window.location.href = `/admin/estoque/inventarios/${audit.id}`;
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.nome.trim()) {
      setFormError("Informe o nome do inventário");
      return;
    }

    const payload: CreateInventoryAuditInput = {
      nome: form.nome.trim(),
      tipo: form.tipo,
      dataInventario: form.dataInventario || undefined,
      observacoes: form.observacoes || undefined,
      categoriaId: form.tipo === "CATEGORIA" ? form.categoriaId : undefined,
      produtoId: form.tipo === "PRODUTO" ? form.produtoId : undefined,
      variantId: form.tipo === "VARIANTE" ? form.variantId : undefined,
      variantIds: form.tipo === "PARCIAL" ? selectedVariantIds : undefined,
    };

    createMutation.mutate(payload);
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
              <span>Inventários</span>
            </div>
            <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
              Inventários de Estoque
            </h1>
            <p className="text-sm text-brand-gray">
              Conferências físicas com ajustes automáticos e rastreabilidade completa
            </p>
          </div>
        ) : null}
        {canCreate ? (
          <Button className={embedded ? undefined : "hidden md:inline-flex"} onClick={() => setModalOpen(true)}>
            Novo inventário
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Pesquisar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nome, responsável..."
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-black">Status</label>
          <select
            className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {INVENTORY_AUDIT_STATUS_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-black">Tipo</label>
          <select
            className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="">Todos</option>
            {INVENTORY_AUDIT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-brand-gray">Carregando inventários...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-brand-gray">Nenhum inventário encontrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-neutral-200 text-sm">
            <thead className="bg-brand-light">
              <tr>
                <th className="px-4 py-3 text-left">Número</th>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Itens</th>
                <th className="px-4 py-3 text-left">Responsável</th>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-neutral-200">
                  <td className="px-4 py-3 font-mono">{item.numeroFormatado}</td>
                  <td className="px-4 py-3 font-medium">{item.nome}</td>
                  <td className="px-4 py-3">{item.tipoLabel}</td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded px-2 py-0.5 text-xs text-white"
                      style={{ backgroundColor: AUDIT_STATUS_COLORS[item.status] }}
                    >
                      {item.statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3">{item.totalItens}</td>
                  <td className="px-4 py-3">{item.responsavelNome}</td>
                  <td className="px-4 py-3">{formatAuditDate(item.dataInventario)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/estoque/inventarios/${item.id}`}
                      className="text-sm underline"
                    >
                      Abrir
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
            Página {meta.page} de {meta.totalPages} — {meta.total} inventário(s)
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
        title="Novo inventário"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Nome"
            value={form.nome}
            onChange={(e) => setForm((c) => ({ ...c, nome: e.target.value }))}
            required
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-black">Tipo</label>
            <select
              className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
              value={form.tipo}
              onChange={(e) =>
                setForm((c) => ({
                  ...c,
                  tipo: e.target.value as InventoryAuditType,
                  categoriaId: "",
                  produtoId: "",
                  variantId: "",
                }))
              }
            >
              {INVENTORY_AUDIT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Data do inventário"
            type="datetime-local"
            value={form.dataInventario}
            onChange={(e) => setForm((c) => ({ ...c, dataInventario: e.target.value }))}
          />

          {form.tipo === "CATEGORIA" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-black">Categoria</label>
              <select
                className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
                value={form.categoriaId}
                onChange={(e) => setForm((c) => ({ ...c, categoriaId: e.target.value }))}
                required
              >
                <option value="">Selecione...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {form.tipo === "PRODUTO" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-black">Produto</label>
              <select
                className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
                value={form.produtoId}
                onChange={(e) => setForm((c) => ({ ...c, produtoId: e.target.value }))}
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
          )}

          {form.tipo === "VARIANTE" && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-black">Produto</label>
                <select
                  className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
                  value={form.produtoId}
                  onChange={(e) =>
                    setForm((c) => ({ ...c, produtoId: e.target.value, variantId: "" }))
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
                  onChange={(e) => setForm((c) => ({ ...c, variantId: e.target.value }))}
                  required
                  disabled={!form.produtoId}
                >
                  <option value="">Selecione...</option>
                  {singleVariants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.sku}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {form.tipo === "PARCIAL" && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-black">Produto</label>
                <select
                  className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
                  value={form.produtoId}
                  onChange={(e) => {
                    setForm((c) => ({ ...c, produtoId: e.target.value }));
                    setSelectedVariantIds([]);
                  }}
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
              {form.produtoId && (
                <div>
                  <p className="mb-2 text-sm font-medium text-brand-black">Variantes</p>
                  <div className="max-h-40 space-y-2 overflow-y-auto border border-neutral-200 p-3">
                    {partialVariants.map((variant) => (
                      <label key={variant.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedVariantIds.includes(variant.id)}
                          onChange={(e) => {
                            setSelectedVariantIds((current) =>
                              e.target.checked
                                ? [...current, variant.id]
                                : current.filter((id) => id !== variant.id),
                            );
                          }}
                        />
                        {variant.sku}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-black">Observações</label>
            <textarea
              className="min-h-20 w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
              value={form.observacoes}
              onChange={(e) => setForm((c) => ({ ...c, observacoes: e.target.value }))}
            />
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar inventário"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
