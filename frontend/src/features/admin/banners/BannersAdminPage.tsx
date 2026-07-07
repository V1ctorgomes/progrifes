"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { BannerForm } from "@/components/admin/BannerForm";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/Button";
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

  const { data: banners = [], isLoading } = useQuery({
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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            Banners
          </h1>
          <p className="mt-1 text-sm text-brand-gray">
            Organize os banners exibidos na vitrine da loja por tipo e ordem de exibição.
          </p>
        </div>
        <Button onClick={() => openCreate("hero")}>Novo banner</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {BANNER_TYPE_ORDER.map((tipo) => {
          const count = countBannersByType(banners, tipo);
          const limit = BANNER_LIMITS[tipo] ?? 0;
          const atLimit = isBannerTypeAtLimit(banners, tipo);

          return (
            <div
              key={tipo}
              className="border border-neutral-200 bg-brand-white p-4"
            >
              <p className="text-xs font-medium uppercase tracking-widest text-brand-gray">
                {getBannerTypeLabel(tipo)}
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-brand-black">
                {count}
                <span className="text-base font-normal text-brand-gray"> / {limit}</span>
              </p>
              <p className="mt-1 text-xs text-brand-gray">
                {atLimit ? "Limite atingido" : getBannerLimitMessage(tipo)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-brand-gray">
        <span>
          Total: <strong className="text-brand-black">{totalBanners}</strong>
        </span>
        <span>
          Ativos: <strong className="text-brand-black">{activeBanners}</strong>
        </span>
        <span>
          Inativos: <strong className="text-brand-black">{totalBanners - activeBanners}</strong>
        </span>
      </div>

      {isLoading ? (
        <p className="text-sm text-brand-gray">Carregando banners...</p>
      ) : (
        <div className="space-y-8">
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
      )}

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
    <section className="border border-neutral-200">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-brand-light px-4 py-3">
        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-brand-black">
            {getBannerTypeLabel(tipo)}
          </h2>
          <p className="text-xs text-brand-gray">
            {banners.length} de {limit} · {getBannerLimitMessage(tipo)}
          </p>
        </div>
        <Button size="sm" variant="outline" disabled={atLimit} onClick={onCreate}>
          Adicionar {getBannerTypeLabel(tipo).toLowerCase()}
        </Button>
      </div>

      {banners.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="text-sm text-brand-gray">
            Nenhum banner {getBannerTypeLabel(tipo).toLowerCase()} cadastrado.
          </p>
          {!atLimit ? (
            <Button size="sm" variant="ghost" className="mt-3" onClick={onCreate}>
              Criar primeiro banner
            </Button>
          ) : null}
        </div>
      ) : (
        <ul className="divide-y divide-neutral-200">
          {banners.map((banner, index) => (
            <li
              key={banner.id}
              className={cn(
                "flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center",
                !banner.ativo && "bg-neutral-50",
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="relative h-20 w-32 shrink-0 overflow-hidden border border-neutral-200 bg-brand-light">
                  <img
                    src={banner.imagemDesktop}
                    alt={banner.titulo}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute left-1 top-1 bg-brand-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-brand-white">
                    #{banner.ordem}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-brand-black">{banner.titulo}</p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        banner.ativo
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-neutral-200 text-brand-gray",
                      )}
                    >
                      {banner.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  {banner.nome ? (
                    <p className="mt-1 truncate text-xs text-brand-gray">{banner.nome}</p>
                  ) : null}
                  {banner.subtitulo ? (
                    <p className="mt-1 line-clamp-2 text-sm text-brand-gray">{banner.subtitulo}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <div className="flex items-center gap-1 border border-neutral-200 bg-brand-white p-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={index === 0 || isReordering}
                    onClick={() => onMove(banner.id, "up")}
                    aria-label="Mover para cima"
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={index === banners.length - 1 || isReordering}
                    onClick={() => onMove(banner.id, "down")}
                    aria-label="Mover para baixo"
                  >
                    ↓
                  </Button>
                </div>

                <Button size="sm" variant="outline" onClick={() => onEdit(banner)}>
                  Editar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onToggle(banner)}>
                  {banner.ativo ? "Desativar" : "Ativar"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(banner.id)}>
                  Excluir
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
