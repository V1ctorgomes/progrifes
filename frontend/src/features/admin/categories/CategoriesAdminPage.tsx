"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/Button";
import { categoriesAdminApi, getErrorMessage, type CategoryInput } from "@/lib/admin-api";
import {
  getChildCategoriesAll,
  getOrphanCategories,
  getRootCategories,
  getRootCategoriesAll,
  HOME_CATEGORIES_LIMIT,
} from "@/lib/categories";
import type { Category } from "@/types/category";
import { cn } from "@/utils/cn";

export function CategoriesAdminPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);

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
      setDefaultParentId(null);
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

  const rootCategories = useMemo(() => getRootCategoriesAll(categories), [categories]);
  const orphanCategories = useMemo(() => getOrphanCategories(categories), [categories]);
  const activeRoots = useMemo(() => getRootCategories(categories), [categories]);

  const moveCategory = (group: Category[], id: string, direction: "up" | "down") => {
    const index = group.findIndex((category) => category.id === id);
    if (index < 0) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= group.length) return;

    const ids = group.map((category) => category.id);
    [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];
    reorderMutation.mutate(ids);
  };

  const openCreate = (parentId: string | null = null) => {
    setEditing(null);
    setDefaultParentId(parentId);
    setModalOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setDefaultParentId(null);
    setModalOpen(true);
  };

  const totalCategories = categories.length;
  const activeCategories = categories.filter((category) => category.ativo).length;
  const subcategoriesCount = categories.filter((category) => category.categoriaPai).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            Categorias
          </h1>
          <p className="mt-1 text-sm text-brand-gray">
            Organize a hierarquia da loja. A home exibe até {HOME_CATEGORIES_LIMIT} categorias
            principais ativas.
          </p>
        </div>
        <Button onClick={() => openCreate(null)}>Nova categoria</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total" value={totalCategories} hint="Categorias cadastradas" />
        <SummaryCard
          label="Principais"
          value={rootCategories.length}
          hint={`${activeRoots.length} ativas na loja`}
        />
        <SummaryCard label="Subcategorias" value={subcategoriesCount} hint="Vinculadas a uma categoria pai" />
        <SummaryCard
          label="Ativas"
          value={activeCategories}
          hint={`${totalCategories - activeCategories} inativas`}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-brand-gray">Carregando categorias...</p>
      ) : (
        <div className="space-y-8">
          <CategorySection
            title="Categorias principais"
            description={`${rootCategories.length} categoria${rootCategories.length === 1 ? "" : "s"} raiz · ordem define exibição na home e em /categorias`}
            actionLabel="Nova categoria principal"
            onCreate={() => openCreate(null)}
            emptyMessage="Nenhuma categoria principal cadastrada."
            isReordering={reorderMutation.isPending}
          >
            {rootCategories.map((category, index) => {
              const children = getChildCategoriesAll(categories, category.id);

              return (
                <article
                  key={category.id}
                  className="overflow-hidden border border-neutral-200 bg-brand-white shadow-sm"
                >
                  <CategoryRow
                    category={category}
                    badge="Principal"
                    isFirst={index === 0}
                    isLast={index === rootCategories.length - 1}
                    isReordering={reorderMutation.isPending}
                    onMove={(direction) => moveCategory(rootCategories, category.id, direction)}
                    onEdit={() => openEdit(category)}
                    onToggle={() =>
                      toggleMutation.mutate({ id: category.id, ativo: category.ativo })
                    }
                    onDelete={() => {
                      if (confirm("Excluir esta categoria?")) {
                        deleteMutation.mutate(category.id);
                      }
                    }}
                  />

                  {children.length > 0 ? (
                    <div className="border-t border-neutral-200 bg-neutral-50/50">
                      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
                        <p className="text-xs font-medium uppercase tracking-wide text-brand-gray">
                          Subcategorias
                        </p>
                        <Button size="sm" variant="ghost" onClick={() => openCreate(category.id)}>
                          Adicionar subcategoria
                        </Button>
                      </div>
                      <ul className="divide-y divide-neutral-200 border-t border-neutral-200">
                        {children.map((child, childIndex) => (
                          <li key={child.id}>
                            <CategoryRow
                              category={child}
                              badge="Subcategoria"
                              nested
                              isFirst={childIndex === 0}
                              isLast={childIndex === children.length - 1}
                              isReordering={reorderMutation.isPending}
                              onMove={(direction) => moveCategory(children, child.id, direction)}
                              onEdit={() => openEdit(child)}
                              onToggle={() =>
                                toggleMutation.mutate({ id: child.id, ativo: child.ativo })
                              }
                              onDelete={() => {
                                if (confirm("Excluir esta subcategoria?")) {
                                  deleteMutation.mutate(child.id);
                                }
                              }}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="border-t border-neutral-200 bg-neutral-50/40 px-4 py-4 sm:px-6">
                      <Button size="sm" variant="ghost" onClick={() => openCreate(category.id)}>
                        Adicionar subcategoria
                      </Button>
                    </div>
                  )}
                </article>
              );
            })}
          </CategorySection>

          {orphanCategories.length > 0 ? (
            <CategorySection
              title="Subcategorias sem pai"
              description="Categorias com vínculo inválido que precisam ser reassociadas"
              actionLabel="Nova categoria"
              onCreate={() => openCreate(null)}
              emptyMessage=""
              isReordering={reorderMutation.isPending}
            >
              {orphanCategories.map((category, index) => (
                <article
                  key={category.id}
                  className="overflow-hidden border border-neutral-200 bg-brand-white shadow-sm"
                >
                  <CategoryRow
                    category={category}
                    badge="Órfã"
                    isFirst={index === 0}
                    isLast={index === orphanCategories.length - 1}
                    isReordering={reorderMutation.isPending}
                    onMove={(direction) => moveCategory(orphanCategories, category.id, direction)}
                    onEdit={() => openEdit(category)}
                    onToggle={() =>
                      toggleMutation.mutate({ id: category.id, ativo: category.ativo })
                    }
                    onDelete={() => {
                      if (confirm("Excluir esta categoria?")) {
                        deleteMutation.mutate(category.id);
                      }
                    }}
                  />
                </article>
              ))}
            </CategorySection>
          ) : null}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? "Editar categoria" : "Nova categoria"}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
          setDefaultParentId(null);
        }}
      >
        <CategoryForm
          initial={editing}
          categories={categories}
          defaultParentId={editing?.categoriaPai ?? defaultParentId}
          onCancel={() => {
            setModalOpen(false);
            setEditing(null);
            setDefaultParentId(null);
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

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="border border-neutral-200 bg-brand-white p-4">
      <p className="text-xs font-medium uppercase tracking-widest text-brand-gray">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-brand-black">{value}</p>
      <p className="mt-1 text-xs text-brand-gray">{hint}</p>
    </div>
  );
}

function CategorySection({
  title,
  description,
  actionLabel,
  onCreate,
  emptyMessage,
  isReordering,
  children,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onCreate: () => void;
  emptyMessage: string;
  isReordering: boolean;
  children: ReactNode;
}) {
  const hasChildren =
    children != null &&
    !(Array.isArray(children) && children.length === 0);

  return (
    <section className="border border-neutral-200">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-brand-light px-4 py-3">
        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-brand-black">
            {title}
          </h2>
          <p className="text-xs text-brand-gray">{description}</p>
        </div>
        <Button size="sm" variant="outline" onClick={onCreate} disabled={isReordering}>
          {actionLabel}
        </Button>
      </div>

      {!hasChildren ? (
        <div className="px-4 py-10 text-center">
          <p className="text-sm text-brand-gray">{emptyMessage}</p>
          <Button size="sm" variant="ghost" className="mt-3" onClick={onCreate}>
            Criar primeira categoria
          </Button>
        </div>
      ) : (
        <div className="space-y-8 p-4 sm:p-6">{children}</div>
      )}
    </section>
  );
}

function CategoryRow({
  category,
  badge,
  nested = false,
  isFirst,
  isLast,
  isReordering,
  onMove,
  onEdit,
  onToggle,
  onDelete,
}: {
  category: Category;
  badge: string;
  nested?: boolean;
  isFirst: boolean;
  isLast: boolean;
  isReordering: boolean;
  onMove: (direction: "up" | "down") => void;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center",
        nested
          ? "ml-4 border-l-4 border-neutral-300 bg-brand-white px-4 py-4 sm:ml-6 sm:px-6 sm:py-4"
          : "px-4 py-5 sm:px-6 sm:py-5",
        !category.ativo && "bg-neutral-50",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-neutral-200 bg-brand-light">
          <img src={category.imagem} alt={category.nome} className="h-full w-full object-cover" />
          <span className="absolute left-1 top-1 bg-brand-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-brand-white">
            #{category.ordem}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-brand-black">{category.nome}</p>
            <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-gray">
              {badge}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                category.ativo
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-neutral-200 text-brand-gray",
              )}
            >
              {category.ativo ? "Ativa" : "Inativa"}
            </span>
          </div>
          <p className="mt-1 text-xs text-brand-gray">/{category.slug}</p>
          {category.descricao ? (
            <p className="mt-1 line-clamp-2 text-sm text-brand-gray">{category.descricao}</p>
          ) : null}
          <p className="mt-1 text-xs text-brand-gray">
            {category.productCount} produto{category.productCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <div className="flex items-center gap-1 border border-neutral-200 bg-brand-white p-1">
          <Button
            size="sm"
            variant="ghost"
            disabled={isFirst || isReordering}
            onClick={() => onMove("up")}
            aria-label="Mover para cima"
          >
            ↑
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={isLast || isReordering}
            onClick={() => onMove("down")}
            aria-label="Mover para baixo"
          >
            ↓
          </Button>
        </div>

        <Button size="sm" variant="outline" onClick={onEdit}>
          Editar
        </Button>
        <Button size="sm" variant="ghost" onClick={onToggle}>
          {category.ativo ? "Desativar" : "Ativar"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete}>
          Excluir
        </Button>
      </div>
    </div>
  );
}
