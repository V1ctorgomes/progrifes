"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/admin/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ExpenseStatusBadge } from "@/features/admin/expenses/ExpenseStatusBadge";
import { useAuth } from "@/hooks/useAuth";
import {
  expensesAdminApi,
  financialAdminApi,
  getErrorMessage,
  suppliersAdminApi,
} from "@/lib/admin-api";
import { formatCurrency } from "@/utils/cn";
import {
  EXPENSE_FREQUENCY_OPTIONS,
  EXPENSE_STATUS_OPTIONS,
  type CreateExpenseInput,
  type ExpenseStatus,
} from "@/types/expenses";

function DashboardCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-neutral-200 bg-brand-white p-4">
      <p className="text-xs uppercase tracking-wide text-brand-gray">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-brand-black">{value}</p>
    </div>
  );
}

function canWriteExpenses(permissions: string[]) {
  return permissions.includes("*") || permissions.includes("expenses:write");
}

export function ExpensesAdminPage() {
  const queryClient = useQueryClient();
  const { permissions } = useAuth();
  const canWrite = canWriteExpenses(permissions);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<ExpenseStatus | "">("");
  const [supplierId, setSupplierId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState<CreateExpenseInput>({
    descricao: "",
    categoryId: "",
    chartAccountId: "",
    costCenterId: "",
    valor: 0,
    competencia: new Date().toISOString().slice(0, 10),
    vencimento: new Date().toISOString().slice(0, 10),
    recorrente: false,
    variavel: true,
    quantidadeParcelas: 1,
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, supplierId, dataInicio]);

  const { data: suppliersData } = useQuery({
    queryKey: ["admin", "suppliers", "expenses-filter"],
    queryFn: () => suppliersAdminApi.list({ limit: 200 }),
  });

  const { data: financialOverview } = useQuery({
    queryKey: ["admin", "financial", "overview"],
    queryFn: financialAdminApi.overview,
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
      "expenses",
      page,
      debouncedSearch,
      status,
      supplierId,
      dataInicio,
    ],
    queryFn: () =>
      expensesAdminApi.list({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        status: status || undefined,
        supplierId: supplierId || undefined,
        dataInicio: dataInicio || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: expensesAdminApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "expenses"] });
      setModalOpen(false);
      setFormError("");
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const expenses = data?.data ?? [];
  const meta = data?.meta;
  const dashboard = data?.dashboard;
  const suppliers = suppliersData?.data ?? [];
  const costCenters = financialOverview?.costCenters ?? [];
  const principalCostCenter = costCenters.find((item) => item.principal);

  function openCreateModal() {
    const despesaCategory =
      categories?.find((item) => item.codigo === "DESPESA_OPERACIONAL") ??
      categories?.[0];
    setForm({
      descricao: "",
      categoryId: despesaCategory?.id ?? "",
      chartAccountId: despesaCategory?.chartAccountId ?? "",
      costCenterId: principalCostCenter?.id ?? costCenters[0]?.id ?? "",
      paymentMethodId: paymentMethods?.[0]?.id,
      valor: 0,
      competencia: new Date().toISOString().slice(0, 10),
      vencimento: new Date().toISOString().slice(0, 10),
      recorrente: false,
      variavel: true,
      quantidadeParcelas: 1,
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
            <span>Despesas</span>
          </div>
          <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            Controle de Despesas
          </h1>
          <p className="text-sm text-brand-gray">
            Cadastro de despesas operacionais com integração automática a contas a pagar
          </p>
        </div>
        {canWrite && <Button onClick={openCreateModal}>Nova despesa</Button>}
      </div>

      {dashboard && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardCard label="Despesas do dia" value={formatCurrency(dashboard.despesasDia)} />
          <DashboardCard label="Despesas do mês" value={formatCurrency(dashboard.despesasMes)} />
          <DashboardCard
            label="Pendentes"
            value={`${dashboard.despesasPendentes.quantidade} (${formatCurrency(dashboard.despesasPendentes.valor)})`}
          />
          <DashboardCard
            label="Vencidas"
            value={`${dashboard.despesasVencidas.quantidade} (${formatCurrency(dashboard.despesasVencidas.valor)})`}
          />
          <DashboardCard label="Despesas fixas" value={formatCurrency(dashboard.despesasFixas)} />
          <DashboardCard
            label="Despesas variáveis"
            value={formatCurrency(dashboard.despesasVariaveis)}
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Pesquisar"
          placeholder="Buscar descrição, documento..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-black">Status</label>
          <select
            className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value as ExpenseStatus | "")}
          >
            {EXPENSE_STATUS_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
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
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Vencimento</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-brand-gray">
                  Carregando...
                </td>
              </tr>
            ) : expenses.length ? (
              expenses.map((expense) => (
                <tr key={expense.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/financeiro/despesas/${expense.id}`}
                      className="font-medium text-brand-black underline"
                    >
                      {expense.numeroFormatado}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-brand-black">{expense.descricao}</p>
                    {expense.parcelaNumero && expense.totalParcelas ? (
                      <p className="text-xs text-brand-gray">
                        Parcela {expense.parcelaNumero}/{expense.totalParcelas}
                      </p>
                    ) : null}
                    {expense.recorrente ? (
                      <p className="text-xs text-brand-gray">Recorrente</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-brand-gray">{expense.categoryNome}</td>
                  <td className="px-4 py-3">
                    {new Date(expense.vencimento).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <ExpenseStatusBadge status={expense.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrency(expense.valor)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-brand-gray">
                  Nenhuma despesa encontrada.
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova despesa">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate({
              ...form,
              supplierId: form.supplierId || undefined,
              quantidadeParcelas:
                form.quantidadeParcelas && form.quantidadeParcelas > 1
                  ? form.quantidadeParcelas
                  : undefined,
              frequencia: form.recorrente ? form.frequencia : undefined,
            });
          }}
        >
          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <Input
            required
            placeholder="Descrição"
            value={form.descricao}
            onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))}
          />

          <select
            className="w-full border border-neutral-300 px-3 py-2 text-sm"
            value={form.supplierId ?? ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, supplierId: event.target.value }))
            }
          >
            <option value="">Fornecedor (opcional)</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.nomeFantasia}
              </option>
            ))}
          </select>

          <select
            className="w-full border border-neutral-300 px-3 py-2 text-sm"
            required
            value={form.categoryId}
            onChange={(event) => {
              const category = categories?.find((item) => item.id === event.target.value);
              setForm((current) => ({
                ...current,
                categoryId: event.target.value,
                chartAccountId: category?.chartAccountId ?? current.chartAccountId,
              }));
            }}
          >
            <option value="">Categoria</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.nome}
              </option>
            ))}
          </select>

          <select
            className="w-full border border-neutral-300 px-3 py-2 text-sm"
            required
            value={form.costCenterId}
            onChange={(event) =>
              setForm((current) => ({ ...current, costCenterId: event.target.value }))
            }
          >
            <option value="">Centro de custo</option>
            {costCenters.map((center) => (
              <option key={center.id} value={center.id}>
                {center.nome}
              </option>
            ))}
          </select>

          <select
            className="w-full border border-neutral-300 px-3 py-2 text-sm"
            value={form.paymentMethodId ?? ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, paymentMethodId: event.target.value }))
            }
          >
            <option value="">Forma de pagamento prevista</option>
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
            value={form.valor || ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, valor: Number(event.target.value) }))
            }
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              type="date"
              required
              value={form.competencia}
              onChange={(event) =>
                setForm((current) => ({ ...current, competencia: event.target.value }))
              }
            />
            <Input
              type="date"
              required
              value={form.vencimento}
              onChange={(event) =>
                setForm((current) => ({ ...current, vencimento: event.target.value }))
              }
            />
          </div>

          <Input
            placeholder="Número do documento (opcional)"
            value={form.documento ?? ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, documento: event.target.value }))
            }
          />

          <Input
            type="number"
            min="1"
            max="60"
            placeholder="Parcelas"
            value={form.quantidadeParcelas ?? 1}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                quantidadeParcelas: Number(event.target.value),
              }))
            }
          />

          <label className="flex items-center gap-2 text-sm text-brand-gray">
            <input
              type="checkbox"
              checked={form.recorrente}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  recorrente: event.target.checked,
                  variavel: !event.target.checked,
                }))
              }
            />
            Despesa recorrente
          </label>

          {form.recorrente && (
            <select
              className="w-full border border-neutral-300 px-3 py-2 text-sm"
              required
              value={form.frequencia ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  frequencia: event.target.value as CreateExpenseInput["frequencia"],
                }))
              }
            >
              <option value="">Frequência</option>
              {EXPENSE_FREQUENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          <textarea
            className="w-full border border-neutral-300 px-3 py-2 text-sm"
            placeholder="Observações"
            rows={3}
            value={form.observacoes ?? ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, observacoes: event.target.value }))
            }
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              Salvar despesa
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
