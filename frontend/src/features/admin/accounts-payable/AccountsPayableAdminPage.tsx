"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PayableStatusBadge } from "@/features/admin/accounts-payable/PayableStatusBadge";
import { useAuth } from "@/hooks/useAuth";
import {
  accountsPayableAdminApi,
  financialAdminApi,
  getErrorMessage,
  suppliersAdminApi,
} from "@/lib/admin-api";
import { formatCurrency } from "@/utils/cn";
import {
  PAYABLE_ORIGIN_OPTIONS,
  PAYABLE_STATUS_OPTIONS,
  type CreateAccountPayableInput,
  type PayableStatus,
} from "@/types/accounts-payable";

function DashboardCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-neutral-200 bg-brand-white p-4">
      <p className="text-xs uppercase tracking-wide text-brand-gray">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-brand-black">{value}</p>
    </div>
  );
}

function canWritePayables(permissions: string[]) {
  return permissions.includes("*") || permissions.includes("payables:write");
}

export function AccountsPayableAdminPage() {
  const queryClient = useQueryClient();
  const { permissions } = useAuth();
  const canWrite = canWritePayables(permissions);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<PayableStatus | "">("");
  const [supplierId, setSupplierId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState<CreateAccountPayableInput>({
    supplierId: "",
    originType: "DESPESA_MANUAL",
    categoryId: "",
    chartAccountId: "",
    paymentMethodId: "",
    valor: 0,
    competencia: new Date().toISOString().slice(0, 10),
    vencimento: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, supplierId, dataInicio]);

  const { data: suppliersData } = useQuery({
    queryKey: ["admin", "suppliers", "payables-filter"],
    queryFn: () => suppliersAdminApi.list({ limit: 200 }),
  });

  const { data: categories } = useQuery({
    queryKey: ["admin", "financial", "categories"],
    queryFn: financialAdminApi.categories,
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ["admin", "financial", "payment-methods"],
    queryFn: financialAdminApi.paymentMethods,
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin",
      "accounts-payable",
      page,
      debouncedSearch,
      status,
      supplierId,
      dataInicio,
    ],
    queryFn: () =>
      accountsPayableAdminApi.list({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        status: status || undefined,
        supplierId: supplierId || undefined,
        dataInicio: dataInicio || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: accountsPayableAdminApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "accounts-payable"] });
      setModalOpen(false);
      setFormError("");
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const accounts = data?.data ?? [];
  const meta = data?.meta;
  const dashboard = data?.dashboard;
  const suppliers = suppliersData?.data ?? [];

  const compraCategory = categories?.find((item) => item.codigo === "COMPRA");
  const comprasChart = compraCategory?.chartAccountId;

  function openCreateModal() {
    setForm({
      supplierId: "",
      originType: "DESPESA_MANUAL",
      categoryId: compraCategory?.id ?? "",
      chartAccountId: comprasChart ?? "",
      paymentMethodId: paymentMethods?.[0]?.id ?? "",
      valor: 0,
      competencia: new Date().toISOString().slice(0, 10),
      vencimento: new Date().toISOString().slice(0, 10),
    });
    setFormError("");
    setModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2 text-sm text-brand-gray">
            <Link href="/admin/financeiro" className="hover:text-brand-black">
              Financeiro
            </Link>
            <span>/</span>
            <span>Contas a pagar</span>
          </div>
          <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            Contas a Pagar
          </h1>
          <p className="text-sm text-brand-gray">
            Controle de despesas, pagamentos e obrigações com fornecedores
          </p>
        </div>
        {canWrite && (
          <Button onClick={openCreateModal}>Nova conta</Button>
        )}
      </div>

      {dashboard && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <DashboardCard
            label="Total a pagar"
            value={formatCurrency(dashboard.totalAPagar)}
          />
          <DashboardCard
            label="Pago hoje"
            value={formatCurrency(dashboard.pagamentosHoje)}
          />
          <DashboardCard
            label="Pago no mês"
            value={formatCurrency(dashboard.pagamentosMes)}
          />
          <DashboardCard
            label="Contas vencidas"
            value={`${dashboard.contasVencidas.quantidade} (${formatCurrency(dashboard.contasVencidas.valor)})`}
          />
          <DashboardCard
            label="Pendentes"
            value={String(dashboard.contasPendentes)}
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Pesquisar"
          placeholder="Buscar fornecedor, documento, nota..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-black">Status</label>
          <select
            className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value as PayableStatus | "")}
          >
            <option value="">Todos os status</option>
            {PAYABLE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-black">Fornecedor</label>
          <select
            className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
            value={supplierId}
            onChange={(event) => setSupplierId(event.target.value)}
          >
            <option value="">Todos os fornecedores</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.nomeFantasia}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="A partir de"
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto border border-neutral-200 bg-brand-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-brand-gray">
            <tr>
              <th className="px-4 py-3">Número</th>
              <th className="px-4 py-3">Fornecedor</th>
              <th className="px-4 py-3">Origem</th>
              <th className="px-4 py-3">Vencimento</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-brand-gray">
                  Carregando...
                </td>
              </tr>
            ) : accounts.length ? (
              accounts.map((account) => (
                <tr key={account.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/financeiro/contas-pagar/${account.id}`}
                      className="font-medium text-brand-black underline"
                    >
                      {account.numeroFormatado}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{account.supplierNome}</td>
                  <td className="px-4 py-3 text-brand-gray">
                    {account.orderNumeroFormatado ?? account.originType}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(account.vencimento).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <PayableStatusBadge status={account.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrency(account.saldo)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-brand-gray">
                  Nenhuma conta a pagar encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-brand-gray">
            Página {meta.page} de {meta.totalPages} ({meta.total} registros)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova conta a pagar">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate(form);
          }}
        >
          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <div>
            <label className="mb-1 block text-sm text-brand-gray">Fornecedor</label>
            <select
              required
              className="w-full border border-neutral-300 px-3 py-2 text-sm"
              value={form.supplierId}
              onChange={(event) => setForm({ ...form, supplierId: event.target.value })}
            >
              <option value="">Selecione</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.nomeFantasia}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-brand-gray">Origem</label>
              <select
                className="w-full border border-neutral-300 px-3 py-2 text-sm"
                value={form.originType}
                onChange={(event) =>
                  setForm({
                    ...form,
                    originType: event.target.value as CreateAccountPayableInput["originType"],
                  })
                }
              >
                {PAYABLE_ORIGIN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-brand-gray">Valor</label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={form.valor || ""}
                onChange={(event) =>
                  setForm({ ...form, valor: Number(event.target.value) })
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-brand-gray">Categoria</label>
              <select
                required
                className="w-full border border-neutral-300 px-3 py-2 text-sm"
                value={form.categoryId}
                onChange={(event) => {
                  const category = categories?.find((item) => item.id === event.target.value);
                  setForm({
                    ...form,
                    categoryId: event.target.value,
                    chartAccountId: category?.chartAccountId ?? form.chartAccountId,
                  });
                }}
              >
                <option value="">Selecione</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-brand-gray">Forma de pagamento</label>
              <select
                required
                className="w-full border border-neutral-300 px-3 py-2 text-sm"
                value={form.paymentMethodId}
                onChange={(event) =>
                  setForm({ ...form, paymentMethodId: event.target.value })
                }
              >
                <option value="">Selecione</option>
                {paymentMethods?.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-brand-gray">Competência</label>
              <Input
                type="date"
                required
                value={form.competencia}
                onChange={(event) => setForm({ ...form, competencia: event.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-brand-gray">Vencimento</label>
              <Input
                type="date"
                required
                value={form.vencimento}
                onChange={(event) => setForm({ ...form, vencimento: event.target.value })}
              />
            </div>
          </div>

          <Input
            placeholder="Documento"
            value={form.documento ?? ""}
            onChange={(event) => setForm({ ...form, documento: event.target.value })}
          />

          <Input
            placeholder="Número da nota"
            value={form.numeroNota ?? ""}
            onChange={(event) => setForm({ ...form, numeroNota: event.target.value })}
          />

          <Input
            placeholder="Observações"
            value={form.observacoes ?? ""}
            onChange={(event) => setForm({ ...form, observacoes: event.target.value })}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Salvando..." : "Criar conta"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
