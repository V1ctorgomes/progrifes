"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/Button";
import { SupplierForm } from "@/features/admin/suppliers/SupplierForm";
import { getErrorMessage, suppliersAdminApi } from "@/lib/admin-api";
import {
  formatAddress,
  formatCnpj,
  formatPhone,
  type SupplierInput,
} from "@/types/supplier";

export function SupplierDetailAdminPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [formError, setFormError] = useState("");

  const { data: supplier, isLoading } = useQuery({
    queryKey: ["admin", "suppliers", id],
    queryFn: () => suppliersAdminApi.getById(id),
    enabled: Boolean(id),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "suppliers"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "suppliers", id] });
  };

  const updateMutation = useMutation({
    mutationFn: (payload: SupplierInput) => suppliersAdminApi.update(id, payload),
    onSuccess: async () => {
      setFormError("");
      await invalidate();
      setEditOpen(false);
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const toggleMutation = useMutation({
    mutationFn: () =>
      supplier?.ativo ? suppliersAdminApi.deactivate(id) : suppliersAdminApi.activate(id),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: () => suppliersAdminApi.remove(id),
    onSuccess: () => {
      window.location.href = "/admin/fornecedores";
    },
  });

  if (isLoading) {
    return <p className="text-sm text-brand-gray">Carregando fornecedor...</p>;
  }

  if (!supplier) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-brand-gray">Fornecedor não encontrado.</p>
        <Link href="/admin/fornecedores" className="text-sm underline hover:no-underline">
          Voltar para fornecedores
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/fornecedores" className="text-sm text-brand-gray hover:text-brand-black">
            ← Fornecedores
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            {supplier.nomeFantasia}
          </h1>
          <p className="text-sm text-brand-gray">{supplier.razaoSocial}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            Editar
          </Button>
          <Button
            variant="secondary"
            onClick={() => toggleMutation.mutate()}
            disabled={toggleMutation.isPending}
          >
            {supplier.ativo ? "Desativar" : "Ativar"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (confirm("Remover este fornecedor permanentemente?")) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
          >
            Remover
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
            supplier.ativo ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-700"
          }`}
        >
          {supplier.ativo ? "Ativo" : "Inativo"}
        </span>
      </div>

      <section className="space-y-3">
        <h2 className="font-medium text-brand-black">Dados gerais</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-brand-gray">Razão social</dt>
            <dd>{supplier.razaoSocial}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-brand-gray">Nome fantasia</dt>
            <dd>{supplier.nomeFantasia}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-brand-gray">CNPJ</dt>
            <dd>{formatCnpj(supplier.cnpj)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-brand-gray">Inscrição estadual</dt>
            <dd>{supplier.inscricaoEstadual ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-brand-gray">Telefone</dt>
            <dd>{formatPhone(supplier.telefone)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-brand-gray">E-mail</dt>
            <dd>{supplier.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-brand-gray">Website</dt>
            <dd>
              {supplier.website ? (
                <a
                  href={supplier.website.startsWith("http") ? supplier.website : `https://${supplier.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:no-underline"
                >
                  {supplier.website}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-brand-gray">Contato principal</dt>
            <dd>{supplier.contatoPrincipal ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium text-brand-black">Endereço</h2>
        {supplier.endereco ? (
          <p className="text-sm text-brand-gray">{formatAddress(supplier.endereco)}</p>
        ) : (
          <p className="text-sm text-brand-gray">Nenhum endereço cadastrado.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-medium text-brand-black">Contatos comerciais</h2>
        {supplier.contatos.length === 0 ? (
          <p className="text-sm text-brand-gray">Nenhum contato cadastrado.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {supplier.contatos.map((contact) => (
              <div key={contact.id} className="border border-neutral-200 p-4">
                <p className="font-medium">{contact.nome}</p>
                {contact.cargo && <p className="text-sm text-brand-gray">{contact.cargo}</p>}
                <div className="mt-2 space-y-1 text-sm text-brand-gray">
                  {contact.telefone && <p>Telefone: {formatPhone(contact.telefone)}</p>}
                  {contact.whatsapp && <p>WhatsApp: {formatPhone(contact.whatsapp)}</p>}
                  {contact.email && <p>E-mail: {contact.email}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-medium text-brand-black">Informações</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-brand-gray">Fornecedor desde</dt>
            <dd>{new Date(supplier.createdAt).toLocaleDateString("pt-BR")}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-brand-gray">Última atualização</dt>
            <dd>{new Date(supplier.updatedAt).toLocaleDateString("pt-BR")}</dd>
          </div>
        </dl>
        {supplier.observacoes && (
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-gray">Observações</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-brand-gray">{supplier.observacoes}</p>
          </div>
        )}
      </section>

      <Modal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setFormError("");
        }}
        title="Editar fornecedor"
      >
        <SupplierForm
          initial={supplier}
          onSubmit={(data) => updateMutation.mutate(data)}
          loading={updateMutation.isPending}
          error={formError}
        />
      </Modal>
    </div>
  );
}
