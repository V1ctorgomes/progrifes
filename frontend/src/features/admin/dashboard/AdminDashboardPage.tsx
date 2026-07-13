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
import {
  ArrowRight,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Package,
  Truck,
  AlertTriangle,
  ChevronRight,
  LineChart,
  ShoppingCart,
  PieChart,
  Boxes
} from "lucide-react";
import { cn } from "@/utils/cn";

const DashboardChartsPanel = dynamic(
  () =>
    import("@/features/admin/dashboard/DashboardChartsPanel").then(
      (mod) => mod.DashboardChartsPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] items-center justify-center rounded-2xl bg-white shadow-sm border border-neutral-100 w-full">
        <div className="flex items-center gap-3 text-neutral-400">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <p className="text-sm font-medium">Renderizando gráficos...</p>
        </div>
      </div>
    ),
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
  icon: Icon,
  variant = "default"
}: {
  label: string;
  value: string | number;
  icon?: any;
  variant?: "default" | "alert" | "success";
}) {
  return (
    <div className="flex items-start justify-between rounded-2xl bg-white p-5 shadow-sm border border-neutral-100 transition-shadow hover:shadow-md">
      <div>
        <p className="text-sm font-medium text-neutral-500">{label}</p>
        <p className="mt-2 font-display text-2xl font-bold text-brand-black">{value}</p>
      </div>
      {Icon && (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          variant === "alert" ? "bg-red-50 text-red-600" :
          variant === "success" ? "bg-emerald-50 text-emerald-600" :
          "bg-neutral-50 text-neutral-600"
        }`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
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
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <RefreshCw className="h-8 w-8 animate-spin text-neutral-300" />
        <p className="text-sm font-medium text-neutral-500">Preparando o seu dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 rounded-2xl bg-white border border-neutral-100 shadow-sm">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="text-sm font-medium text-neutral-500">Não foi possível carregar os dados do dashboard.</p>
        <button 
          onClick={() => refetch()} 
          className="mt-4 rounded-xl bg-brand-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header Area */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-brand-black">
            Visão Geral
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Acompanhe o desempenho da sua operação, pedidos e indicadores em tempo real.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {[
              { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
              { href: "/admin/estoque", label: "Estoque", icon: Boxes },
              { href: "/admin/financeiro", label: "Financeiro", icon: CreditCard },
              { href: "/admin/entregas", label: "Entregas", icon: Truck },
            ].map((link) => {
              const LinkIcon = link.icon;
              return (
                <Link key={link.href} href={link.href} className="group flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-600 shadow-sm border border-neutral-200 transition-colors hover:border-brand-black hover:text-brand-black">
                  <LinkIcon className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
        
        <button 
          onClick={() => refetch()} 
          disabled={isFetching}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-brand-black shadow-sm border border-neutral-200 transition-all hover:bg-neutral-50 hover:border-neutral-300 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4 text-neutral-500", isFetching && "animate-spin")} />
          {isFetching ? "Atualizando..." : "Atualizar dados"}
        </button>
      </div>

      {/* Filters Area */}
      <section className="rounded-2xl bg-white p-5 shadow-sm border border-neutral-100">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-brand-black">Período de Análise</h2>
              <p className="text-xs font-medium text-neutral-400">
                {new Date(data.periodo.dataInicio).toLocaleDateString("pt-BR")} até{" "}
                {new Date(data.periodo.dataFim).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full sm:w-56">
              <select
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-black outline-none transition-colors focus:border-brand-black focus:ring-1 focus:ring-brand-black"
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
            {preset === "PERSONALIZADO" && (
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(event) => setDataInicio(event.target.value)}
                  className="w-full sm:w-40 rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-brand-black"
                />
                <span className="text-neutral-400 font-medium text-sm">até</span>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(event) => setDataFim(event.target.value)}
                  className="w-full sm:w-40 rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-brand-black"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main KPI Cards */}
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const tendAl = card.comparacao?.tendencia === "ALTA";
          const tendBa = card.comparacao?.tendencia === "BAIXA";
          
          return (
            <Link
              key={card.id}
              href={card.href}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-neutral-100 transition-all hover:-translate-y-1 hover:shadow-md hover:border-brand-black"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-neutral-500">{card.titulo}</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-50 text-neutral-400 transition-colors group-hover:bg-brand-black group-hover:text-white">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-4 font-display text-3xl font-bold text-brand-black">
                {formatCardValue(card)}
              </p>
              
              {card.comparacao && (
                <div className="mt-4 flex items-center gap-2">
                  <span className={cn(
                    "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold",
                    tendAl ? "bg-emerald-50 text-emerald-700" :
                    tendBa ? "bg-red-50 text-red-700" : "bg-neutral-100 text-neutral-600"
                  )}>
                    {tendAl && <TrendingUp className="h-3 w-3" />}
                    {tendBa && <TrendingDown className="h-3 w-3" />}
                    {card.comparacao.variacaoPercentual > 0 ? "+" : ""}
                    {card.comparacao.variacaoPercentual.toFixed(1)}%
                  </span>
                  <span className="text-xs font-medium text-neutral-400">vs período anterior</span>
                </div>
              )}
            </Link>
          );
        })}
      </section>

      {/* Charts Section */}
      {data.charts && (
        <section className="rounded-2xl bg-white p-5 shadow-sm border border-neutral-100">
          <div className="mb-6 flex items-center gap-2">
            <LineChart className="h-5 w-5 text-brand-black" />
            <h2 className="text-lg font-bold text-brand-black">Desempenho Geral</h2>
          </div>
          <DashboardChartsPanel charts={data.charts} />
        </section>
      )}

      {/* Grid: Recent Orders and Quick Summaries */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Recent Orders List */}
        <section className="xl:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-brand-black" />
              <h2 className="text-lg font-bold text-brand-black">Pedidos Recentes</h2>
            </div>
            <Link href="/admin/pedidos" className="group flex items-center gap-1 text-sm font-semibold text-neutral-500 hover:text-brand-black">
              Ver todos <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-neutral-100">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-neutral-100 bg-neutral-50/80">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Número</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Cliente</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Data</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Status</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {data.recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Package className="h-8 w-8 text-neutral-300" />
                          <p>Nenhum pedido recente no período selecionado.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.recentOrders.slice(0, 7).map((order) => (
                      <tr key={order.id} className="transition-colors hover:bg-neutral-50/80 group">
                        <td className="px-6 py-4">
                          <Link href={order.href} className="font-semibold text-brand-black underline-offset-4 group-hover:underline">
                            {order.numeroFormatado}
                          </Link>
                        </td>
                        <td className="px-6 py-4 font-medium text-neutral-700">
                          {order.clienteNome}
                        </td>
                        <td className="px-6 py-4 text-neutral-500 text-xs font-medium">
                          {formatDateTime(order.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-700">
                            {order.statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-brand-black">
                          {formatCurrency(order.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Quick Summaries Column */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-1">
            <PieChart className="h-5 w-5 text-brand-black" />
            <h2 className="text-lg font-bold text-brand-black">Resumo Operacional</h2>
          </div>
          
          <div className="space-y-4">
            {data.financial && (
              <div className="space-y-4">
                <SummaryCard
                  label="Receitas do período"
                  value={formatCurrency(data.financial.receitasPeriodo)}
                  icon={TrendingUp}
                  variant="success"
                />
                <SummaryCard
                  label="Despesas do período"
                  value={formatCurrency(data.financial.despesasPeriodo)}
                  icon={TrendingDown}
                  variant="alert"
                />
                <SummaryCard 
                  label="Saldo do Período" 
                  value={formatCurrency(data.financial.saldo)} 
                  icon={CreditCard}
                />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              {data.deliveries && (
                <div className="rounded-2xl bg-brand-black p-5 text-white shadow-md relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 opacity-10 transition-transform group-hover:scale-110">
                    <Truck className="h-24 w-24" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <Truck className="h-5 w-5 text-white/80" />
                    </div>
                    <p className="font-display text-3xl font-bold">
                      {data.deliveries.emPreparacao + data.deliveries.prontas + data.deliveries.saiuParaEntrega}
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mt-2 leading-tight">
                      Entregas<br/>Pendentes
                    </p>
                  </div>
                </div>
              )}
              {data.stock && (
                <div className="rounded-2xl bg-amber-500 p-5 text-white shadow-md relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 opacity-20 transition-transform group-hover:scale-110">
                    <AlertTriangle className="h-24 w-24" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <AlertTriangle className="h-5 w-5 text-white/90" />
                    </div>
                    <p className="font-display text-3xl font-bold">
                      {(data.stock.totais?.semEstoque ?? data.stock.semEstoque.length) +
                       (data.stock.totais?.estoqueBaixo ?? data.stock.estoqueBaixo.length)}
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/90 mt-2 leading-tight">
                      Alertas de<br/>Estoque
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
