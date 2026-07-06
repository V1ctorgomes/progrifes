"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { CategoryInput } from "@/lib/admin-api";
import type { Category } from "@/types/category";

interface CategoryFormProps {
  initial?: Category | null;
  categories: Category[];
  onSubmit: (data: CategoryInput) => Promise<void>;
  onCancel: () => void;
}

const emptyForm: CategoryInput = {
  nome: "",
  slug: "",
  descricao: "",
  imagem: "",
  banner: "",
  categoriaPaiId: null,
  ativo: true,
};

export function CategoryForm({
  initial,
  categories,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const [form, setForm] = useState<CategoryInput>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parentOptions = categories.filter((category) => category.id !== initial?.id);

  useEffect(() => {
    if (initial) {
      setForm({
        nome: initial.nome,
        slug: initial.slug,
        descricao: initial.descricao,
        imagem: initial.imagem,
        banner: initial.banner,
        categoriaPaiId: initial.categoriaPai,
        ativo: initial.ativo,
      });
    } else {
      setForm(emptyForm);
    }
  }, [initial]);

  const update = (field: keyof CategoryInput, value: string | boolean | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar categoria");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Nome" value={form.nome} onChange={(e) => update("nome", e.target.value)} required />
      <Input
        label="Slug"
        value={form.slug ?? ""}
        onChange={(e) => update("slug", e.target.value)}
        placeholder="gerado-automaticamente"
      />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-brand-black">Descrição</label>
        <textarea
          className="min-h-24 w-full border border-neutral-300 px-4 py-2.5 text-sm"
          value={form.descricao}
          onChange={(e) => update("descricao", e.target.value)}
          required
        />
      </div>

      <Input
        label="Imagem (URL)"
        value={form.imagem}
        onChange={(e) => update("imagem", e.target.value)}
        required
      />
      <Input
        label="Banner (URL)"
        value={form.banner}
        onChange={(e) => update("banner", e.target.value)}
        required
      />

      {form.imagem && (
        <img src={form.imagem} alt="Preview" className="h-32 w-full rounded object-cover" />
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-brand-black">Categoria pai</label>
        <select
          className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
          value={form.categoriaPaiId ?? ""}
          onChange={(e) => update("categoriaPaiId", e.target.value || null)}
        >
          <option value="">Nenhuma (categoria raiz)</option>
          {parentOptions.map((category) => (
            <option key={category.id} value={category.id}>
              {category.nome}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-brand-black">
        <input
          type="checkbox"
          checked={form.ativo ?? true}
          onChange={(e) => update("ativo", e.target.checked)}
        />
        Categoria ativa
      </label>

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
