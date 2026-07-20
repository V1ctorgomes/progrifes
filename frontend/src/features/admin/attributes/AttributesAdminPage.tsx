"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertTriangle,
  Plus,
  RefreshCw,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { Modal } from "@/components/admin/Modal";
import { Input } from "@/components/ui/Input";
import { attributesAdminApi, getErrorMessage } from "@/lib/admin-api";
import type { Attribute } from "@/types/attribute";
import { cn } from "@/utils/cn";

export function AttributesAdminPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [valores, setValores] = useState("");
  const [newValue, setNewValue] = useState<Record<string, string>>({});

  const { data: attributes = [], isLoading, isFetching, refetch, isError } = useQuery({
    queryKey: ["admin", "attributes"],
    queryFn: attributesAdminApi.list,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "attributes"] });

  const createMutation = useMutation({
    mutationFn: () =>
      attributesAdminApi.create({
        nome,
        valores: valores
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
          .map((valor) => ({ valor })),
      }),
    onSuccess: async () => {
      await invalidate();
      setModalOpen(false);
      setNome("");
      setValores("");
    },
  });

  const addValueMutation = useMutation({
    mutationFn: ({ attributeId, valor }: { attributeId: string; valor: string }) =>
      attributesAdminApi.addValue(attributeId, valor),
    onSuccess: invalidate,
  });

  const removeValueMutation = useMutation({
    mutationFn: attributesAdminApi.removeValue,
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: attributesAdminApi.remove,
    onSuccess: invalidate,
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <RefreshCw className="h-8 w-8 animate-spin text-neutral-300" />
        <p className="text-sm font-medium text-neutral-500">Carregando atributos...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-100 bg-white shadow-sm">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="text-sm font-medium text-neutral-500">
          Não foi possível carregar os atributos.
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
            Atributos
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Gerencie cor, tamanho e outros atributos usados nas variantes.
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
            onClick={() => setModalOpen(true)}
            className="flex h-11 w-fit shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-black px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Novo atributo
          </button>
        </div>
      </div>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-neutral-500">Total</p>
          <p className="mt-4 font-display text-3xl font-bold text-brand-black">
            {attributes.length}
          </p>
          <p className="mt-2 text-xs font-medium text-neutral-400">Atributos cadastrados</p>
        </div>
        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-neutral-500">Valores</p>
          <p className="mt-4 font-display text-3xl font-bold text-brand-black">
            {attributes.reduce((sum, item) => sum + item.valores.length, 0)}
          </p>
          <p className="mt-2 text-xs font-medium text-neutral-400">Opções disponíveis</p>
        </div>
      </section>

      {attributes.length === 0 ? (
        <section className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-100 bg-white px-5 py-16 text-center shadow-sm">
          <Settings2 className="h-10 w-10 text-neutral-300" />
          <p className="text-sm font-medium text-neutral-500">Nenhum atributo cadastrado.</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-1 rounded-xl bg-brand-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Criar primeiro atributo
          </button>
        </section>
      ) : (
        <div className="space-y-5">
          {attributes.map((attribute: Attribute) => (
            <section
              key={attribute.id}
              className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
                    <Settings2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-brand-black">{attribute.nome}</h2>
                    <p className="text-xs font-medium text-neutral-400">
                      {attribute.valores.length} valor
                      {attribute.valores.length === 1 ? "" : "es"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Excluir atributo "${attribute.nome}"?`)) {
                      removeMutation.mutate(attribute.id);
                    }
                  }}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-red-100 bg-white px-3 text-xs font-semibold text-red-600 shadow-sm transition-all hover:border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir
                </button>
              </div>

              <div className="space-y-4 px-5 py-5">
                <div className="flex flex-wrap gap-2">
                  {attribute.valores.length === 0 ? (
                    <p className="text-sm text-neutral-500">Nenhum valor cadastrado.</p>
                  ) : (
                    attribute.valores.map((value) => (
                      <span
                        key={value.id}
                        className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm font-medium text-brand-black"
                      >
                        {value.valor}
                        <button
                          type="button"
                          className="flex h-5 w-5 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          onClick={() => removeValueMutation.mutate(value.id)}
                          aria-label={`Remover ${value.valor}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <Input
                      label="Novo valor"
                      value={newValue[attribute.id] ?? ""}
                      onChange={(e) =>
                        setNewValue((current) => ({
                          ...current,
                          [attribute.id]: e.target.value,
                        }))
                      }
                      placeholder="Ex.: Preto"
                    />
                  </div>
                  <button
                    type="button"
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-black px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
                    onClick={() => {
                      const valor = newValue[attribute.id]?.trim();
                      if (!valor) return;
                      addValueMutation.mutate({ attributeId: attribute.id, valor });
                      setNewValue((current) => ({ ...current, [attribute.id]: "" }));
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </button>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      <Modal open={modalOpen} title="Novo atributo" onClose={() => setModalOpen(false)}>
        <div className="space-y-4">
          <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Input
            label="Valores iniciais (separados por vírgula)"
            value={valores}
            onChange={(e) => setValores(e.target.value)}
            placeholder="Preto, Branco, Azul"
          />
          <div className="flex justify-end gap-3 border-t border-neutral-100 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 text-sm font-semibold text-brand-black shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await createMutation.mutateAsync();
                } catch (error) {
                  alert(getErrorMessage(error));
                }
              }}
              disabled={createMutation.isPending}
              className="flex h-11 items-center justify-center rounded-xl bg-brand-black px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
            >
              {createMutation.isPending ? "Criando..." : "Criar"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
