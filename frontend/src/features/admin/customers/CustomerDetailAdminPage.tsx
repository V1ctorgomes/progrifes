"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/Button";
import { CustomerForm } from "@/features/admin/customers/CustomerForm";
import { customersAdminApi, getErrorMessage } from "@/lib/admin-api";
import { formatCurrency } from "@/utils/cn";
import { PAYMENT_METHOD_LABELS } from "@/types/order";
import {
  formatCpf,
  formatPhone,
  FREQUENCY_LABELS,
  type CustomerAddressInput,
  type CustomerInput,
  type PurchaseFrequency,
} from "@/types/customer";

type TabId = "dados" | "enderecos" | "pedidos" | "crm" | "observacoes" | "timeline";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "dados", label: "Dados" },
  { id: "enderecos", label: "Endereços" },
  { id: "pedidos", label: "Pedidos" },
  { id: "crm", label: "CRM" },
  { id: "observacoes", label: "Observações" },
  { id: "timeline", label: "Timeline" },
];

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-neutral-200 bg-brand-white p-4">
      <p className="text-xs uppercase tracking-wide text-brand-gray">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-brand-black">{value}</p>
    </div>
  );
}

function AddressCard({
  address,
  onEdit,
  onRemove,
  onSetPrincipal,
  canRemove,
}: {
  address: {
    id: string;
    cep: string;
    rua: string;
    numero: string;
    complemento?: string | null;
    bairro: string;
    cidade: string;
    estado: string;
    referencia?: string | null;
    principal: boolean;
  };
  onEdit: () => void;
  onRemove: () => void;
  onSetPrincipal: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="border border-neutral-200 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">
          {address.rua}, {address.numero}
          {address.principal && (
            <span className="ml-2 rounded bg-brand-black px-2 py-0.5 text-xs text-brand-white">
              Principal
            </span>
          )}
        </p>
        <div className="flex flex-wrap gap-2 text-sm">
          {!address.principal && (
            <button type="button" className="underline hover:no-underline" onClick={onSetPrincipal}>
              Definir principal
            </button>
          )}
          <button type="button" className="underline hover:no-underline" onClick={onEdit}>
            Editar
          </button>
          {canRemove && (
            <button type="button" className="text-red-600 hover:underline" onClick={onRemove}>
              Remover
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-brand-gray">
        {address.bairro} — {address.cidade}/{address.estado}
      </p>
      <p className="text-sm text-brand-gray">CEP: {address.cep}</p>
    </div>
  );
}

export function CustomerDetailAdminPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>("dados");
  const [editOpen, setEditOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddressInput | null>(null);
  const [formError, setFormError] = useState("");
  const [noteText, setNoteText] = useState("");
  const [ordersPage, setOrdersPage] = useState(1);
  const [crmForm, setCrmForm] = useState({
    origem: "",
    canalAtendimento: "",
    observacoesComerciais: "",
  });
  const [crmInitialized, setCrmInitialized] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState("");

  const { data: customer, isLoading } = useQuery({
    queryKey: ["admin", "customers", id],
    queryFn: () => customersAdminApi.getById(id),
    enabled: Boolean(id),
  });

  const { data: statistics } = useQuery({
    queryKey: ["admin", "customers", id, "statistics"],
    queryFn: () => customersAdminApi.getStatistics(id),
    enabled: Boolean(id),
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["admin", "customers", id, "orders", ordersPage],
    queryFn: () => customersAdminApi.getOrders(id, { page: ordersPage, limit: 10 }),
    enabled: Boolean(id) && activeTab === "pedidos",
  });

  const { data: crm, isLoading: crmLoading } = useQuery({
    queryKey: ["admin", "customers", id, "crm"],
    queryFn: () => customersAdminApi.getCrm(id),
    enabled: Boolean(id) && activeTab === "crm",
  });

  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["admin", "customers", id, "notes"],
    queryFn: () => customersAdminApi.getNotes(id),
    enabled: Boolean(id) && activeTab === "observacoes",
  });

  const { data: timeline = [], isLoading: timelineLoading } = useQuery({
    queryKey: ["admin", "customers", id, "history"],
    queryFn: () => customersAdminApi.getHistory(id),
    enabled: Boolean(id) && activeTab === "timeline",
  });

  const { data: availableTags = [] } = useQuery({
    queryKey: ["admin", "customers", "tags"],
    queryFn: customersAdminApi.listTags,
    enabled: Boolean(id) && activeTab === "crm",
  });

  useEffect(() => {
    if (!crm || crmInitialized) return;
    setCrmForm({
      origem: crm.origem ?? "",
      canalAtendimento: crm.canalAtendimento ?? "",
      observacoesComerciais: crm.observacoesComerciais ?? "",
    });
    setCrmInitialized(true);
  }, [crm, crmInitialized]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "customers", id] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "customers", id, "statistics"] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "customers", id, "crm"] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "customers", id, "history"] });
  };

  const updateMutation = useMutation({
    mutationFn: (payload: CustomerInput) => customersAdminApi.update(id, payload),
    onSuccess: async () => {
      setFormError("");
      await invalidate();
      setEditOpen(false);
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const addressMutation = useMutation({
    mutationFn: async (payload: CustomerAddressInput) => {
      if (editingAddress?.id) {
        return customersAdminApi.updateAddress(id, editingAddress.id, payload);
      }
      return customersAdminApi.addAddress(id, payload);
    },
    onSuccess: async () => {
      setFormError("");
      await invalidate();
      setAddressModalOpen(false);
      setEditingAddress(null);
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const removeAddressMutation = useMutation({
    mutationFn: (addressId: string) => customersAdminApi.removeAddress(id, addressId),
    onSuccess: invalidate,
  });

  const principalMutation = useMutation({
    mutationFn: (addressId: string) => customersAdminApi.setPrincipalAddress(id, addressId),
    onSuccess: invalidate,
  });

  const toggleMutation = useMutation({
    mutationFn: () =>
      customer?.ativo ? customersAdminApi.deactivate(id) : customersAdminApi.activate(id),
    onSuccess: invalidate,
  });

  const noteMutation = useMutation({
    mutationFn: () => customersAdminApi.createNote(id, noteText),
    onSuccess: async () => {
      setNoteText("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "customers", id, "notes"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "customers", id, "history"] });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => customersAdminApi.deleteNote(id, noteId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "customers", id, "notes"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "customers", id, "history"] });
    },
  });

  const crmMutation = useMutation({
    mutationFn: () =>
      customersAdminApi.updateCrm(id, {
        origem: crmForm.origem || null,
        canalAtendimento: crmForm.canalAtendimento || null,
        observacoesComerciais: crmForm.observacoesComerciais || null,
      }),
    onSuccess: invalidate,
  });

  const assignTagMutation = useMutation({
    mutationFn: (tagId: string) => customersAdminApi.assignTag(id, { tagId }),
    onSuccess: async () => {
      setSelectedTagId("");
      await invalidate();
    },
  });

  const removeTagMutation = useMutation({
    mutationFn: (tagId: string) => customersAdminApi.removeTag(id, tagId),
    onSuccess: invalidate,
  });

  if (isLoading) {
    return <p className="text-sm text-brand-gray">Carregando cliente...</p>;
  }

  if (!customer) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-brand-gray">Cliente não encontrado.</p>
        <Link href="/admin/clientes" className="text-sm underline">
          Voltar para listagem
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/clientes" className="text-sm text-brand-gray hover:text-brand-black">
            ← Voltar para clientes
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            {customer.nome}
          </h1>
          <p className="text-sm text-brand-gray">{formatPhone(customer.telefone)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            Editar
          </Button>
          <Button variant="outline" size="sm" onClick={() => toggleMutation.mutate()}>
            {customer.ativo ? "Desativar" : "Ativar"}
          </Button>
        </div>
      </div>

      {statistics && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Pedidos" value={statistics.quantidadePedidos} />
          <StatCard label="Total gasto" value={formatCurrency(statistics.totalGasto)} />
          <StatCard label="Ticket médio" value={formatCurrency(statistics.ticketMedio)} />
          <StatCard
            label="Última compra"
            value={
              statistics.ultimaCompra
                ? new Date(statistics.ultimaCompra).toLocaleDateString("pt-BR")
                : "—"
            }
          />
          <StatCard
            label="Cliente desde"
            value={new Date(statistics.clienteDesde).toLocaleDateString("pt-BR")}
          />
          <StatCard
            label="Status"
            value={FREQUENCY_LABELS[statistics.frequenciaCompra as PurchaseFrequency]}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-neutral-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium uppercase tracking-wide ${
              activeTab === tab.id
                ? "border-b-2 border-brand-black text-brand-black"
                : "text-brand-gray hover:text-brand-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "dados" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="border border-neutral-200 p-4">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">Dados pessoais</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-brand-gray">Nome</dt>
                <dd>{customer.nome}</dd>
              </div>
              <div>
                <dt className="text-brand-gray">Telefone</dt>
                <dd>{formatPhone(customer.telefone)}</dd>
              </div>
              <div>
                <dt className="text-brand-gray">E-mail</dt>
                <dd>{customer.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-brand-gray">CPF</dt>
                <dd>{formatCpf(customer.cpf)}</dd>
              </div>
              <div>
                <dt className="text-brand-gray">Nascimento</dt>
                <dd>
                  {customer.dataNascimento
                    ? new Date(customer.dataNascimento).toLocaleDateString("pt-BR")
                    : "—"}
                </dd>
              </div>
            </dl>
          </section>
          <section className="border border-neutral-200 p-4">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">Informações gerais</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-brand-gray">Status</dt>
                <dd>{customer.ativo ? "Ativo" : "Inativo"}</dd>
              </div>
              <div>
                <dt className="text-brand-gray">Pedidos vinculados</dt>
                <dd>{customer.pedidosCount}</dd>
              </div>
              <div>
                <dt className="text-brand-gray">Última atualização</dt>
                <dd>{new Date(customer.updatedAt).toLocaleString("pt-BR")}</dd>
              </div>
              <div>
                <dt className="text-brand-gray">Observações do cadastro</dt>
                <dd className="whitespace-pre-wrap">{customer.observacoes ?? "—"}</dd>
              </div>
            </dl>
          </section>
          {statistics && statistics.produtosMaisComprados.length > 0 && (
            <section className="border border-neutral-200 p-4 lg:col-span-2">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">
                Produtos mais comprados
              </h2>
              <ol className="space-y-2">
                {statistics.produtosMaisComprados.map((product) => (
                  <li key={product.nome} className="flex justify-between text-sm">
                    <span>{product.nome}</span>
                    <span className="font-medium">{product.quantidade} un.</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      )}

      {activeTab === "enderecos" && (
        <section className="space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingAddress(null);
                setAddressModalOpen(true);
              }}
            >
              Adicionar endereço
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {customer.enderecos.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                canRemove={customer.enderecos.length > 1}
                onEdit={() => {
                  setEditingAddress({
                    id: address.id,
                    cep: address.cep,
                    rua: address.rua,
                    numero: address.numero,
                    complemento: address.complemento ?? undefined,
                    bairro: address.bairro,
                    cidade: address.cidade,
                    estado: address.estado,
                    referencia: address.referencia ?? undefined,
                    principal: address.principal,
                  });
                  setAddressModalOpen(true);
                }}
                onRemove={() => {
                  if (confirm("Remover este endereço?")) {
                    removeAddressMutation.mutate(address.id);
                  }
                }}
                onSetPrincipal={() => principalMutation.mutate(address.id)}
              />
            ))}
          </div>
        </section>
      )}

      {activeTab === "pedidos" && (
        <section className="space-y-4">
          {ordersLoading ? (
            <p className="text-sm text-brand-gray">Carregando pedidos...</p>
          ) : !ordersData?.data.length ? (
            <p className="text-sm text-brand-gray">Nenhum pedido registrado.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-neutral-200 text-sm">
                  <thead className="bg-brand-light">
                    <tr>
                      <th className="px-4 py-3 text-left">Pedido</th>
                      <th className="px-4 py-3 text-left">Data</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Itens</th>
                      <th className="px-4 py-3 text-left">Pagamento</th>
                      <th className="px-4 py-3 text-left">Total</th>
                      <th className="px-4 py-3 text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersData.data.map((order) => (
                      <tr key={order.id} className="border-t border-neutral-200">
                        <td className="px-4 py-3 font-mono">{order.numeroFormatado}</td>
                        <td className="px-4 py-3">
                          {new Date(order.createdAt).toLocaleString("pt-BR")}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="rounded px-2 py-0.5 text-xs text-white"
                            style={{ backgroundColor: order.statusCor }}
                          >
                            {order.statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3">{order.itemCount}</td>
                        <td className="px-4 py-3">
                          {PAYMENT_METHOD_LABELS[order.formaPagamento as keyof typeof PAYMENT_METHOD_LABELS] ?? order.formaPagamento}
                        </td>
                        <td className="px-4 py-3">{formatCurrency(order.total)}</td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/pedidos/${order.id}`}
                            className="font-medium underline hover:no-underline"
                          >
                            Abrir
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {ordersData.meta.totalPages > 1 && (
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={ordersPage <= 1}
                    onClick={() => setOrdersPage((p) => p - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={ordersPage >= ordersData.meta.totalPages}
                    onClick={() => setOrdersPage((p) => p + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {activeTab === "crm" && (
        <section className="space-y-6">
          {crmLoading ? (
            <p className="text-sm text-brand-gray">Carregando CRM...</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  Origem do cliente
                  <input
                    className="mt-1 w-full border border-neutral-300 px-4 py-2.5 text-sm"
                    value={crmForm.origem}
                    onChange={(e) => setCrmForm({ ...crmForm, origem: e.target.value })}
                    placeholder="Ex: Instagram, Indicação..."
                  />
                </label>
                <label className="block text-sm">
                  Canal de atendimento
                  <input
                    className="mt-1 w-full border border-neutral-300 px-4 py-2.5 text-sm"
                    value={crmForm.canalAtendimento}
                    onChange={(e) =>
                      setCrmForm({ ...crmForm, canalAtendimento: e.target.value })
                    }
                    placeholder="Ex: WhatsApp, Loja física..."
                  />
                </label>
                <label className="block text-sm sm:col-span-2">
                  Observações comerciais
                  <textarea
                    className="mt-1 min-h-24 w-full border border-neutral-300 px-4 py-2.5 text-sm"
                    value={crmForm.observacoesComerciais}
                    onChange={(e) =>
                      setCrmForm({ ...crmForm, observacoesComerciais: e.target.value })
                    }
                  />
                </label>
              </div>
              <Button size="sm" onClick={() => crmMutation.mutate()} disabled={crmMutation.isPending}>
                Salvar CRM
              </Button>

              <div className="space-y-3 border-t border-neutral-200 pt-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {crm?.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-2 rounded px-2 py-1 text-xs text-white"
                      style={{ backgroundColor: tag.cor }}
                    >
                      {tag.nome}
                      <button
                        type="button"
                        className="opacity-80 hover:opacity-100"
                        onClick={() => removeTagMutation.mutate(tag.id)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="border border-neutral-300 px-4 py-2 text-sm"
                    value={selectedTagId}
                    onChange={(e) => setSelectedTagId(e.target.value)}
                  >
                    <option value="">Selecionar tag...</option>
                    {availableTags.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.nome}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!selectedTagId}
                    onClick={() => assignTagMutation.mutate(selectedTagId)}
                  >
                    Aplicar tag
                  </Button>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {activeTab === "observacoes" && (
        <section className="space-y-4">
          <div className="space-y-2">
            <textarea
              className="min-h-24 w-full border border-neutral-300 px-4 py-2.5 text-sm"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Adicionar observação interna..."
            />
            <Button
              size="sm"
              disabled={!noteText.trim() || noteMutation.isPending}
              onClick={() => noteMutation.mutate()}
            >
              Adicionar observação
            </Button>
          </div>
          {notesLoading ? (
            <p className="text-sm text-brand-gray">Carregando observações...</p>
          ) : notes.length === 0 ? (
            <p className="text-sm text-brand-gray">Nenhuma observação registrada.</p>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="border border-neutral-200 p-4">
                  <p className="whitespace-pre-wrap text-sm">{note.descricao}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-brand-gray">
                    <span>
                      {note.usuario?.nome ?? "Sistema"} —{" "}
                      {new Date(note.createdAt).toLocaleString("pt-BR")}
                    </span>
                    <button
                      type="button"
                      className="text-red-600 hover:underline"
                      onClick={() => deleteNoteMutation.mutate(note.id)}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "timeline" && (
        <section>
          {timelineLoading ? (
            <p className="text-sm text-brand-gray">Carregando timeline...</p>
          ) : timeline.length === 0 ? (
            <p className="text-sm text-brand-gray">Nenhum evento registrado.</p>
          ) : (
            <ol className="space-y-0">
              {timeline.map((entry, index) => (
                <li key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {index < timeline.length - 1 && (
                    <span className="absolute left-[7px] top-4 h-full w-px bg-neutral-300" />
                  )}
                  <span className="relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-brand-black bg-brand-white" />
                  <div>
                    <p className="text-sm font-medium">{entry.titulo}</p>
                    <p className="text-sm text-brand-gray">{entry.descricao}</p>
                    <p className="text-xs text-brand-gray">
                      {new Date(entry.createdAt).toLocaleString("pt-BR")}
                      {entry.usuario ? ` — ${entry.usuario.nome}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      <Modal open={editOpen} title="Editar cliente" onClose={() => setEditOpen(false)}>
        <CustomerForm
          initial={customer}
          onSubmit={(payload) => updateMutation.mutate(payload)}
          loading={updateMutation.isPending}
          error={formError}
        />
      </Modal>

      <Modal
        open={addressModalOpen}
        title={editingAddress ? "Editar endereço" : "Novo endereço"}
        onClose={() => {
          setAddressModalOpen(false);
          setEditingAddress(null);
        }}
      >
        <AddressForm
          initial={editingAddress}
          loading={addressMutation.isPending}
          error={formError}
          onSubmit={(payload) => addressMutation.mutate(payload)}
        />
      </Modal>
    </div>
  );
}

function AddressForm({
  initial,
  onSubmit,
  loading,
  error,
}: {
  initial: CustomerAddressInput | null;
  onSubmit: (data: CustomerAddressInput) => void;
  loading?: boolean;
  error?: string;
}) {
  const [form, setForm] = useState<CustomerAddressInput>(
    initial ?? {
      cep: "",
      rua: "",
      numero: "",
      bairro: "",
      cidade: "",
      estado: "",
      principal: false,
    },
  );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(form);
      }}
      className="space-y-4"
    >
      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          CEP *
          <input
            className="mt-1 w-full border border-neutral-300 px-4 py-2.5 text-sm"
            value={form.cep}
            onChange={(e) => setForm({ ...form, cep: e.target.value })}
            required
          />
        </label>
        <label className="block text-sm">
          Número *
          <input
            className="mt-1 w-full border border-neutral-300 px-4 py-2.5 text-sm"
            value={form.numero}
            onChange={(e) => setForm({ ...form, numero: e.target.value })}
            required
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          Rua *
          <input
            className="mt-1 w-full border border-neutral-300 px-4 py-2.5 text-sm"
            value={form.rua}
            onChange={(e) => setForm({ ...form, rua: e.target.value })}
            required
          />
        </label>
        <label className="block text-sm">
          Bairro *
          <input
            className="mt-1 w-full border border-neutral-300 px-4 py-2.5 text-sm"
            value={form.bairro}
            onChange={(e) => setForm({ ...form, bairro: e.target.value })}
            required
          />
        </label>
        <label className="block text-sm">
          Cidade *
          <input
            className="mt-1 w-full border border-neutral-300 px-4 py-2.5 text-sm"
            value={form.cidade}
            onChange={(e) => setForm({ ...form, cidade: e.target.value })}
            required
          />
        </label>
        <label className="block text-sm">
          Estado *
          <input
            className="mt-1 w-full border border-neutral-300 px-4 py-2.5 text-sm"
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value })}
            required
          />
        </label>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Salvar endereço"}
      </Button>
    </form>
  );
}
