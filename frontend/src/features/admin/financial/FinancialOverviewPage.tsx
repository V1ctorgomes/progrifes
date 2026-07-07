"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { financialDashboardAdminApi } from "@/lib/admin-api";
import { formatCurrency } from "@/utils/cn";
import {
  DASHBOARD_COMPARISON_OPTIONS,
  DASHBOARD_PERIOD_OPTIONS,
  type DashboardComparison,
  type DashboardPeriodPreset,
  type FinancialDashboard,
} from "@/types/financial-dashboard";

function SummaryCard({
  label,
  value,
  format = "currency",
  trend,
}: {
  label: string;
  value: number;
  format?: "currency" | "number" | "percent";
  trend?: DashboardComparison;
}) {
  const formatted =
    format === "currency"
      ? formatCurrency(value)
      : format === "percent"
        ? `${value.toFixed(1)}%`
        : String(value);

  return (
    <div className="border border-neutral-200 bg-brand-white p-4">
      <p className="text-xs uppercase tracking-wide text-brand-gray">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-brand-black">{formatted}</p>
      {trend ? (
        <p
          className={`mt-1 text-xs ${
            trend.tendencia === "ALTA"
              ? "text-emerald-700"
              : trend.tendencia === "BAIXA"
                ? "text-red-700"
                : "text-brand-gray"
          }`}
        >
          {trend.variacaoPercentual > 0 ? "+" : ""}
          {trend.variacaoPercentual.toFixed(1)}% vs período anterior
        </p>
      ) : null}
    </div>
  );
}

function BarChart({
  title,
  items,
  valueKey,
  labelKey,
  color = "bg-brand-black",
}: {
  title: string;
  items: Array<Record<string, string | number>>;
  valueKey: string;
  labelKey: string;
  color?: string;
}) {
  const max = Math.max(...items.map((item) => Number(item[valueKey]) || 0), 1);

  return (
    <div className="border border-neutral-200 bg-brand-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-black">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-brand-gray">Sem dados no período.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item, index) => {
            const value = Number(item[valueKey]) || 0;
            const width = `${Math.max((value / max) * 100, 4)}%`;
            return (
              <div key={`${item[labelKey]}-${index}`}>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-brand-gray">{String(item[labelKey])}</span>
                  <span className="shrink-0 font-medium text-brand-black">
                    {formatCurrency(value)}
                  </span>
                </div>
                <div className="h-2 bg-neutral-100">
                  <div className={`h-2 ${color}`} style={{ width }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DualBarChart({
  title,
  items,
}: {
  title: string;
  items: Array<{ periodo: string; receitas: number; despesas: number }>;
}) {
  const max = Math.max(
    ...items.flatMap((item) => [item.receitas, item.despesas]),
    1,
  );

  return (
    <div className="border border-neutral-200 bg-brand-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-black">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-brand-gray">Sem dados no período.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {items.slice(-12).map((item) => (
            <div key={item.periodo}>
              <p className="mb-2 text-xs text-brand-gray">
                {new Date(item.periodo).toLocaleDateString("pt-BR")}
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-16 text-xs text-brand-gray">Receitas</span>
                  <div className="h-2 flex-1 bg-neutral-100">
                    <div
                      className="h-2 bg-emerald-600"
                      style={{ width: `${Math.max((item.receitas / max) * 100, 4)}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-xs">{formatCurrency(item.receitas)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-16 text-xs text-brand-gray">Despesas</span>
                  <div className="h-2 flex-1 bg-neutral-100">
                    <div
                      className="h-2 bg-red-600"
                      style={{ width: `${Math.max((item.despesas / max) * 100, 4)}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-xs">{formatCurrency(item.despesas)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatPeriodLabel(periodo: string) {
  if (periodo.includes("-") && periodo.length === 7) {
    const [year, month] = periodo.split("-");
    return `${month}/${year}`;
  }
  return new Date(periodo).toLocaleDateString("pt-BR");
}

function exportDashboardCsv(data: FinancialDashboard) {
  const rows = [
    ["Indicador", "Valor"],
    ["Faturamento do dia", data.cards.faturamentoDia],
    ["Faturamento do mês", data.cards.faturamentoMes],
    ["Faturamento do período", data.cards.faturamentoPeriodo],
    ["Lucro bruto", data.cards.lucroBruto],
    ["Lucro líquido", data.cards.lucroLiquido],
    ["Total recebido", data.cards.totalRecebido],
    ["Total pago", data.cards.totalPago],
    ["Saldo atual", data.cards.saldoAtual],
    ["Fluxo de caixa", data.cards.fluxoCaixa],
    ["Ticket médio", data.cards.ticketMedio],
    ["Pedidos no período", data.cards.quantidadePedidos],
    ["Clientes ativos", data.cards.quantidadeClientes],
    ["Produtos vendidos", data.cards.produtosVendidos],
    ["Contas a receber", data.financeiro.contasAReceber],
    ["Contas a pagar", data.financeiro.contasAPagar],
    ["Produtos sem estoque", data.estoque.produtosSemEstoque],
    ["Compras pendentes", data.estoque.comprasPendentes],
  ];

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `dashboard-financeiro-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function FinancialOverviewPage() {
  const [preset, setPreset] = useState<DashboardPeriodPreset>("ESTE_MES");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [comparativo, setComparativo] = useState<"DIA" | "SEMANA" | "MES" | "ANO">("MES");

  const queryParams = useMemo(
    () => ({
      preset,
      ...(preset === "PERSONALIZADO" && dataInicio && dataFim
        ? { dataInicio, dataFim }
        : {}),
    }),
    [preset, dataInicio, dataFim],
  );

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin", "financial-dashboard", queryParams],
    queryFn: () => financialDashboardAdminApi.get(queryParams),
    refetchInterval: 60_000,
  });

  const { data: summary } = useQuery({
    queryKey: ["admin", "financial-dashboard", "summary", queryParams, comparativo],
    queryFn: () => financialDashboardAdminApi.summary({ ...queryParams, comparativo }),
  });

  if (isLoading) {
    return <p className="text-brand-gray">Carregando dashboard financeiro...</p>;
  }

  if (!data) {
    return <p className="text-brand-gray">Não foi possível carregar o dashboard financeiro.</p>;
  }

  const comparisons = summary?.comparacoes;

  return (
    <div className="space-y-8 print:space-y-4" id="financial-dashboard">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between print:hidden">
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            Dashboard Financeiro
          </h1>
          <p className="text-brand-gray">
            Visão consolidada de vendas, financeiro, estoque e alertas em tempo real.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/admin/financeiro/contas-receber" className="text-sm underline">
              Contas a receber →
            </Link>
            <Link href="/admin/financeiro/contas-pagar" className="text-sm underline">
              Contas a pagar →
            </Link>
            <Link href="/admin/financeiro/fluxo-caixa" className="text-sm underline">
              Fluxo de caixa →
            </Link>
            <Link href="/admin/financeiro/despesas" className="text-sm underline">
              Despesas →
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => refetch()}>
            {isFetching ? "Atualizando..." : "Atualizar"}
          </Button>
          <Button type="button" variant="outline" onClick={() => exportDashboardCsv(data)}>
            Exportar CSV
          </Button>
          <Button type="button" variant="outline" onClick={() => window.print()}>
            Imprimir
          </Button>
        </div>
      </div>

      <section className="space-y-3 border border-neutral-200 bg-brand-white p-4 print:hidden">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-black">Filtros</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs text-brand-gray">Período</label>
            <select
              className="w-full border border-neutral-200 bg-white px-3 py-2 text-sm"
              value={preset}
              onChange={(event) => setPreset(event.target.value as DashboardPeriodPreset)}
            >
              {DASHBOARD_PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {preset === "PERSONALIZADO" ? (
            <>
              <div>
                <label className="mb-1 block text-xs text-brand-gray">Data início</label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(event) => setDataInicio(event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-brand-gray">Data fim</label>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(event) => setDataFim(event.target.value)}
                />
              </div>
            </>
          ) : null}
          <div>
            <label className="mb-1 block text-xs text-brand-gray">Comparativo</label>
            <select
              className="w-full border border-neutral-200 bg-white px-3 py-2 text-sm"
              value={comparativo}
              onChange={(event) =>
                setComparativo(event.target.value as "DIA" | "SEMANA" | "MES" | "ANO")
              }
            >
              {DASHBOARD_COMPARISON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-brand-gray">
          Período: {new Date(data.periodo.dataInicio).toLocaleDateString("pt-BR")} até{" "}
          {new Date(data.periodo.dataFim).toLocaleDateString("pt-BR")}
        </p>
      </section>

      {data.alerts.total > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-black">
            Alertas ({data.alerts.total})
          </h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.alerts.alertas.map((alerta) => (
              <div
                key={alerta.tipo}
                className={`border bg-brand-white p-4 ${
                  alerta.severidade === "ALTA"
                    ? "border-red-300"
                    : alerta.severidade === "MEDIA"
                      ? "border-amber-300"
                      : "border-neutral-200"
                }`}
              >
                <p className="text-xs uppercase tracking-wide text-brand-gray">{alerta.titulo}</p>
                <p className="mt-1 font-medium text-brand-black">{alerta.descricao}</p>
                {alerta.valor !== undefined ? (
                  <p className="mt-1 text-sm text-brand-gray">{formatCurrency(alerta.valor)}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-black">
          Indicadores principais
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Faturamento do dia" value={data.cards.faturamentoDia} />
          <SummaryCard label="Faturamento do mês" value={data.cards.faturamentoMes} />
          <SummaryCard
            label="Faturamento do período"
            value={data.cards.faturamentoPeriodo}
            trend={comparisons?.faturamento}
          />
          <SummaryCard label="Lucro bruto" value={data.cards.lucroBruto} />
          <SummaryCard
            label="Lucro líquido"
            value={data.cards.lucroLiquido}
            trend={comparisons?.lucroLiquido}
          />
          <SummaryCard
            label="Total recebido"
            value={data.cards.totalRecebido}
            trend={comparisons?.totalRecebido}
          />
          <SummaryCard
            label="Total pago"
            value={data.cards.totalPago}
            trend={comparisons?.totalPago}
          />
          <SummaryCard label="Saldo atual" value={data.cards.saldoAtual} />
          <SummaryCard label="Fluxo de caixa" value={data.cards.fluxoCaixa} />
          <SummaryCard
            label="Ticket médio"
            value={data.cards.ticketMedio}
            trend={comparisons?.ticketMedio}
          />
          <SummaryCard
            label="Pedidos no período"
            value={data.cards.quantidadePedidos}
            format="number"
            trend={comparisons?.pedidos}
          />
          <SummaryCard
            label="Clientes ativos"
            value={data.cards.quantidadeClientes}
            format="number"
          />
          <SummaryCard
            label="Produtos vendidos"
            value={data.cards.produtosVendidos}
            format="number"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-black">
          Indicadores financeiros
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Contas a receber" value={data.financeiro.contasAReceber} />
          <SummaryCard label="Contas a pagar" value={data.financeiro.contasAPagar} />
          <SummaryCard
            label="Despesas pendentes"
            value={data.financeiro.despesasPendentes.valor}
          />
          <SummaryCard label="Despesas pagas" value={data.financeiro.despesasPagas.valor} />
          <SummaryCard label="Receitas pendentes" value={data.financeiro.receitasPendentes} />
          <SummaryCard label="Receitas recebidas" value={data.financeiro.receitasRecebidas} />
          <SummaryCard label="Saldo bancário" value={data.financeiro.saldoBancario} />
          <SummaryCard label="Saldo em caixa" value={data.financeiro.saldoCaixa} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-black">
          Indicadores comerciais
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Pedidos hoje" value={data.comercial.pedidosHoje} format="number" />
          <SummaryCard label="Pedidos no mês" value={data.comercial.pedidosMes} format="number" />
          <SummaryCard
            label="Clientes ativos"
            value={data.comercial.clientesAtivos}
            format="number"
          />
          <SummaryCard label="Novos clientes" value={data.comercial.novosClientes} format="number" />
          <SummaryCard
            label="Conversão de pedidos"
            value={data.comercial.conversaoPedidos}
            format="percent"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-black">
          Indicadores de estoque
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            label="Produtos em estoque"
            value={data.estoque.produtosEmEstoque}
            format="number"
          />
          <SummaryCard
            label="Sem estoque"
            value={data.estoque.produtosSemEstoque}
            format="number"
          />
          <SummaryCard
            label="Estoque baixo"
            value={data.estoque.produtosEstoqueBaixo}
            format="number"
          />
          <SummaryCard label="Valor do estoque" value={data.estoque.valorTotalEstoque} />
          <SummaryCard
            label="Compras pendentes"
            value={data.estoque.comprasPendentes}
            format="number"
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <DualBarChart title="Receitas × Despesas" items={data.charts.receitasVsDespesas} />
        <BarChart
          title="Faturamento mensal"
          items={data.charts.faturamentoMensal.map((item) => ({
            label: formatPeriodLabel(item.periodo),
            value: item.total,
          }))}
          valueKey="value"
          labelKey="label"
        />
        <BarChart
          title="Vendas por categoria"
          items={data.charts.vendasPorCategoria.map((item) => ({
            label: item.categoriaNome,
            value: item.total,
          }))}
          valueKey="value"
          labelKey="label"
          color="bg-emerald-700"
        />
        <BarChart
          title="Compras por mês"
          items={data.charts.comprasPorMes.map((item) => ({
            label: formatPeriodLabel(item.periodo),
            value: item.total,
          }))}
          valueKey="value"
          labelKey="label"
          color="bg-amber-700"
        />
        <BarChart
          title="Produtos mais vendidos"
          items={data.charts.produtosMaisVendidos.map((item) => ({
            label: item.produtoNome,
            value: item.total,
          }))}
          valueKey="value"
          labelKey="label"
        />
        <BarChart
          title="Fluxo de caixa diário"
          items={data.charts.fluxoCaixaDiario.map((item) => ({
            label: formatPeriodLabel(item.periodo),
            value: item.saldo,
          }))}
          valueKey="value"
          labelKey="label"
          color="bg-sky-700"
        />
      </section>
    </div>
  );
}
