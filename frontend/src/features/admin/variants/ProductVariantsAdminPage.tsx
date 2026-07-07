"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
import type { ProductVariant } from "@/types/variant";
import { STOCK_STATUS_LABELS } from "@/types/variant";

interface ProductVariantsAdminPageProps {
  product: Product;
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

  const allSelected = variants.length > 0 && selectedIds.length === variants.length;

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : variants.map((variant) => variant.id));
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/produtos" className="text-sm text-brand-gray underline">
            ← Voltar para produtos
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            Variantes
          </h1>
          <p className="text-sm text-brand-gray">{product.nome}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setGenerateOpen(true)}>
            Gerar combinações
          </Button>
          <Button
            variant="outline"
            disabled={selectedIds.length === 0}
            onClick={() => setBulkOpen(true)}
          >
            Alteração em lote ({selectedIds.length})
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            Nova variante
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-brand-gray">Carregando variantes...</p>
      ) : variants.length === 0 ? (
        <p className="text-sm text-brand-gray">
          Nenhuma variante cadastrada. Crie manualmente ou gere combinações automaticamente.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-neutral-200 text-sm">
            <thead className="bg-brand-light">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                </th>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">Combinação</th>
                <th className="px-4 py-3 text-left">Preço</th>
                <th className="px-4 py-3 text-left">Estoque</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Ativo</th>
                <th className="px-4 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => (
                <tr key={variant.id} className="border-t border-neutral-200">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(variant.id)}
                      onChange={() =>
                        setSelectedIds((current) =>
                          current.includes(variant.id)
                            ? current.filter((id) => id !== variant.id)
                            : [...current, variant.id],
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{variant.sku}</td>
                  <td className="px-4 py-3">{formatVariantLabel(variant)}</td>
                  <td className="px-4 py-3">
                    R$ {variant.preco.toFixed(2).replace(".", ",")}
                  </td>
                  <td className="px-4 py-3">{variant.estoque}</td>
                  <td className="px-4 py-3">{STOCK_STATUS_LABELS[variant.statusEstoque]}</td>
                  <td className="px-4 py-3">{variant.ativo ? "Sim" : "Não"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(variant);
                          setModalOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          toggleMutation.mutate({ id: variant.id, ativo: variant.ativo })
                        }
                      >
                        {variant.ativo ? "Desativar" : "Ativar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Excluir esta variante?")) {
                            deleteMutation.mutate(variant.id);
                          }
                        }}
                      >
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      <Modal
        open={generateOpen}
        title="Gerar combinações"
        onClose={() => setGenerateOpen(false)}
      >
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
                      className={`border px-3 py-1.5 text-sm ${
                        selected
                          ? "border-brand-black bg-brand-black text-brand-white"
                          : "border-neutral-300"
                      }`}
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
            Atualizando {selectedIds.length} variante(s). Deixe em branco os campos que não
            deseja alterar.
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
