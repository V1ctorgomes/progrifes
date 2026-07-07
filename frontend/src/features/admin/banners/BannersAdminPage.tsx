"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { BannerForm } from "@/components/admin/BannerForm";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/Button";
import { getBannerTypeLabel } from "@/lib/banner-config";
import { bannersAdminApi, getErrorMessage, type BannerInput } from "@/lib/admin-api";
import type { Banner } from "@/types/banner";

export function BannersAdminPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);

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

  const sortedBanners = useMemo(
    () => [...banners].sort((a, b) => a.ordem - b.ordem || a.titulo.localeCompare(b.titulo)),
    [banners],
  );

  const moveBanner = (id: string, direction: "up" | "down") => {
    const index = sortedBanners.findIndex((banner) => banner.id === id);
    if (index < 0) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedBanners.length) return;

    const ids = sortedBanners.map((banner) => banner.id);
    [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];
    reorderMutation.mutate(ids);
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setEditing(banner);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            Banners
          </h1>
          <p className="text-sm text-brand-gray">
            Principal: até 3 · Secundário: até 2 · Promocional: até 2 · Institucional: até 1
          </p>
        </div>
        <Button onClick={openCreate}>Novo banner</Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-brand-gray">Carregando banners...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-neutral-200 text-sm">
            <thead className="bg-brand-light">
              <tr>
                <th className="px-4 py-3 text-left">Preview</th>
                <th className="px-4 py-3 text-left">Título</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Ordem</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedBanners.map((banner) => (
                <tr key={banner.id} className="border-t border-neutral-200">
                  <td className="px-4 py-3">
                    <img
                      src={banner.imagemDesktop}
                      alt={banner.titulo}
                      className="h-12 w-20 rounded object-cover"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">{banner.titulo}</td>
                  <td className="px-4 py-3">{getBannerTypeLabel(banner.tipo)}</td>
                  <td className="px-4 py-3">{banner.ordem}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        banner.ativo ? "text-green-700" : "text-brand-gray line-through"
                      }
                    >
                      {banner.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(banner)}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          toggleMutation.mutate({ id: banner.id, ativo: banner.ativo })
                        }
                      >
                        {banner.ativo ? "Desativar" : "Ativar"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => moveBanner(banner.id, "up")}>
                        ↑
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => moveBanner(banner.id, "down")}>
                        ↓
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Excluir este banner?")) {
                            deleteMutation.mutate(banner.id);
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
        title={editing ? "Editar banner" : "Novo banner"}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
      >
        <BannerForm
          initial={editing}
          existingBanners={banners}
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
