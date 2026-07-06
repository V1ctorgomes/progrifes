"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { attributesAdminApi, getErrorMessage } from "@/lib/admin-api";
import type { Attribute } from "@/types/attribute";

export function AttributesAdminPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [valores, setValores] = useState("");
  const [newValue, setNewValue] = useState<Record<string, string>>({});

  const { data: attributes = [], isLoading } = useQuery({
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            Atributos
          </h1>
          <p className="text-sm text-brand-gray">Gerencie cor, tamanho e outros atributos</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Novo atributo</Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-brand-gray">Carregando atributos...</p>
      ) : (
        <div className="space-y-4">
          {attributes.map((attribute: Attribute) => (
            <div key={attribute.id} className="border border-neutral-200 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-medium text-brand-black">{attribute.nome}</h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Excluir atributo "${attribute.nome}"?`)) {
                      removeMutation.mutate(attribute.id);
                    }
                  }}
                >
                  Excluir
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {attribute.valores.map((value) => (
                  <span
                    key={value.id}
                    className="inline-flex items-center gap-2 border border-neutral-300 px-3 py-1 text-sm"
                  >
                    {value.valor}
                    <button
                      type="button"
                      className="text-brand-gray hover:text-red-600"
                      onClick={() => removeValueMutation.mutate(value.id)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Input
                  label="Novo valor"
                  value={newValue[attribute.id] ?? ""}
                  onChange={(e) =>
                    setNewValue((current) => ({ ...current, [attribute.id]: e.target.value }))
                  }
                />
                <Button
                  className="self-end"
                  size="sm"
                  onClick={() => {
                    const valor = newValue[attribute.id]?.trim();
                    if (!valor) return;
                    addValueMutation.mutate({ attributeId: attribute.id, valor });
                    setNewValue((current) => ({ ...current, [attribute.id]: "" }));
                  }}
                >
                  Adicionar
                </Button>
              </div>
            </div>
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
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                try {
                  await createMutation.mutateAsync();
                } catch (error) {
                  alert(getErrorMessage(error));
                }
              }}
              disabled={createMutation.isPending}
            >
              Criar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
