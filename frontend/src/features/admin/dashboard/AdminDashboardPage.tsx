"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { adminDashboardApi } from "@/lib/admin-api";
import { formatCurrency } from "@/utils/cn";
import {
  ADMIN_DASHBOARD_PERIOD_OPTIONS,
  type AdminDashboardPeriodPreset,
  type DashboardCard,
} from "@/types/admin-dashboard";

const DashboardChartsPanel = dynamic(
  () =>
    import("@/features/admin/dashboard/DashboardChartsPanel").then(
      (mod) => mod.DashboardChartsPanel,
    ),
  {
    ssr: false,
    loading: () => <p className="text-sm text-brand-gray">Carregando gráficos...</p>,
  },
);

function formatCardValue(card: DashboardCard) {
  return card.formato === "currency" ? formatCurrency(card.valor) : String(card.valor);
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="border border-neutral-200 bg-brand-white p-4">
      <p className="text-xs uppercase tracking-wide text-brand-gray">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-brand-black">{value}</p>
    </div>
  );
}

export function AdminDashboardPage() {
  const [preset, setPreset] = useState<AdminDashboardPeriodPreset>("ESTE_MES");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const queryParams = useMemo(
    () => ({
      preset,
      dataInicio: preset === "PERSONALIZADO" ? dataInicio || undefined : undefined,
      dataFim: preset === "PERSONALIZADO" ? dataFim || undefined : undefined,
    }),
    [preset, dataInicio, dataFim],
  );

  const enabled = preset !== "PERSONALIZADO" || Boolean(dataInicio && dataFim);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin", "dashboard", queryParams],
    queryFn: () => adminDashboardApi.get(queryParams),
    enabled,
  });

  const cards = data?.cards ?? [];

  if (isLoading) {
    return <p className="text-sm text-brand-gray">Carregando dashboard...</p>;
  }

  if (!data) {
    return <p className="text-sm text-brand-gray">Não foi possível carregar o dashboard.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            Dashboard
          </h1>
          <p className="text-sm text-brand-gray">
            Visão rápida da operação: pedidos, estoque, financeiro e entregas.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/admin/pedidos" className="underline">
              Pedidos →
            </Link>
            <Link href="/admin/estoque" className="underline">
              Estoque →
            </Link>
            <Link href="/admin/financeiro" className="underline">
              Financeiro →
            </Link>
            <Link href="/admin/entregas" className="underline">
              Entregas →
            </Link>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Atualizando..." : "Atualizar"}
        </Button>
      </div>

      <section className="space-y-3 border border-neutral-200 bg-brand-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-black">Filtros</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-black">Período</label>
            <select
              className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
              value={preset}
              onChange={(event) => setPreset(event.target.value as AdminDashboardPeriodPreset)}
            >
              {ADMIN_DASHBOARD_PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {preset === "PERSONALIZADO" ? (
            <>
              <Input
                label="Data início"
                type="date"
                value={dataInicio}
                onChange={(event) => setDataInicio(event.target.value)}
              />
              <Input
                label="Data fim"
                type="date"
                value={dataFim}
                onChange={(event) => setDataFim(event.target.value)}
              />
            </>
          ) : null}
        </div>
        <p className="text-xs text-brand-gray">
          Período: {new Date(data.periodo.dataInicio).toLocaleDateString("pt-BR")} até{" "}
          {new Date(data.periodo.dataFim).toLocaleDateString("pt-BR")}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-black">
          Indicadores principais
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.id}
              href={card.href}
              className="border border-neutral-200 bg-brand-white p-4 transition-colors hover:border-brand-black"
            >
              <p className="text-xs uppercase tracking-wide text-brand-gray">{card.titulo}</p>
              <p className="mt-1 font-display text-2xl font-semibold text-brand-black">
                {formatCardValue(card)}
              </p>
              {card.comparacao ? (
                <p
                  className={`mt-1 text-xs ${
                    card.comparacao.tendencia === "ALTA"
                      ? "text-emerald-700"
                      : card.comparacao.tendencia === "BAIXA"
                        ? "text-red-700"
                        : "text-brand-gray"
                  }`}
                >
                  {card.comparacao.variacaoPercentual > 0 ? "+" : ""}
                  {card.comparacao.variacaoPercentual.toFixed(1)}% vs período anterior
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      </section>

      {data.charts ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-black">
            Gráficos
          </h2>
          <DashboardChartsPanel charts={data.charts} />
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="space-y-3 xl:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-black">
              Pedidos recentes
            </h2>
            <Link href="/admin/pedidos" className="text-sm underline">
              Ver todos
            </Link>
          </div>
          <div className="overflow-x-auto border border-neutral-200 bg-brand-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-brand-gray">
                <tr>
                  <th className="px-4 py-3">Número</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-brand-gray">
                      Nenhum pedido recente.
                    </td>
                  </tr>
                ) : (
                  data.recentOrders.slice(0, 8).map((order) => (
                    <tr key={order.id} className="border-b border-neutral-100">
                      <td className="px-4 py-3">
                        <Link href={order.href} className="font-medium underline">
                          {order.numeroFormatado}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{order.clienteNome}</td>
                      <td className="px-4 py-3">{formatCurrency(order.total)}</td>
                      <td className="px-4 py-3 text-xs uppercase">{order.statusLabel}</td>
                      <td className="px-4 py-3 text-brand-gray">
                        {formatDateTime(order.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-black">
            Resumo rápido
          </h2>
          <div className="space-y-3">
            {data.financial ? (
              <>
                <SummaryCard
                  label="Receitas do período"
                  value={formatCurrency(data.financial.receitasPeriodo)}
                />
                <SummaryCard
                  label="Despesas do período"
                  value={formatCurrency(data.financial.despesasPeriodo)}
                />
                <SummaryCard label="Saldo" value={formatCurrency(data.financial.saldo)} />
              </>
            ) : null}
            {data.deliveries ? (
              <SummaryCard
                label="Entregas em andamento"
                value={
                  data.deliveries.emPreparacao +
                  data.deliveries.prontas +
                  data.deliveries.saiuParaEntrega
                }
              />
            ) : null}
            {data.stock ? (
              <SummaryCard
                label="Alertas de estoque"
                value={
                  (data.stock.totais?.semEstoque ?? data.stock.semEstoque.length) +
                  (data.stock.totais?.estoqueBaixo ?? data.stock.estoqueBaixo.length)
                }
              />
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
