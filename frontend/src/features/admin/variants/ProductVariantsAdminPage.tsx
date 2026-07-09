"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { Modal } from "@/components/admin/Modal";
import { VariantForm, type VariantFormData } from "@/components/admin/VariantForm";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  attributesAdminApi,
  getErrorMessage,
  variantsAdminApi,
} from "@/lib/admin-api";
import { formatVariantLabel } from "@/lib/variants";
import type { Product } from "@/types/product";
import type { ProductVariant, StockStatus } from "@/types/variant";
import { STOCK_STATUS_LABELS } from "@/types/variant";
import { cn, formatCurrency } from "@/utils/cn";

interface ProductVariantsAdminPageProps {
  product: Product;
}

interface VariantGroup {
  id: string;
  label: string;
  description: string;
  variants: ProductVariant[];
}

function toVariantPayload(productId: string, form: VariantFormData, editing: boolean) {
  const payload = {
    produtoId: productId,
    sku: form.sku.trim(),
    codigoBarras: form.codigoBarras || undefined,
    preco: form.preco ? Number(form.preco) : undefined,
    precoPromocional: form.precoPromocional ? Number(form.precoPromocional) : undefined,
    custo: form.custo ? Number(form.custo) : undefined,
    estoqueMinimo: Number(form.estoqueMinimo) || 0,
    ativo: form.ativo,
    attributeValueIds: form.attributeValueIds,
    imagens: form.imagens.filter((image) => image.url.trim()),
  };

  if (!editing) {
    return { ...payload, estoque: Number(form.estoque) || 0 };
  }

  return payload;
}

function sortVariants(variants: ProductVariant[]) {
  return [...variants].sort((a, b) => formatVariantLabel(a).localeCompare(formatVariantLabel(b)));
}

function getProductImage(product: Product) {
  return product.imagens.find((item) => item.principal) ?? product.imagens[0];
}

function getVariantGroups(variants: ProductVariant[]): VariantGroup[] {
  if (variants.length === 0) return [];

  const sorted = sortVariants(variants);
  const firstAttrName = sorted[0]?.atributos[0]?.attributeNome;
  const allSameFirstAttr =
    Boolean(firstAttrName) &&
    sorted.every((variant) => variant.atributos[0]?.attributeNome === firstAttrName);

  if (!allSameFirstAttr) {
    return [
      {
        id: "all",
        label: "Variantes",
        description: `${sorted.length} combinação${sorted.length === 1 ? "" : "ões"} cadastrada${sorted.length === 1 ? "" : "s"}`,
        variants: sorted,
      },
    ];
  }

  const groups = new Map<string, ProductVariant[]>();

  for (const variant of sorted) {
    const key = variant.atributos[0]?.valor ?? "Outros";
    const existing = groups.get(key) ?? [];
    existing.push(variant);
    groups.set(key, existing);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([value, items]) => ({
      id: value,
      label: value,
      description: `${firstAttrName} · ${items.length} tamanho${items.length === 1 ? "" : "s"} ou combinação${items.length === 1 ? "" : "ões"}`,
      variants: items,
    }));
}

function getVariantSecondaryLabel(variant: ProductVariant) {
  if (variant.atributos.length <= 1) return null;
  return variant.atributos
    .slice(1)
    .map((attr) => attr.valor)
    .join(" / ");
}

function getVariantImage(variant: ProductVariant, product: Product) {
  return (
    variant.imagens.find((item) => item.principal) ??
    variant.imagens[0] ??
    getProductImage(product)
  );
}

export function ProductVariantsAdminPage({ product }: ProductVariantsAdminPageProps) {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<ProductVariant | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedValues, setSelectedValues] = useState<Record<string, string[]>>({});
  const [bulkForm, setBulkForm] = useState({
    preco: "",
    custo: "",
    estoqueMinimo: "",
    ativo: "" as "" | "true" | "false",
  });
  const [estoqueInicial, setEstoqueInicial] = useState("10");
  const [estoqueMinimo, setEstoqueMinimo] = useState("3");

  const { data: variants = [], isLoading } = useQuery({
    queryKey: ["admin", "variants", product.id],
    queryFn: () => variantsAdminApi.listByProduct(product.id),
  });

  const { data: attributes = [] } = useQuery({
    queryKey: ["admin", "attributes"],
    queryFn: attributesAdminApi.list,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "variants", product.id] });

  const saveMutation = useMutation({
    mutationFn: async (form: VariantFormData) => {
      const payload = toVariantPayload(product.id, form, Boolean(editing));
      if (editing) return variantsAdminApi.update(editing.id, payload);
      return variantsAdminApi.create(payload);
    },
    onSuccess: async () => {
      await invalidate();
      setModalOpen(false);
      setEditing(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) =>
      ativo ? variantsAdminApi.deactivate(id) : variantsAdminApi.activate(id),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: variantsAdminApi.remove,
    onSuccess: invalidate,
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      variantsAdminApi.generate({
        produtoId: product.id,
        grupos: Object.entries(selectedValues)
          .filter(([, valueIds]) => valueIds.length > 0)
          .map(([attributeId, valueIds]) => ({ attributeId, valueIds })),
        estoqueInicial: Number(estoqueInicial) || 0,
        estoqueMinimo: Number(estoqueMinimo) || 0,
      }),
    onSuccess: async (result) => {
      await invalidate();
      setGenerateOpen(false);
      alert(`${result.total} variantes criadas`);
    },
  });

  const bulkMutation = useMutation({
    mutationFn: () =>
      variantsAdminApi.bulkUpdate({
        ids: selectedIds,
        preco: bulkForm.preco ? Number(bulkForm.preco) : undefined,
        custo: bulkForm.custo ? Number(bulkForm.custo) : undefined,
        estoqueMinimo: bulkForm.estoqueMinimo ? Number(bulkForm.estoqueMinimo) : undefined,
        ativo: bulkForm.ativo === "" ? undefined : bulkForm.ativo === "true",
      }),
    onSuccess: async () => {
      await invalidate();
      setBulkOpen(false);
      setSelectedIds([]);
    },
  });

  const groupedVariants = useMemo(() => getVariantGroups(variants), [variants]);

  const allSelected = variants.length > 0 && selectedIds.length === variants.length;
  const activeCount = variants.filter((variant) => variant.ativo).length;
  const lowStockCount = variants.filter((variant) => variant.statusEstoque === "estoque_baixo").length;
  const outOfStockCount = variants.filter((variant) => variant.statusEstoque === "sem_estoque").length;
  const productImage = getProductImage(product);

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : variants.map((variant) => variant.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const toggleValue = (attributeId: string, valueId: string) => {
    setSelectedValues((current) => {
      const currentValues = current[attributeId] ?? [];
      const exists = currentValues.includes(valueId);
      return {
        ...current,
        [attributeId]: exists
          ? currentValues.filter((id) => id !== valueId)
          : [...currentValues, valueId],
      };
    });
  };

  const estimatedCombinations = useMemo(() => {
    const groups = Object.values(selectedValues).filter((values) => values.length > 0);
    if (!groups.length) return 0;
    return groups.reduce((total, group) => total * group.length, 1);
  }, [selectedValues]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (variant: ProductVariant) => {
    setEditing(variant);
    setModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/produtos" className="text-sm text-brand-gray underline">
            ← Voltar para produtos
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            Variantes
          </h1>
          <p className="mt-1 text-sm text-brand-gray">
            Gerencie combinações, estoque e preços do produto.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setGenerateOpen(true)}>
            Gerar combinações
          </Button>
          <Button variant="outline" disabled={selectedIds.length === 0} onClick={() => setBulkOpen(true)}>
            Alteração em lote ({selectedIds.length})
          </Button>
          <Button onClick={openCreate}>Nova variante</Button>
        </div>
      </div>

      <section className="overflow-hidden border border-neutral-200 bg-brand-white shadow-sm">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-6">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden border border-neutral-200 bg-brand-light">
            {productImage ? (
              <img src={productImage.url} alt={product.nome} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-brand-gray">
                Sem foto
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-brand-black">{product.nome}</p>
            <p className="mt-1 text-xs text-brand-gray">/{product.slug}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <span className="font-semibold text-brand-black">{formatCurrency(product.preco)}</span>
              <span className="text-xs text-brand-gray">{product.categoria.nome}</span>
              <StatusBadge active={product.ativo} label={product.ativo ? "Produto ativo" : "Produto inativo"} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total" value={variants.length} hint="Variantes cadastradas" />
        <SummaryCard
          label="Ativas"
          value={activeCount}
          hint={`${variants.length - activeCount} inativa${variants.length - activeCount === 1 ? "" : "s"}`}
        />
        <SummaryCard label="Estoque baixo" value={lowStockCount} hint="Abaixo do mínimo configurado" />
        <SummaryCard label="Sem estoque" value={outOfStockCount} hint="Indisponíveis para venda" />
      </div>

      {variants.length > 0 ? (
        <section className="flex flex-wrap items-center justify-between gap-3 border border-neutral-200 bg-brand-light px-4 py-3 sm:px-6">
          <label className="flex items-center gap-2 text-sm text-brand-black">
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
            Selecionar todas ({selectedIds.length}/{variants.length})
          </label>
          {selectedIds.length > 0 ? (
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
              Limpar seleção
            </Button>
          ) : null}
        </section>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-brand-gray">Carregando variantes...</p>
      ) : variants.length === 0 ? (
        <section className="border border-neutral-200 px-4 py-16 text-center">
          <p className="text-sm text-brand-gray">
            Nenhuma variante cadastrada para este produto.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setGenerateOpen(true)}>
              Gerar combinações
            </Button>
            <Button size="sm" onClick={openCreate}>
              Criar variante manualmente
            </Button>
          </div>
        </section>
      ) : (
        <div className="space-y-8">
          {groupedVariants.map((group) => (
            <VariantGroupSection key={group.id} title={group.label} description={group.description}>
              <ul className="divide-y divide-neutral-200">
                {group.variants.map((variant) => (
                  <li key={variant.id}>
                    <VariantRow
                      variant={variant}
                      product={product}
                      selected={selectedIds.includes(variant.id)}
                      onToggleSelect={() => toggleSelect(variant.id)}
                      onEdit={() => openEdit(variant)}
                      onToggleActive={() =>
                        toggleMutation.mutate({ id: variant.id, ativo: variant.ativo })
                      }
                      onDelete={() => {
                        if (confirm("Excluir esta variante?")) {
                          deleteMutation.mutate(variant.id);
                        }
                      }}
                    />
                  </li>
                ))}
              </ul>
            </VariantGroupSection>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? "Editar variante" : "Nova variante"}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
      >
        <VariantForm
          initial={editing}
          attributes={attributes}
          readOnlyEstoque={Boolean(editing)}
          onCancel={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSubmit={async (form) => {
            try {
              await saveMutation.mutateAsync(form);
            } catch (error) {
              throw new Error(getErrorMessage(error));
            }
          }}
        />
      </Modal>

      <Modal open={generateOpen} title="Gerar combinações" onClose={() => setGenerateOpen(false)}>
        <div className="space-y-4">
          {attributes.map((attribute) => (
            <div key={attribute.id}>
              <p className="mb-2 text-sm font-medium text-brand-black">{attribute.nome}</p>
              <div className="flex flex-wrap gap-2">
                {attribute.valores.map((value) => {
                  const selected = selectedValues[attribute.id]?.includes(value.id);
                  return (
                    <button
                      key={value.id}
                      type="button"
                      onClick={() => toggleValue(attribute.id, value.id)}
                      className={cn(
                        "border px-3 py-1.5 text-sm",
                        selected
                          ? "border-brand-black bg-brand-black text-brand-white"
                          : "border-neutral-300",
                      )}
                    >
                      {value.valor}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Estoque inicial"
              type="number"
              value={estoqueInicial}
              onChange={(e) => setEstoqueInicial(e.target.value)}
            />
            <Input
              label="Estoque mínimo"
              type="number"
              value={estoqueMinimo}
              onChange={(e) => setEstoqueMinimo(e.target.value)}
            />
          </div>

          <p className="text-sm text-brand-gray">
            Combinações a gerar: <strong>{estimatedCombinations}</strong>
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setGenerateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending || estimatedCombinations === 0}
            >
              {generateMutation.isPending ? "Gerando..." : "Gerar"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={bulkOpen} title="Alteração em lote" onClose={() => setBulkOpen(false)}>
        <div className="space-y-4">
          <p className="text-sm text-brand-gray">
            Atualizando {selectedIds.length} variante(s). Deixe em branco os campos que não deseja
            alterar.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Preço"
              type="number"
              step="0.01"
              value={bulkForm.preco}
              onChange={(e) => setBulkForm((current) => ({ ...current, preco: e.target.value }))}
            />
            <Input
              label="Custo"
              type="number"
              step="0.01"
              value={bulkForm.custo}
              onChange={(e) => setBulkForm((current) => ({ ...current, custo: e.target.value }))}
            />
            <Input
              label="Estoque mínimo"
              type="number"
              value={bulkForm.estoqueMinimo}
              onChange={(e) =>
                setBulkForm((current) => ({ ...current, estoqueMinimo: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-black">Ativo</label>
            <select
              className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
              value={bulkForm.ativo}
              onChange={(e) =>
                setBulkForm((current) => ({
                  ...current,
                  ativo: e.target.value as "" | "true" | "false",
                }))
              }
            >
              <option value="">Não alterar</option>
              <option value="true">Ativar</option>
              <option value="false">Desativar</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBulkOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => bulkMutation.mutate()} disabled={bulkMutation.isPending}>
              {bulkMutation.isPending ? "Salvando..." : "Aplicar"}
            </Button>
          </div>
        </div>
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

function VariantGroupSection({
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

function VariantRow({
  variant,
  product,
  selected,
  onToggleSelect,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  variant: ProductVariant;
  product: Product;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const image = getVariantImage(variant, product);
  const secondaryLabel = getVariantSecondaryLabel(variant);
  const displayPrice =
    variant.precoPromocional && variant.precoPromocional < variant.preco
      ? variant.precoPromocional
      : variant.preco;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:px-6",
        !variant.ativo && "bg-neutral-50",
        selected && "bg-brand-light/60",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="shrink-0"
          aria-label={`Selecionar variante ${variant.sku}`}
        />

        <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-neutral-200 bg-brand-light">
          {image ? (
            <img src={image.url} alt={formatVariantLabel(variant)} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-brand-gray">
              Sem foto
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-brand-black">
              {secondaryLabel ?? formatVariantLabel(variant)}
            </p>
            <StatusBadge active={variant.ativo} label={variant.ativo ? "Ativa" : "Inativa"} />
            <StockBadge status={variant.statusEstoque} />
          </div>

          <p className="mt-1 font-mono text-xs text-brand-gray">{variant.sku}</p>

          {secondaryLabel ? (
            <p className="mt-1 text-sm text-brand-gray">{formatVariantLabel(variant)}</p>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold text-brand-black">{formatCurrency(displayPrice)}</span>
            {variant.precoPromocional && variant.precoPromocional < variant.preco ? (
              <span className="text-xs text-brand-gray line-through">
                {formatCurrency(variant.preco)}
              </span>
            ) : null}
            <span className="text-xs text-brand-gray">
              Estoque: <strong className="text-brand-black">{variant.estoque}</strong>
            </span>
            <span className="text-xs text-brand-gray">Mín.: {variant.estoqueMinimo}</span>
            {variant.codigoBarras ? (
              <span className="text-xs text-brand-gray">EAN: {variant.codigoBarras}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Button size="sm" variant="outline" onClick={onEdit}>
          Editar
        </Button>
        <Button size="sm" variant="ghost" onClick={onToggleActive}>
          {variant.ativo ? "Desativar" : "Ativar"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete}>
          Excluir
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        active ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-brand-gray",
      )}
    >
      {label}
    </span>
  );
}

function StockBadge({ status }: { status: StockStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        status === "em_estoque" && "bg-emerald-100 text-emerald-800",
        status === "estoque_baixo" && "bg-amber-100 text-amber-800",
        status === "sem_estoque" && "bg-red-100 text-red-800",
      )}
    >
      {STOCK_STATUS_LABELS[status]}
    </span>
  );
}
