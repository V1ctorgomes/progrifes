"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { BannerForm } from "@/components/admin/BannerForm";
import { Modal } from "@/components/admin/Modal";
import {
  BANNER_LIMITS,
  BANNER_TYPE_ORDER,
  countBannersByType,
  getBannerLimitMessage,
  getBannerTypeLabel,
  isBannerTypeAtLimit,
} from "@/lib/banner-config";
import { bannersAdminApi, getErrorMessage, type BannerInput } from "@/lib/admin-api";
import type { Banner, BannerType } from "@/types/banner";
import { cn } from "@/utils/cn";

function sortBanners(banners: Banner[]) {
  return [...banners].sort((a, b) => a.ordem - b.ordem || a.titulo.localeCompare(b.titulo));
}

export function BannersAdminPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [createType, setCreateType] = useState<BannerType>("hero");

  const { data: banners = [], isLoading, isFetching, refetch, isError } = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: bannersAdminApi.list,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });

  const saveMutation = useMutation({
    mutationFn: async (payload: BannerInput) => {
      if (editing) {
        return bannersAdminApi.update(editing.id, payload);
      }
      return bannersAdminApi.create(payload);
    },
    onSuccess: async () => {
      await invalidate();
      setModalOpen(false);
      setEditing(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) =>
      ativo ? bannersAdminApi.deactivate(id) : bannersAdminApi.activate(id),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: bannersAdminApi.remove,
    onSuccess: invalidate,
  });

  const reorderMutation = useMutation({
    mutationFn: bannersAdminApi.reorder,
    onSuccess: invalidate,
  });

  const groupedBanners = useMemo(() => {
    const groups = Object.fromEntries(
      BANNER_TYPE_ORDER.map((tipo) => [tipo, [] as Banner[]]),
    ) as Record<BannerType, Banner[]>;

    for (const banner of sortBanners(banners)) {
      groups[banner.tipo].push(banner);
    }

    return groups;
  }, [banners]);

  const moveBanner = (tipo: BannerType, id: string, direction: "up" | "down") => {
    const typeBanners = groupedBanners[tipo];
    const index = typeBanners.findIndex((banner) => banner.id === id);
    if (index < 0) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= typeBanners.length) return;

    const ids = typeBanners.map((banner) => banner.id);
    [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];
    reorderMutation.mutate(ids);
  };

  const openCreate = (tipo: BannerType) => {
    setEditing(null);
    setCreateType(tipo);
    setModalOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setEditing(banner);
    setModalOpen(true);
  };

  const totalBanners = banners.length;
  const activeBanners = banners.filter((banner) => banner.ativo).length;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <RefreshCw className="h-8 w-8 animate-spin text-neutral-300" />
        <p className="text-sm font-medium text-neutral-500">Carregando banners...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-100 bg-white shadow-sm">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="text-sm font-medium text-neutral-500">
          Não foi possível carregar os banners.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded-xl bg-brand-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-brand-black">
            Banners
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Organize os banners exibidos na vitrine da loja por tipo e ordem de exibição.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex h-11 w-fit shrink-0 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 text-sm font-semibold text-brand-black shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4 text-neutral-500", isFetching && "animate-spin")} />
            {isFetching ? "Atualizando..." : "Atualizar"}
          </button>
          <button
            type="button"
            onClick={() => openCreate("hero")}
            className="flex h-11 w-fit shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-black px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Novo banner
          </button>
        </div>
      </div>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-neutral-500">Total</p>
          <p className="mt-4 font-display text-3xl font-bold text-brand-black">{totalBanners}</p>
        </div>
        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-neutral-500">Ativos</p>
          <p className="mt-4 font-display text-3xl font-bold text-brand-black">{activeBanners}</p>
        </div>
        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-neutral-500">Inativos</p>
          <p className="mt-4 font-display text-3xl font-bold text-brand-black">
            {totalBanners - activeBanners}
          </p>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {BANNER_TYPE_ORDER.map((tipo) => {
          const count = countBannersByType(banners, tipo);
          const limit = BANNER_LIMITS[tipo] ?? 0;
          const atLimit = isBannerTypeAtLimit(banners, tipo);

          return (
            <div
              key={tipo}
              className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-black hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-neutral-500">{getBannerTypeLabel(tipo)}</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-50 text-neutral-400">
                  <ImageIcon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-4 font-display text-3xl font-bold text-brand-black">
                {count}
                <span className="text-base font-medium text-neutral-400"> / {limit}</span>
              </p>
              <p className="mt-2 text-xs font-medium text-neutral-400">
                {atLimit ? "Limite atingido" : getBannerLimitMessage(tipo)}
              </p>
            </div>
          );
        })}
      </section>

      <div className="space-y-6">
        {BANNER_TYPE_ORDER.map((tipo) => (
          <BannerTypeSection
            key={tipo}
            tipo={tipo}
            banners={groupedBanners[tipo]}
            atLimit={isBannerTypeAtLimit(banners, tipo)}
            isReordering={reorderMutation.isPending}
            onCreate={() => openCreate(tipo)}
            onEdit={openEdit}
            onToggle={(banner) =>
              toggleMutation.mutate({ id: banner.id, ativo: banner.ativo })
            }
            onDelete={(id) => {
              if (confirm("Excluir este banner?")) {
                deleteMutation.mutate(id);
              }
            }}
            onMove={(id, direction) => moveBanner(tipo, id, direction)}
          />
        ))}
      </div>

      <Modal
        open={modalOpen}
        title={editing ? "Editar banner" : "Novo banner"}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
      >
        <BannerForm
          initial={editing}
          existingBanners={banners}
          defaultType={editing?.tipo ?? createType}
          onCancel={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSubmit={async (data) => {
            try {
              await saveMutation.mutateAsync(data);
            } catch (error) {
              throw new Error(getErrorMessage(error));
            }
          }}
        />
      </Modal>
    </div>
  );
}

interface BannerTypeSectionProps {
  tipo: BannerType;
  banners: Banner[];
  atLimit: boolean;
  isReordering: boolean;
  onCreate: () => void;
  onEdit: (banner: Banner) => void;
  onToggle: (banner: Banner) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
}

function BannerTypeSection({
  tipo,
  banners,
  atLimit,
  isReordering,
  onCreate,
  onEdit,
  onToggle,
  onDelete,
  onMove,
}: BannerTypeSectionProps) {
  const limit = BANNER_LIMITS[tipo] ?? 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-brand-black">
              {getBannerTypeLabel(tipo)}
            </h2>
            <p className="text-xs font-medium text-neutral-400">
              {banners.length} de {limit} · {getBannerLimitMessage(tipo)}
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={atLimit}
          onClick={onCreate}
          className="flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-brand-black shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </button>
      </div>

      {banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-5 py-12 text-center">
          <ImageIcon className="h-8 w-8 text-neutral-300" />
          <p className="text-sm text-neutral-500">
            Nenhum banner {getBannerTypeLabel(tipo).toLowerCase()} cadastrado.
          </p>
          {!atLimit ? (
            <button
              type="button"
              onClick={onCreate}
              className="mt-1 rounded-xl bg-brand-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
            >
              Criar primeiro banner
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {banners.map((banner, index) => (
            <li
              key={banner.id}
              className={cn(
                "flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-neutral-50/80 sm:flex-row sm:items-center",
                !banner.ativo && "bg-neutral-50/60",
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50">
                  <img
                    src={banner.imagemDesktop}
                    alt={banner.titulo}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute left-1.5 top-1.5 rounded-md bg-brand-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    #{banner.ordem}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-brand-black">{banner.titulo}</p>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                        banner.ativo
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-neutral-100 text-neutral-600",
                      )}
                    >
                      {banner.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  {banner.nome ? (
                    <p className="mt-1 truncate text-xs font-medium text-neutral-400">
                      {banner.nome}
                    </p>
                  ) : null}
                  {banner.subtitulo ? (
                    <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{banner.subtitulo}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <div className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    disabled={index === 0 || isReordering}
                    onClick={() => onMove(banner.id, "up")}
                    aria-label="Mover para cima"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-brand-black disabled:opacity-40"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={index === banners.length - 1 || isReordering}
                    onClick={() => onMove(banner.id, "down")}
                    aria-label="Mover para baixo"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-brand-black disabled:opacity-40"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onEdit(banner)}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-brand-black shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onToggle(banner)}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-brand-black shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50"
                >
                  <Power className="h-3.5 w-3.5" />
                  {banner.ativo ? "Desativar" : "Ativar"}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(banner.id)}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-red-100 bg-white px-3 text-xs font-semibold text-red-600 shadow-sm transition-all hover:border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
