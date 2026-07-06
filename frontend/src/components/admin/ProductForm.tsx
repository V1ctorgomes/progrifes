"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ProductInput } from "@/types/product";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";

interface ProductFormProps {
  initial?: Product | null;
  categories: Category[];
  onSubmit: (data: ProductInput) => Promise<void>;
  onCancel: () => void;
}

const emptyForm: ProductInput = {
  nome: "",
  slug: "",
  descricaoCurta: "",
  descricaoCompleta: "",
  categoriaId: "",
  codigoInterno: "",
  marca: "",
  preco: 0,
  precoPromocional: undefined,
  custo: undefined,
  mostrarPrecoPromocional: false,
  ativo: true,
  destaque: false,
  novo: false,
  imagens: [{ url: "", principal: true }],
};

export function ProductForm({
  initial,
  categories,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [form, setForm] = useState<ProductInput>(emptyForm);
  const [categorySearch, setCategorySearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    const term = categorySearch.toLowerCase().trim();
    if (!term) return categories;
    return categories.filter(
      (category) =>
        category.nome.toLowerCase().includes(term) ||
        category.slug.toLowerCase().includes(term),
    );
  }, [categories, categorySearch]);

  useEffect(() => {
    if (initial) {
      setForm({
        nome: initial.nome,
        slug: initial.slug,
        descricaoCurta: initial.descricaoCurta,
        descricaoCompleta: initial.descricaoCompleta,
        categoriaId: initial.categoriaId,
        codigoInterno: initial.codigoInterno ?? "",
        marca: initial.marca ?? "",
        preco: initial.preco,
        precoPromocional: initial.precoPromocional ?? undefined,
        custo: initial.custo ?? undefined,
        mostrarPrecoPromocional: initial.mostrarPrecoPromocional,
        ativo: initial.ativo,
        destaque: initial.destaque,
        novo: initial.novo,
        imagens: initial.imagens.map((image) => ({
          url: image.url,
          ordem: image.ordem,
          principal: image.principal,
        })),
      });
      setCategorySearch(initial.categoria.nome);
    } else {
      setForm(emptyForm);
      setCategorySearch("");
    }
  }, [initial]);

  const update = (field: keyof ProductInput, value: ProductInput[keyof ProductInput]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateImage = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      imagens: prev.imagens.map((image, imageIndex) =>
        imageIndex === index ? { ...image, url: value } : image,
      ),
    }));
  };

  const setPrincipalImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      imagens: prev.imagens.map((image, imageIndex) => ({
        ...image,
        principal: imageIndex === index,
      })),
    }));
  };

  const addImage = () => {
    setForm((prev) => ({
      ...prev,
      imagens: [...prev.imagens, { url: "", principal: false, ordem: prev.imagens.length + 1 }],
    }));
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      imagens: prev.imagens.filter((_, imageIndex) => imageIndex !== index),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        ...form,
        imagens: form.imagens.filter((image) => image.url.trim()),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar produto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nome"
        value={form.nome}
        onChange={(e) => update("nome", e.target.value)}
        required
      />
      <Input
        label="Slug"
        value={form.slug ?? ""}
        onChange={(e) => update("slug", e.target.value)}
        placeholder="gerado-automaticamente"
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-brand-black">Categoria</label>
        <Input
          value={categorySearch}
          onChange={(e) => setCategorySearch(e.target.value)}
          placeholder="Buscar categoria..."
        />
        <select
          className="mt-2 w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
          value={form.categoriaId}
          onChange={(e) => update("categoriaId", e.target.value)}
          required
        >
          <option value="">Selecione uma categoria</option>
          {filteredCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.nome}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Descrição curta"
        value={form.descricaoCurta}
        onChange={(e) => update("descricaoCurta", e.target.value)}
        required
      />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-brand-black">
          Descrição completa
        </label>
        <textarea
          className="min-h-32 w-full border border-neutral-300 px-4 py-2.5 text-sm"
          value={form.descricaoCompleta}
          onChange={(e) => update("descricaoCompleta", e.target.value)}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Preço"
          type="number"
          min="0"
          step="0.01"
          value={form.preco}
          onChange={(e) => update("preco", Number(e.target.value))}
          required
        />
        <Input
          label="Preço promocional"
          type="number"
          min="0"
          step="0.01"
          value={form.precoPromocional ?? ""}
          onChange={(e) =>
            update("precoPromocional", e.target.value ? Number(e.target.value) : undefined)
          }
        />
        <Input
          label="Custo"
          type="number"
          min="0"
          step="0.01"
          value={form.custo ?? ""}
          onChange={(e) => update("custo", e.target.value ? Number(e.target.value) : undefined)}
        />
        <Input
          label="Código interno"
          value={form.codigoInterno ?? ""}
          onChange={(e) => update("codigoInterno", e.target.value)}
        />
        <Input
          label="Marca"
          value={form.marca ?? ""}
          onChange={(e) => update("marca", e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.mostrarPrecoPromocional ?? false}
            onChange={(e) => update("mostrarPrecoPromocional", e.target.checked)}
          />
          Mostrar preço promocional
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.ativo ?? true}
            onChange={(e) => update("ativo", e.target.checked)}
          />
          Ativo
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.destaque ?? false}
            onChange={(e) => update("destaque", e.target.checked)}
          />
          Destaque
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.novo ?? false}
            onChange={(e) => update("novo", e.target.checked)}
          />
          Novo
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-brand-black">Galeria de imagens (URLs)</p>
          <Button type="button" size="sm" variant="outline" onClick={addImage}>
            Adicionar imagem
          </Button>
        </div>
        {form.imagens.map((image, index) => (
          <div key={index} className="rounded border border-neutral-200 p-3">
            <Input
              label={`Imagem ${index + 1}`}
              value={image.url}
              onChange={(e) => updateImage(index, e.target.value)}
              required={index === 0}
            />
            {image.url && (
              <img src={image.url} alt="" className="mt-2 h-24 w-full rounded object-cover" />
            )}
            <div className="mt-2 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="principal"
                  checked={Boolean(image.principal)}
                  onChange={() => setPrincipalImage(index)}
                />
                Imagem principal
              </label>
              {form.imagens.length > 1 && (
                <button
                  type="button"
                  className="text-xs text-red-600"
                  onClick={() => removeImage(index)}
                >
                  Remover
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
