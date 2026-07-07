"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  BANNER_TYPE_LABELS,
  getBannerLimitError,
  getBannerLimitMessage,
  isBannerTypeAtLimit,
} from "@/lib/banner-config";
import type { BannerInput } from "@/lib/admin-api";
import type { Banner, BannerType } from "@/types/banner";

const bannerTypes = (Object.keys(BANNER_TYPE_LABELS) as BannerType[]).map((value) => ({
  value,
  label: BANNER_TYPE_LABELS[value],
}));

interface BannerFormProps {
  initial?: Banner | null;
  existingBanners?: Banner[];
  defaultType?: BannerType;
  onSubmit: (data: BannerInput) => Promise<void>;
  onCancel: () => void;
}

const emptyForm: BannerInput = {
  nome: "",
  titulo: "",
  subtitulo: "",
  descricao: "",
  imagemDesktop: "",
  imagemMobile: "",
  tipo: "hero",
  textoBotaoPrimario: "",
  textoBotaoSecundario: "",
  linkPrimario: "",
  linkSecundario: "",
  ativo: true,
};

export function BannerForm({
  initial,
  existingBanners = [],
  defaultType = "hero",
  onSubmit,
  onCancel,
}: BannerFormProps) {
  const [form, setForm] = useState<BannerInput>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setForm({
        nome: initial.nome,
        titulo: initial.titulo,
        subtitulo: initial.subtitulo ?? "",
        descricao: initial.descricao ?? "",
        imagemDesktop: initial.imagemDesktop,
        imagemMobile: initial.imagemMobile ?? "",
        tipo: initial.tipo,
        textoBotaoPrimario: initial.textoBotaoPrimario ?? "",
        textoBotaoSecundario: initial.textoBotaoSecundario ?? "",
        linkPrimario: initial.linkPrimario ?? "",
        linkSecundario: initial.linkSecundario ?? "",
        ativo: initial.ativo,
      });
    } else {
      setForm({ ...emptyForm, tipo: defaultType });
    }
  }, [initial, defaultType]);

  const availableTypes = useMemo(
    () =>
      bannerTypes.filter(
        (type) => !isBannerTypeAtLimit(existingBanners, type.value, initial?.id),
      ),
    [existingBanners, initial?.id],
  );

  const selectedTypeLimitMessage = getBannerLimitMessage(form.tipo);

  const update = <K extends keyof BannerInput>(field: K, value: BannerInput[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const limitError = getBannerLimitError(existingBanners, form.tipo, initial?.id);
    if (limitError) {
      setError(limitError);
      setLoading(false);
      return;
    }

    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar banner");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nome interno" value={form.nome ?? ""} onChange={(e) => update("nome", e.target.value)} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-black">Tipo</label>
          <select
            className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
            value={form.tipo}
            onChange={(e) => update("tipo", e.target.value as BannerType)}
          >
            {bannerTypes.map((type) => {
              const atLimit = isBannerTypeAtLimit(existingBanners, type.value, initial?.id);
              const isCurrentType = initial?.tipo === type.value;

              return (
                <option key={type.value} value={type.value} disabled={atLimit && !isCurrentType}>
                  {type.label}
                  {atLimit && !isCurrentType ? " (limite atingido)" : ""}
                </option>
              );
            })}
          </select>
          {selectedTypeLimitMessage ? (
            <p className="mt-1.5 text-xs text-brand-gray">{selectedTypeLimitMessage}</p>
          ) : null}
          {!initial && availableTypes.length === 0 ? (
            <p className="mt-1.5 text-xs text-red-600">
              Todos os tipos com limite já foram utilizados.
            </p>
          ) : null}
        </div>
      </div>

      <Input label="Título" value={form.titulo} onChange={(e) => update("titulo", e.target.value)} required />
      <Input label="Subtítulo" value={form.subtitulo ?? ""} onChange={(e) => update("subtitulo", e.target.value)} />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-brand-black">Descrição</label>
        <textarea
          className="min-h-24 w-full border border-neutral-300 px-4 py-2.5 text-sm"
          value={form.descricao ?? ""}
          onChange={(e) => update("descricao", e.target.value)}
        />
      </div>

      <Input
        label="Imagem desktop (URL)"
        value={form.imagemDesktop}
        onChange={(e) => update("imagemDesktop", e.target.value)}
        required
      />
      <Input
        label="Imagem mobile (URL)"
        value={form.imagemMobile ?? ""}
        onChange={(e) => update("imagemMobile", e.target.value)}
      />

      {form.imagemDesktop && (
        <img src={form.imagemDesktop} alt="Preview" className="h-32 w-full rounded object-cover" />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Texto botão primário"
          value={form.textoBotaoPrimario ?? ""}
          onChange={(e) => update("textoBotaoPrimario", e.target.value)}
        />
        <Input
          label="Link primário"
          value={form.linkPrimario ?? ""}
          onChange={(e) => update("linkPrimario", e.target.value)}
        />
        <Input
          label="Texto botão secundário"
          value={form.textoBotaoSecundario ?? ""}
          onChange={(e) => update("textoBotaoSecundario", e.target.value)}
        />
        <Input
          label="Link secundário"
          value={form.linkSecundario ?? ""}
          onChange={(e) => update("linkSecundario", e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-brand-black">
        <input
          type="checkbox"
          checked={form.ativo ?? true}
          onChange={(e) => update("ativo", e.target.checked)}
        />
        Banner ativo
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || (!initial && availableTypes.length === 0)}>
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
