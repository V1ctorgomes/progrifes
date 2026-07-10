"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import {
  cashFlowAdminApi,
  financialAdminApi,
  getErrorMessage,
} from "@/lib/admin-api";
import { formatCurrency } from "@/utils/cn";
import {
  CASH_FLOW_TYPE_OPTIONS,
  type CashFlowType,
  type CreateCashAdjustmentInput,
  type CreateCashTransferInput,
} from "@/types/cash-flow";

function DashboardCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-neutral-200 bg-brand-white p-4">
      <p className="text-xs uppercase tracking-wide text-brand-gray">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-brand-black">{value}</p>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

function canWriteCashFlow(permissions: string[]) {
  return permissions.includes("*") || permissions.includes("cashflow:write");
}

function canAdjustCashFlow(permissions: string[]) {
  return (
    permissions.includes("*") ||
    permissions.includes("cashflow:adjust") ||
    permissions.includes("cashflow:write")
  );
}

function canCloseCashFlow(permissions: string[]) {
  return (
    permissions.includes("*") ||
    permissions.includes("cashflow:close") ||
    permissions.includes("cashflow:write")
  );
}

export function CashFlowAdminPage() {
  const queryClient = useQueryClient();
  const { permissions } = useAuth();
  const canWrite = canWriteCashFlow(permissions);
  const canAdjust = canAdjustCashFlow(permissions);
  const canClose = canCloseCashFlow(permissions);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tipo, setTipo] = useState<CashFlowType | "">("");
  const [financialAccountId, setFinancialAccountId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [page, setPage] = useState(1);

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [openModalOpen, setOpenModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [formError, setFormError] = useState("");

  const [transferForm, setTransferForm] = useState<CreateCashTransferInput>({
    fromFinancialAccountId: "",
    toCashboxId: "",
    paymentMethodId: "",
    valor: 0,
    descricao: "",
  });

  const [adjustForm, setAdjustForm] = useState<CreateCashAdjustmentInput>({
    tipo: "AJUSTE_POSITIVO",
    cashboxId: "",
    paymentMethodId: "",
    valor: 0,
    motivo: "",
    descricao: "",
  });

  const [openForm, setOpenForm] = useState({
    cashboxId: "",
    saldoInicial: 0,
    observacoes: "",
  });

  const [closeForm, setCloseForm] = useState({
    cashboxId: "",
    saldoFinal: undefined as number | undefined,
    observacoes: "",
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, tipo, financialAccountId, dataInicio]);

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ["admin", "cash-flow", "dashboard"],
    queryFn: cashFlowAdminApi.dashboard,
  });

  const { data: accounts } = useQuery({
    queryKey: ["admin", "financial", "accounts"],
    queryFn: financialAdminApi.accounts,
  });

  const { data: cashboxes } = useQuery({
    queryKey: ["admin", "financial", "cashboxes"],
    queryFn: financialAdminApi.cashboxes,
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ["admin", "financial", "payment-methods"],
    queryFn: financialAdminApi.paymentMethods,
  });

  const { data: statement, isLoading: statementLoading } = useQuery({
    queryKey: [
      "admin",
      "cash-flow",
      "statement",
      page,
      debouncedSearch,
      tipo,
      financialAccountId,
      dataInicio,
    ],
    queryFn: () =>
      cashFlowAdminApi.statement({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        tipo: tipo || undefined,
        financialAccountId: financialAccountId || undefined,
        dataInicio: dataInicio || undefined,
      }),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "cash-flow"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "financial"] });
  };

  const transferMutation = useMutation({
    mutationFn: cashFlowAdminApi.transfer,
    onSuccess: () => {
      invalidateAll();
      setTransferModalOpen(false);
      setFormError("");
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const adjustMutation = useMutation({
    mutationFn: cashFlowAdminApi.adjust,
    onSuccess: () => {
      invalidateAll();
      setAdjustModalOpen(false);
      setFormError("");
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const openMutation = useMutation({
    mutationFn: cashFlowAdminApi.openCashbox,
    onSuccess: () => {
      invalidateAll();
      setOpenModalOpen(false);
      setFormError("");
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const closeMutation = useMutation({
    mutationFn: cashFlowAdminApi.closeCashbox,
    onSuccess: () => {
      invalidateAll();
      setCloseModalOpen(false);
      setFormError("");
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  if (dashboardLoading) {
    return <p className="text-brand-gray">Carregando fluxo de caixa...</p>;
  }

  if (!dashboard) {
    return <p className="text-brand-gray">Não foi possível carregar o fluxo de caixa.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link
          href="/admin/financeiro"
          className="text-sm text-brand-gray underline"
        >
          ← Voltar ao financeiro
        </Link>
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
          Fluxo de Caixa
        </h1>
        <p className="text-brand-gray">
          Extrato consolidado de entradas, saídas, transferências e ajustes financeiros.
        </p>
        {canWrite && (
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" onClick={() => setTransferModalOpen(true)}>
              Transferência
            </Button>
            {canAdjust && (
              <Button type="button" variant="secondary" onClick={() => setAdjustModalOpen(true)}>
                Ajuste
              </Button>
            )}
            {canClose && (
              <>
                <Button type="button" variant="secondary" onClick={() => setOpenModalOpen(true)}>
                  Abrir caixa
                </Button>
                <Button type="button" variant="secondary" onClick={() => setCloseModalOpen(true)}>
                  Fechar caixa
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-black">
          Dashboard
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardCard label="Saldo atual" value={formatCurrency(dashboard.summary.saldoAtual)} />
          <DashboardCard
            label="Entradas do dia"
            value={formatCurrency(dashboard.summary.entradasDia)}
          />
          <DashboardCard
            label="Saídas do dia"
            value={formatCurrency(dashboard.summary.saidasDia)}
          />
          <DashboardCard
            label="Projeção financeira"
            value={formatCurrency(dashboard.summary.projecaoFinanceira)}
          />
          <DashboardCard
            label="Entradas do mês"
            value={formatCurrency(dashboard.summary.entradasMes)}
          />
          <DashboardCard
            label="Saídas do mês"
            value={formatCurrency(dashboard.summary.saidasMes)}
          />
          <DashboardCard
            label="Saldo bancário"
            value={formatCurrency(dashboard.summary.saldoBancario)}
          />
          <DashboardCard
            label="Saldo em caixa"
            value={formatCurrency(dashboard.summary.saldoCaixa)}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-black">
            Saldo por conta
          </h2>
          <div className="border border-neutral-200 bg-brand-white">
            {dashboard.accounts.length === 0 ? (
              <p className="p-4 text-sm text-brand-gray">Nenhuma conta bancária cadastrada.</p>
            ) : (
              <ul className="divide-y divide-neutral-200">
                {dashboard.accounts.map((account) => (
                  <li
                    key={account.id}
                    className="flex items-center justify-between p-4 text-sm"
                  >
                    <span className="font-medium text-brand-black">{account.nome}</span>
                    <span className="text-brand-gray">{formatCurrency(account.saldoAtual)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-black">
            Saldo por caixa
          </h2>
          <div className="border border-neutral-200 bg-brand-white">
            {dashboard.cashboxes.length === 0 ? (
              <p className="p-4 text-sm text-brand-gray">Nenhum caixa cadastrado.</p>
            ) : (
              <ul className="divide-y divide-neutral-200">
                {dashboard.cashboxes.map((cashbox) => (
                  <li
                    key={cashbox.id}
                    className="flex items-center justify-between p-4 text-sm"
                  >
                    <span className="font-medium text-brand-black">{cashbox.nome}</span>
                    <span className="text-brand-gray">{formatCurrency(cashbox.saldoAtual)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-black">
          Extrato
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Pesquisar"
            placeholder="Buscar descrição, categoria ou usuário"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-black">Tipo</label>
            <select
              className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
              value={tipo}
              onChange={(event) => setTipo(event.target.value as CashFlowType | "")}
            >
              {CASH_FLOW_TYPE_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-black">Conta</label>
            <select
              className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
              value={financialAccountId}
              onChange={(event) => setFinancialAccountId(event.target.value)}
            >
              <option value="">Todas as contas</option>
              {accounts?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.nome}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="A partir de"
            type="date"
            value={dataInicio}
            onChange={(event) => setDataInicio(event.target.value)}
          />
        </div>

        <div className="overflow-x-auto border border-neutral-200 bg-brand-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-brand-gray">
              <tr>
                <th className="px-4 py-3">Data/Hora</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Conta/Caixa</th>
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3 text-right">Saldo após</th>
              </tr>
            </thead>
            <tbody>
              {statementLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-brand-gray">
                    Carregando extrato...
                  </td>
                </tr>
              ) : statement?.items.length ? (
                statement.items.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-100">
                    <td className="px-4 py-3 text-brand-gray">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-brand-gray">{item.tipoLabel}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-brand-black">{item.descricao}</p>
                      <p className="text-xs text-brand-gray">
                        {item.category?.nome ?? "—"} · {item.numeroFormatado}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-brand-gray">
                      {item.financialAccount?.nome ?? item.cashbox?.nome ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-brand-gray">
                      {item.usuario?.nome ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-brand-black">
                      {formatCurrency(item.valor)}
                    </td>
                    <td className="px-4 py-3 text-right text-brand-black">
                      {formatCurrency(item.saldoApos)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-brand-gray">
                    Nenhuma movimentação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {statement && statement.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <p className="text-brand-gray">
              Página {statement.page} de {statement.totalPages} ({statement.total} registros)
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={page >= statement.totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </section>

      <Modal
        open={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="Nova transferência"
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            transferMutation.mutate({
              ...transferForm,
              fromFinancialAccountId: transferForm.fromFinancialAccountId || undefined,
              fromCashboxId: transferForm.fromCashboxId || undefined,
              toFinancialAccountId: transferForm.toFinancialAccountId || undefined,
              toCashboxId: transferForm.toCashboxId || undefined,
            });
          }}
        >
          <select
            className="w-full border border-neutral-300 px-3 py-2 text-sm"
            value={transferForm.fromFinancialAccountId || ""}
            onChange={(event) =>
              setTransferForm((current) => ({
                ...current,
                fromFinancialAccountId: event.target.value,
                fromCashboxId: "",
              }))
            }
          >
            <option value="">Origem: conta bancária</option>
            {accounts?.map((account) => (
              <option key={account.id} value={account.id}>
                {account.nome}
              </option>
            ))}
          </select>
          <select
            className="w-full border border-neutral-300 px-3 py-2 text-sm"
            value={transferForm.fromCashboxId || ""}
            onChange={(event) =>
              setTransferForm((current) => ({
                ...current,
                fromCashboxId: event.target.value,
                fromFinancialAccountId: "",
              }))
            }
          >
            <option value="">Origem: caixa</option>
            {cashboxes?.map((cashbox) => (
              <option key={cashbox.id} value={cashbox.id}>
                {cashbox.nome}
              </option>
            ))}
          </select>
          <select
            className="w-full border border-neutral-300 px-3 py-2 text-sm"
            value={transferForm.toFinancialAccountId || ""}
            onChange={(event) =>
              setTransferForm((current) => ({
                ...current,
                toFinancialAccountId: event.target.value,
                toCashboxId: "",
              }))
            }
          >
            <option value="">Destino: conta bancária</option>
            {accounts?.map((account) => (
              <option key={account.id} value={account.id}>
                {account.nome}
              </option>
            ))}
          </select>
          <select
            className="w-full border border-neutral-300 px-3 py-2 text-sm"
            value={transferForm.toCashboxId || ""}
            onChange={(event) =>
              setTransferForm((current) => ({
                ...current,
                toCashboxId: event.target.value,
                toFinancialAccountId: "",
              }))
            }
          >
            <option value="">Destino: caixa</option>
            {cashboxes?.map((cashbox) => (
              <option key={cashbox.id} value={cashbox.id}>
                {cashbox.nome}
              </option>
            ))}
          </select>
          <select
            className="w-full border border-neutral-300 px-3 py-2 text-sm"
            required
            value={transferForm.paymentMethodId}
            onChange={(event) =>
              setTransferForm((current) => ({
                ...current,
                paymentMethodId: event.target.value,
              }))
            }
          >
            <option value="">Forma de pagamento</option>
            {paymentMethods?.map((method) => (
              <option key={method.id} value={method.id}>
                {method.nome}
              </option>
            ))}
          </select>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            required
            placeholder="Valor"
            value={transferForm.valor || ""}
            onChange={(event) =>
              setTransferForm((current) => ({
                ...current,
                valor: Number(event.target.value),
              }))
            }
          />
          <Input
            placeholder="Descrição (opcional)"
            value={transferForm.descricao}
            onChange={(event) =>
              setTransferForm((current) => ({
                ...current,
                descricao: event.target.value,
              }))
            }
          />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setTransferModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={transferMutation.isPending}>
              Confirmar transferência
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title="Ajuste financeiro"
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            adjustMutation.mutate({
              ...adjustForm,
              financialAccountId: adjustForm.financialAccountId || undefined,
              cashboxId: adjustForm.cashboxId || undefined,
            });
          }}
        >
          <select
            className="w-full border border-neutral-300 px-3 py-2 text-sm"
            value={adjustForm.tipo}
            onChange={(event) =>
              setAdjustForm((current) => ({
                ...current,
                tipo: event.target.value as CreateCashAdjustmentInput["tipo"],
              }))
            }
          >
            <option value="AJUSTE_POSITIVO">Ajuste positivo</option>
            <option value="AJUSTE_NEGATIVO">Ajuste negativo</option>
          </select>
          <select
            className="w-full border border-neutral-300 px-3 py-2 text-sm"
            value={adjustForm.financialAccountId || ""}
            onChange={(event) =>
              setAdjustForm((current) => ({
                ...current,
                financialAccountId: event.target.value,
                cashboxId: "",
              }))
            }
          >
            <option value="">Conta bancária</option>
            {accounts?.map((account) => (
              <option key={account.id} value={account.id}>
                {account.nome}
              </option>
            ))}
          </select>
          <select
            className="w-full border border-neutral-300 px-3 py-2 text-sm"
            value={adjustForm.cashboxId || ""}
            onChange={(event) =>
              setAdjustForm((current) => ({
                ...current,
                cashboxId: event.target.value,
                financialAccountId: "",
              }))
            }
          >
            <option value="">Caixa</option>
            {cashboxes?.map((cashbox) => (
              <option key={cashbox.id} value={cashbox.id}>
                {cashbox.nome}
              </option>
            ))}
          </select>
          <select
            className="w-full border border-neutral-300 px-3 py-2 text-sm"
            required
            value={adjustForm.paymentMethodId}
            onChange={(event) =>
              setAdjustForm((current) => ({
                ...current,
                paymentMethodId: event.target.value,
              }))
            }
          >
            <option value="">Forma de pagamento</option>
            {paymentMethods?.map((method) => (
              <option key={method.id} value={method.id}>
                {method.nome}
              </option>
            ))}
          </select>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            required
            placeholder="Valor"
            value={adjustForm.valor || ""}
            onChange={(event) =>
              setAdjustForm((current) => ({
                ...current,
                valor: Number(event.target.value),
              }))
            }
          />
          <Input
            required
            placeholder="Motivo do ajuste"
            value={adjustForm.motivo}
            onChange={(event) =>
              setAdjustForm((current) => ({
                ...current,
                motivo: event.target.value,
              }))
            }
          />
          <Input
            placeholder="Descrição (opcional)"
            value={adjustForm.descricao}
            onChange={(event) =>
              setAdjustForm((current) => ({
                ...current,
                descricao: event.target.value,
              }))
            }
          />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setAdjustModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={adjustMutation.isPending}>
              Registrar ajuste
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={openModalOpen} onClose={() => setOpenModalOpen(false)} title="Abrir caixa">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            openMutation.mutate(openForm);
          }}
        >
          <select
            className="w-full border border-neutral-300 px-3 py-2 text-sm"
            required
            value={openForm.cashboxId}
            onChange={(event) =>
              setOpenForm((current) => ({ ...current, cashboxId: event.target.value }))
            }
          >
            <option value="">Selecione o caixa</option>
            {cashboxes?.map((cashbox) => (
              <option key={cashbox.id} value={cashbox.id}>
                {cashbox.nome}
              </option>
            ))}
          </select>
          <Input
            type="number"
            min="0"
            step="0.01"
            required
            placeholder="Saldo inicial"
            value={openForm.saldoInicial}
            onChange={(event) =>
              setOpenForm((current) => ({
                ...current,
                saldoInicial: Number(event.target.value),
              }))
            }
          />
          <Input
            placeholder="Observações (opcional)"
            value={openForm.observacoes}
            onChange={(event) =>
              setOpenForm((current) => ({ ...current, observacoes: event.target.value }))
            }
          />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpenModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={openMutation.isPending}>
              Abrir caixa
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={closeModalOpen} onClose={() => setCloseModalOpen(false)} title="Fechar caixa">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            closeMutation.mutate({
              cashboxId: closeForm.cashboxId,
              saldoFinal: closeForm.saldoFinal,
              observacoes: closeForm.observacoes || undefined,
            });
          }}
        >
          <select
            className="w-full border border-neutral-300 px-3 py-2 text-sm"
            required
            value={closeForm.cashboxId}
            onChange={(event) =>
              setCloseForm((current) => ({ ...current, cashboxId: event.target.value }))
            }
          >
            <option value="">Selecione o caixa</option>
            {cashboxes?.map((cashbox) => (
              <option key={cashbox.id} value={cashbox.id}>
                {cashbox.nome}
              </option>
            ))}
          </select>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Saldo final (opcional — usa saldo calculado)"
            value={closeForm.saldoFinal ?? ""}
            onChange={(event) =>
              setCloseForm((current) => ({
                ...current,
                saldoFinal: event.target.value ? Number(event.target.value) : undefined,
              }))
            }
          />
          <Input
            placeholder="Observações (opcional)"
            value={closeForm.observacoes}
            onChange={(event) =>
              setCloseForm((current) => ({ ...current, observacoes: event.target.value }))
            }
          />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCloseModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={closeMutation.isPending}>
              Fechar caixa
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
