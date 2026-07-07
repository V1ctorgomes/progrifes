"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Attribute } from "@/types/attribute";
import type { ProductVariant } from "@/types/variant";

export interface VariantFormData {
  sku: string;
  codigoBarras: string;
  preco: string;
  precoPromocional: string;
  custo: string;
  estoque: string;
  estoqueMinimo: string;
  ativo: boolean;
  attributeValueIds: string[];
  imagens: Array<{ url: string; ordem?: number; principal?: boolean }>;
}

interface VariantFormProps {
  initial?: ProductVariant | null;
  attributes: Attribute[];
  onSubmit: (data: VariantFormData) => Promise<void>;
  onCancel: () => void;
  readOnlyEstoque?: boolean;
}

const emptyForm: VariantFormData = {
  sku: "",
  codigoBarras: "",
  preco: "",
  precoPromocional: "",
  custo: "",
  estoque: "0",
  estoqueMinimo: "0",
  ativo: true,
  attributeValueIds: [],
  imagens: [{ url: "", principal: true }],
};

export function VariantForm({
  initial,
  attributes,
  onSubmit,
  onCancel,
  readOnlyEstoque = false,
}: VariantFormProps) {
  const [form, setForm] = useState<VariantFormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setForm({
        sku: initial.sku,
        codigoBarras: initial.codigoBarras ?? "",
        preco: initial.preco ? String(initial.preco) : "",
        precoPromocional: initial.precoPromocional ? String(initial.precoPromocional) : "",
        custo: initial.custo ? String(initial.custo) : "",
        estoque: String(initial.estoque),
        estoqueMinimo: String(initial.estoqueMinimo),
        ativo: initial.ativo,
        attributeValueIds: initial.atributos.map((attr) => attr.valueId),
        imagens: initial.imagens.length
          ? initial.imagens.map((image) => ({
              url: image.url,
              ordem: image.ordem,
              principal: image.principal,
            }))
          : [{ url: "", principal: true }],
      });
    } else {
      setForm(emptyForm);
    }
  }, [initial]);

  const toggleAttributeValue = (valueId: string, attributeId: string) => {
    setForm((current) => {
      const attribute = attributes.find((item) => item.id === attributeId);
      const otherValueIds = attribute
        ? attribute.valores.map((value) => value.id)
        : [];

      const withoutSameAttribute = current.attributeValueIds.filter(
        (id) => !otherValueIds.includes(id),
      );

      return {
        ...current,
        attributeValueIds: [...withoutSameAttribute, valueId],
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!form.sku.trim()) throw new Error("SKU é obrigatório");
      if (form.attributeValueIds.length === 0) {
        throw new Error("Selecione os valores dos atributos");
      }

      await onSubmit(form);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Input
        label="SKU"
        value={form.sku}
        onChange={(e) => setForm((current) => ({ ...current, sku: e.target.value }))}
        required
      />

      <Input
        label="Código de barras"
        value={form.codigoBarras}
        onChange={(e) => setForm((current) => ({ ...current, codigoBarras: e.target.value }))}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Preço"
          type="number"
          step="0.01"
          value={form.preco}
          onChange={(e) => setForm((current) => ({ ...current, preco: e.target.value }))}
        />
        <Input
          label="Preço promocional"
          type="number"
          step="0.01"
          value={form.precoPromocional}
          onChange={(e) =>
            setForm((current) => ({ ...current, precoPromocional: e.target.value }))
          }
        />
        <Input
          label="Custo"
          type="number"
          step="0.01"
          value={form.custo}
          onChange={(e) => setForm((current) => ({ ...current, custo: e.target.value }))}
        />
        {readOnlyEstoque ? (
          <div>
            <p className="mb-1.5 text-sm font-medium text-brand-black">Estoque</p>
            <p className="border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm">
              {form.estoque} (somente leitura)
            </p>
            <p className="mt-1 text-xs text-brand-gray">
              Use Entradas de Estoque para alterar o saldo.
            </p>
          </div>
        ) : (
          <Input
            label="Estoque inicial"
            type="number"
            value={form.estoque}
            onChange={(e) => setForm((current) => ({ ...current, estoque: e.target.value }))}
          />
        )}
        <Input
          label="Estoque mínimo"
          type="number"
          value={form.estoqueMinimo}
          onChange={(e) =>
            setForm((current) => ({ ...current, estoqueMinimo: e.target.value }))
          }
        />
      </div>

      {attributes.map((attribute) => (
        <div key={attribute.id}>
          <p className="mb-2 text-sm font-medium text-brand-black">{attribute.nome}</p>
          <div className="flex flex-wrap gap-2">
            {attribute.valores.map((value) => {
              const selected = form.attributeValueIds.includes(value.id);
              return (
                <button
                  key={value.id}
                  type="button"
                  onClick={() => toggleAttributeValue(value.id, attribute.id)}
                  className={`border px-3 py-1.5 text-sm ${
                    selected
                      ? "border-brand-black bg-brand-black text-brand-white"
                      : "border-neutral-300 text-brand-black"
                  }`}
                >
                  {value.valor}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div>
        <p className="mb-2 text-sm font-medium text-brand-black">Imagens da variante</p>
        {form.imagens.map((image, index) => (
          <div key={index} className="mb-2 flex gap-2">
            <Input
              label={`URL ${index + 1}`}
              value={image.url}
              onChange={(e) => {
                const imagens = [...form.imagens];
                imagens[index] = { ...imagens[index], url: e.target.value };
                setForm((current) => ({ ...current, imagens }));
              }}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            setForm((current) => ({
              ...current,
              imagens: [...current.imagens, { url: "" }],
            }))
          }
        >
          Adicionar imagem
        </Button>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.ativo}
          onChange={(e) => setForm((current) => ({ ...current, ativo: e.target.checked }))}
        />
        Variante ativa
      </label>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : initial ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}
