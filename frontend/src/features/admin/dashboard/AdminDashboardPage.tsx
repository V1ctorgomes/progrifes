"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminDashboardApi } from "@/lib/admin-api";
import { cn, formatCurrency } from "@/utils/cn";
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
    loading: () => (
      <div className="flex h-72 items-center justify-center text-sm text-brand-gray">
        Montando gráficos...
      </div>
    ),
  },
);

function findCard(cards: DashboardCard[], id: string) {
  return cards.find((card) => card.id === id);
}

function formatValue(card: DashboardCard | undefined, fallback = "—") {
  if (!card) return fallback;
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

function Trend({
  value,
  className,
}: {
  value?: { variacaoPercentual: number; tendencia: string } | null;
  className?: string;
}) {
  if (!value) return null;
  const positive = value.tendencia === "ALTA";
  const negative = value.tendencia === "BAIXA";
  return (
    <span
      className={cn(
        "text-xs font-medium tracking-wide",
        positive && "text-emerald-600",
        negative && "text-red-600",
        !positive && !negative && "text-brand-gray",
        className,
      )}
    >
      {value.variacaoPercentual > 0 ? "+" : ""}
      {value.variacaoPercentual.toFixed(1)}%
    </span>
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

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="animate-pulse text-sm uppercase tracking-[0.2em] text-brand-gray">
          Carregando operação...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-brand-gray">Não foi possível carregar o dashboard.</p>
      </div>
    );
  }

  const cards = data.cards;
  const faturamento = findCard(cards, "faturamento-dia");
  const pedidosHoje = findCard(cards, "pedidos-hoje");
  const entregas = findCard(cards, "entregas-pendentes");
  const semEstoque = findCard(cards, "sem-estoque");
  const receber = findCard(cards, "contas-receber");
  const pagar = findCard(cards, "contas-pagar");

  const entregasAndamento = data.deliveries
    ? data.deliveries.emPreparacao +
      data.deliveries.prontas +
      data.deliveries.saiuParaEntrega
    : 0;

  const alertasEstoque =
    (data.stock?.totais?.semEstoque ?? 0) + (data.stock?.totais?.estoqueBaixo ?? 0);

  const modules = [
    {
      href: "/admin/pedidos",
      label: "Pedidos",
      metric: formatValue(pedidosHoje, "0"),
      hint: "hoje",
    },
    {
      href: "/admin/estoque",
      label: "Estoque",
      metric: String(alertasEstoque),
      hint: "alertas",
    },
    {
      href: "/admin/financeiro",
      label: "Financeiro",
      metric: data.financial ? formatCurrency(data.financial.saldo) : "—",
      hint: "saldo do período",
    },
    {
      href: "/admin/entregas",
      label: "Entregas",
      metric: String(entregasAndamento || entregas?.valor || 0),
      hint: "em andamento",
    },
  ];

  return (
    <div className="dashboard-shell -mx-4 -mt-4 space-y-0 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
      {/* Command header */}
      <header className="relative overflow-hidden bg-brand-black px-4 py-8 text-brand-white sm:px-6 lg:px-8 lg:py-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(135deg, transparent 40%, #c8a96e 100%), repeating-linear-gradient(-45deg, transparent, transparent 12px, rgba(255,255,255,0.03) 12px, rgba(255,255,255,0.03) 13px)",
          }}
        />
        <div className="relative animate-fade-in space-y-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl space-y-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-brand-accent">
                Centro de comando
              </p>
              <h1 className="font-display text-4xl font-semibold uppercase leading-none tracking-wide sm:text-5xl">
                Operação
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-neutral-400">
                Leitura rápida do dia e do período. Um painel, quatro frentes.
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-3 sm:items-end">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="border border-white/20 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white transition hover:border-brand-accent hover:text-brand-accent disabled:opacity-50"
              >
                {isFetching ? "Sincronizando" : "Sincronizar"}
              </button>
              <p className="text-[11px] uppercase tracking-wider text-neutral-500">
                {new Date(data.periodo.dataInicio).toLocaleDateString("pt-BR")} —{" "}
                {new Date(data.periodo.dataFim).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {ADMIN_DASHBOARD_PERIOD_OPTIONS.filter((option) => option.value !== "PERSONALIZADO").map(
              (option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPreset(option.value)}
                  className={cn(
                    "px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] transition",
                    preset === option.value
                      ? "bg-brand-accent text-brand-black"
                      : "bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white",
                  )}
                >
                  {option.label}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() => setPreset("PERSONALIZADO")}
              className={cn(
                "px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] transition",
                preset === "PERSONALIZADO"
                  ? "bg-brand-accent text-brand-black"
                  : "bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white",
              )}
            >
              Personalizado
            </button>
          </div>

          {preset === "PERSONALIZADO" ? (
            <div className="flex flex-wrap gap-3">
              <label className="flex flex-col gap-1 text-[10px] uppercase tracking-wider text-neutral-400">
                De
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(event) => setDataInicio(event.target.value)}
                  className="border border-white/20 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-brand-accent"
                />
              </label>
              <label className="flex flex-col gap-1 text-[10px] uppercase tracking-wider text-neutral-400">
                Até
                <input
                  type="date"
                  value={dataFim}
                  onChange={(event) => setDataFim(event.target.value)}
                  className="border border-white/20 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-brand-accent"
                />
              </label>
            </div>
          ) : null}

          <div className="grid gap-8 border-t border-white/10 pt-8 lg:grid-cols-[1.4fr_1fr]">
            <div className="animate-slide-up space-y-2">
              <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">
                Faturamento do dia
              </p>
              <p className="font-display text-5xl font-semibold tracking-tight text-white sm:text-6xl">
                {formatValue(faturamento)}
              </p>
              <div className="flex items-center gap-3">
                <Trend value={faturamento?.comparacao} className="text-sm" />
                <span className="text-xs text-neutral-500">vs ontem</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 animate-slide-up sm:gap-8">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">
                  Pedidos hoje
                </p>
                <p className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
                  {formatValue(pedidosHoje, "0")}
                </p>
                <Trend value={pedidosHoje?.comparacao} className="mt-1 block" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">
                  Entregas abertas
                </p>
                <p className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
                  {formatValue(entregas, "0")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-10 bg-brand-light px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Module launchers — interactive destinations */}
        <section className="animate-slide-up">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-brand-black">
              Frentes
            </h2>
          </div>
          <div className="grid gap-px bg-brand-black sm:grid-cols-2 xl:grid-cols-4">
            {modules.map((module, index) => (
              <Link
                key={module.href}
                href={module.href}
                className="group relative bg-brand-white p-5 transition duration-300 hover:bg-brand-black hover:text-white sm:p-6"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-brand-gray transition group-hover:text-brand-accent">
                    {module.label}
                  </p>
                  <span className="text-brand-accent opacity-0 transition group-hover:opacity-100">
                    →
                  </span>
                </div>
                <p className="mt-6 font-display text-3xl font-semibold tracking-tight">
                  {module.metric}
                </p>
                <p className="mt-1 text-xs text-brand-gray transition group-hover:text-neutral-400">
                  {module.hint}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* KPI strip */}
        <section className="grid gap-6 border-y border-neutral-300 py-6 sm:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-brand-gray">A receber</p>
            <p className="mt-2 font-display text-2xl font-semibold text-brand-black">
              {formatValue(receber)}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-brand-gray">A pagar</p>
            <p className="mt-2 font-display text-2xl font-semibold text-brand-black">
              {formatValue(pagar)}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-brand-gray">Sem estoque</p>
            <p className="mt-2 font-display text-2xl font-semibold text-brand-black">
              {formatValue(semEstoque, "0")}
            </p>
          </div>
        </section>

        {/* Charts + pulse */}
        <section className="grid gap-8 xl:grid-cols-[1.6fr_0.9fr]">
          <div className="min-w-0">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-brand-black">
                Movimento
              </h2>
              <p className="text-[11px] uppercase tracking-wider text-brand-gray">
                Faturamento × pedidos
              </p>
            </div>
            {data.charts ? <DashboardChartsPanel charts={data.charts} /> : null}
          </div>

          <aside className="space-y-0 border border-brand-black bg-brand-white">
            <div className="border-b border-neutral-200 bg-brand-black px-5 py-4 text-white">
              <p className="text-[11px] uppercase tracking-[0.25em] text-brand-accent">Pulso</p>
              <p className="mt-1 font-display text-lg uppercase tracking-wide">Resumo do período</p>
            </div>
            {data.financial ? (
              <>
                <div className="border-b border-neutral-200 px-5 py-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-brand-gray">Receitas</p>
                  <p className="mt-1 font-display text-xl font-semibold">
                    {formatCurrency(data.financial.receitasPeriodo)}
                  </p>
                </div>
                <div className="border-b border-neutral-200 px-5 py-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-brand-gray">Despesas</p>
                  <p className="mt-1 font-display text-xl font-semibold">
                    {formatCurrency(data.financial.despesasPeriodo)}
                  </p>
                </div>
                <div className="border-b border-neutral-200 px-5 py-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-brand-gray">Saldo</p>
                  <p
                    className={cn(
                      "mt-1 font-display text-xl font-semibold",
                      data.financial.saldo >= 0 ? "text-emerald-700" : "text-red-700",
                    )}
                  >
                    {formatCurrency(data.financial.saldo)}
                  </p>
                </div>
              </>
            ) : null}
            <div className="border-b border-neutral-200 px-5 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-brand-gray">
                Entregas em curso
              </p>
              <p className="mt-1 font-display text-xl font-semibold">{entregasAndamento}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-brand-gray">
                Alertas de estoque
              </p>
              <p className="mt-1 font-display text-xl font-semibold">{alertasEstoque}</p>
            </div>
          </aside>
        </section>

        {/* Recent orders */}
        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-brand-black">
                Fluxo recente
              </h2>
              <p className="mt-1 text-xs text-brand-gray">Últimos pedidos entrando no sistema</p>
            </div>
            <Link
              href="/admin/pedidos"
              className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand-black transition hover:text-brand-accent"
            >
              Ver pedidos
            </Link>
          </div>

          <div className="overflow-hidden border border-brand-black bg-brand-white">
            {data.recentOrders.length === 0 ? (
              <p className="px-5 py-10 text-sm text-brand-gray">Nenhum pedido recente.</p>
            ) : (
              <ul className="divide-y divide-neutral-200">
                {data.recentOrders.slice(0, 7).map((order) => (
                  <li key={order.id}>
                    <Link
                      href={order.href}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 transition hover:bg-brand-light sm:grid-cols-[7rem_1fr_8rem_9rem_7rem]"
                    >
                      <span className="font-display text-sm font-semibold tracking-wide">
                        {order.numeroFormatado}
                      </span>
                      <span className="truncate text-sm text-brand-black">{order.clienteNome}</span>
                      <span className="hidden text-right text-sm font-medium sm:block">
                        {formatCurrency(order.total)}
                      </span>
                      <span className="hidden text-right text-[11px] uppercase tracking-wider text-brand-gray sm:block">
                        {order.statusLabel}
                      </span>
                      <span className="text-right text-xs text-brand-gray">
                        {formatDateTime(order.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
