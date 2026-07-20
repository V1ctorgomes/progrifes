"use client";

import { useEffect, useMemo, useState } from "react";
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

const fieldClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-black outline-none transition-colors focus:border-brand-black focus:ring-1 focus:ring-brand-black";

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
        <Input
          label="Nome interno"
          value={form.nome ?? ""}
          onChange={(e) => update("nome", e.target.value)}
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-black">Tipo</label>
          <select
            className={fieldClass}
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
            <p className="mt-1.5 text-xs font-medium text-neutral-400">{selectedTypeLimitMessage}</p>
          ) : null}
          {!initial && availableTypes.length === 0 ? (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              Todos os tipos com limite já foram utilizados.
            </p>
          ) : null}
        </div>
      </div>

      <Input
        label="Título"
        value={form.titulo}
        onChange={(e) => update("titulo", e.target.value)}
        required
      />
      <Input
        label="Subtítulo"
        value={form.subtitulo ?? ""}
        onChange={(e) => update("subtitulo", e.target.value)}
      />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-brand-black">Descrição</label>
        <textarea
          className={`min-h-24 ${fieldClass}`}
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

      {form.imagemDesktop ? (
        <img
          src={form.imagemDesktop}
          alt="Preview"
          className="h-32 w-full rounded-xl border border-neutral-100 object-cover"
        />
      ) : null}

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

      <label className="flex items-center gap-2 text-sm font-medium text-brand-black">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-neutral-300"
          checked={form.ativo ?? true}
          onChange={(e) => update("ativo", e.target.checked)}
        />
        Banner ativo
      </label>

      {error ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-3 border-t border-neutral-100 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 text-sm font-semibold text-brand-black shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || (!initial && availableTypes.length === 0)}
          className="flex h-11 items-center justify-center rounded-xl bg-brand-black px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}
