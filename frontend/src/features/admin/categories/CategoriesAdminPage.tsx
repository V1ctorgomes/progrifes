"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/Button";
import { categoriesAdminApi, getErrorMessage, type CategoryInput } from "@/lib/admin-api";
import type { Category } from "@/types/category";

function getParentName(categories: Category[], parentId: string | null) {
  if (!parentId) return "—";
  return categories.find((category) => category.id === parentId)?.nome ?? "—";
}

export function CategoriesAdminPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: categoriesAdminApi.list,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });

  const saveMutation = useMutation({
    mutationFn: async (payload: CategoryInput) => {
      if (editing) {
        return categoriesAdminApi.update(editing.id, payload);
      }
      return categoriesAdminApi.create(payload);
    },
    onSuccess: async () => {
      await invalidate();
      setModalOpen(false);
      setEditing(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) =>
      ativo ? categoriesAdminApi.deactivate(id) : categoriesAdminApi.activate(id),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: categoriesAdminApi.remove,
    onSuccess: invalidate,
  });

  const reorderMutation = useMutation({
    mutationFn: categoriesAdminApi.reorder,
    onSuccess: invalidate,
  });

  const sortedCategories = useMemo(
    () =>
      [...categories].sort(
        (a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome),
      ),
    [categories],
  );

  const moveCategory = (id: string, direction: "up" | "down") => {
    const index = sortedCategories.findIndex((category) => category.id === id);
    if (index < 0) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedCategories.length) return;

    const ids = sortedCategories.map((category) => category.id);
    [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];
    reorderMutation.mutate(ids);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            Categorias
          </h1>
          <p className="text-sm text-brand-gray">Gerencie as categorias da loja</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          Nova categoria
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-brand-gray">Carregando categorias...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-neutral-200 text-sm">
            <thead className="bg-brand-light">
              <tr>
                <th className="px-4 py-3 text-left">Imagem</th>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">Slug</th>
                <th className="px-4 py-3 text-left">Pai</th>
                <th className="px-4 py-3 text-left">Ordem</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedCategories.map((category) => (
                <tr key={category.id} className="border-t border-neutral-200">
                  <td className="px-4 py-3">
                    <img
                      src={category.imagem}
                      alt={category.nome}
                      className="h-12 w-12 rounded object-cover"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">{category.nome}</td>
                  <td className="px-4 py-3 text-brand-gray">{category.slug}</td>
                  <td className="px-4 py-3">
                    {getParentName(categories, category.categoriaPai)}
                  </td>
                  <td className="px-4 py-3">{category.ordem}</td>
                  <td className="px-4 py-3">
                    {category.ativo ? "Ativo" : "Inativo"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(category);
                          setModalOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          toggleMutation.mutate({ id: category.id, ativo: category.ativo })
                        }
                      >
                        {category.ativo ? "Desativar" : "Ativar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveCategory(category.id, "up")}
                      >
                        ↑
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveCategory(category.id, "down")}
                      >
                        ↓
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Excluir esta categoria?")) {
                            deleteMutation.mutate(category.id);
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
        title={editing ? "Editar categoria" : "Nova categoria"}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
      >
        <CategoryForm
          initial={editing}
          categories={categories}
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
