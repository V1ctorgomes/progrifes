"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FolderTree,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Tags,
  Trash2,
} from "lucide-react";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { Modal } from "@/components/admin/Modal";
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

  const { data: categories = [], isLoading, isFetching, refetch, isError } = useQuery({
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

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <RefreshCw className="h-8 w-8 animate-spin text-neutral-300" />
        <p className="text-sm font-medium text-neutral-500">Carregando categorias...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-100 bg-white shadow-sm">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="text-sm font-medium text-neutral-500">
          Não foi possível carregar as categorias.
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
            Categorias
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Organize a hierarquia da loja. A home exibe até {HOME_CATEGORIES_LIMIT} categorias
            principais ativas.
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
            onClick={() => openCreate(null)}
            className="flex h-11 w-fit shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-black px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Nova categoria
          </button>
        </div>
      </div>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total" value={totalCategories} hint="Categorias cadastradas" />
        <SummaryCard
          label="Principais"
          value={rootCategories.length}
          hint={`${activeRoots.length} ativas na loja`}
        />
        <SummaryCard
          label="Subcategorias"
          value={subcategoriesCount}
          hint="Vinculadas a uma categoria pai"
        />
        <SummaryCard
          label="Ativas"
          value={activeCategories}
          hint={`${totalCategories - activeCategories} inativas`}
        />
      </section>

      <div className="space-y-6">
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
                className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm"
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
                  <div className="border-t border-neutral-100 bg-neutral-50/50">
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                        Subcategorias
                      </p>
                      <button
                        type="button"
                        onClick={() => openCreate(category.id)}
                        className="flex h-9 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-brand-black shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Adicionar subcategoria
                      </button>
                    </div>
                    <ul className="divide-y divide-neutral-100 border-t border-neutral-100">
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
                  <div className="border-t border-neutral-100 bg-neutral-50/40 px-5 py-4">
                    <button
                      type="button"
                      onClick={() => openCreate(category.id)}
                      className="flex h-9 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-brand-black shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar subcategoria
                    </button>
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
                className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm"
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
    <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-black hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-neutral-500">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-50 text-neutral-400">
          <Tags className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-4 font-display text-3xl font-bold text-brand-black">{value}</p>
      <p className="mt-2 text-xs font-medium text-neutral-400">{hint}</p>
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
    children != null && !(Array.isArray(children) && children.length === 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
            <FolderTree className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-brand-black">{title}</h2>
            <p className="text-xs font-medium text-neutral-400">{description}</p>
          </div>
        </div>
        <button
          type="button"
          disabled={isReordering}
          onClick={onCreate}
          className="flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-brand-black shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {actionLabel}
        </button>
      </div>

      {!hasChildren ? (
        <div className="flex flex-col items-center justify-center gap-3 px-5 py-12 text-center">
          <FolderTree className="h-8 w-8 text-neutral-300" />
          <p className="text-sm text-neutral-500">{emptyMessage}</p>
          <button
            type="button"
            onClick={onCreate}
            className="mt-1 rounded-xl bg-brand-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Criar primeira categoria
          </button>
        </div>
      ) : (
        <div className="space-y-5 p-5">{children}</div>
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
        "flex flex-col gap-4 transition-colors sm:flex-row sm:items-center",
        nested
          ? "ml-4 border-l-4 border-neutral-200 bg-white px-4 py-4 sm:ml-6 sm:px-5"
          : "px-5 py-5",
        !category.ativo && "bg-neutral-50/60",
        "hover:bg-neutral-50/80",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50">
          <img src={category.imagem} alt={category.nome} className="h-full w-full object-cover" />
          <span className="absolute left-1.5 top-1.5 rounded-md bg-brand-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
            #{category.ordem}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-brand-black">{category.nome}</p>
            <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-600">
              {badge}
            </span>
            <span
              className={cn(
                "inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                category.ativo
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-neutral-100 text-neutral-600",
              )}
            >
              {category.ativo ? "Ativa" : "Inativa"}
            </span>
          </div>
          <p className="mt-1 text-xs font-medium text-neutral-400">/{category.slug}</p>
          {category.descricao ? (
            <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{category.descricao}</p>
          ) : null}
          <p className="mt-1 text-xs font-medium text-neutral-400">
            {category.productCount} produto{category.productCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <div className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            disabled={isFirst || isReordering}
            onClick={() => onMove("up")}
            aria-label="Mover para cima"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-brand-black disabled:opacity-40"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={isLast || isReordering}
            onClick={() => onMove("down")}
            aria-label="Mover para baixo"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-brand-black disabled:opacity-40"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-brand-black shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-brand-black shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50"
        >
          <Power className="h-3.5 w-3.5" />
          {category.ativo ? "Desativar" : "Ativar"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-red-100 bg-white px-3 text-xs font-semibold text-red-600 shadow-sm transition-all hover:border-red-200 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Excluir
        </button>
      </div>
    </div>
  );
}
