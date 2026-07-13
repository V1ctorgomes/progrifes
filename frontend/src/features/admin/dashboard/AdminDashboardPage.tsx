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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-brand-black">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-neutral-200 bg-brand-white p-4">
      <p className="text-xs uppercase tracking-wide text-brand-gray">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-brand-black">{value}</p>
    </div>
  );
}

export function AdminDashboardPage() {
  const [preset, setPreset] = useState<AdminDashboardPeriodPreset>("HOJE");
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

  const enabled =
    preset !== "PERSONALIZADO" || Boolean(dataInicio && dataFim);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin", "dashboard", queryParams],
    queryFn: () => adminDashboardApi.get(queryParams),
    enabled,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-brand-gray">
            Visão consolidada da operação: vendas, estoque, financeiro e entregas.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Atualizando..." : "Atualizar"}
        </Button>
      </div>

      <div className="grid gap-3 border border-neutral-200 bg-brand-white p-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {data?.shortcuts && data.shortcuts.length > 0 ? (
        <Section title="Atalhos">
          <div className="flex flex-wrap gap-2">
            {data.shortcuts.map((shortcut) => (
              <Link key={shortcut.id} href={shortcut.href}>
                <Button type="button" variant="outline" size="sm">
                  {shortcut.label}
                </Button>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-brand-gray">Carregando dashboard...</p>
      ) : !data ? (
        <p className="text-sm text-brand-gray">Não foi possível carregar o dashboard.</p>
      ) : (
        <>
          <Section title="Indicadores">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {data.cards.map((card) => (
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
          </Section>

          {data.charts ? (
            <Section title="Gráficos">
              <DashboardChartsPanel charts={data.charts} />
            </Section>
          ) : null}

          {data.recentOrders.length > 0 || data.customers ? (
            <div className="grid gap-6 xl:grid-cols-2">
              <Section
                title="Pedidos recentes"
                action={
                  <Link href="/admin/pedidos" className="text-sm underline">
                    Ver todos
                  </Link>
                }
              >
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
                        data.recentOrders.map((order) => (
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
              </Section>

              {data.customers ? (
                <Section
                  title="Clientes"
                  action={
                    <Link href="/admin/clientes" className="text-sm underline">
                      Ver clientes
                    </Link>
                  }
                >
                  <div className="grid gap-3 sm:grid-cols-3">
                    <MiniStat label="Novos clientes" value={data.customers.novosClientes} />
                    <MiniStat label="Clientes ativos" value={data.customers.clientesAtivos} />
                    <MiniStat
                      label="Sem compras recentes"
                      value={data.customers.semComprasRecentes}
                    />
                  </div>
                </Section>
              ) : null}
            </div>
          ) : null}

          {data.stock ? (
            <Section
              title="Estoque"
              action={
                <Link href="/admin/estoque" className="text-sm underline">
                  Abrir estoque
                </Link>
              }
            >
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="border border-neutral-200 bg-brand-white p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-gray">
                    Sem estoque
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    {data.stock.semEstoque.length === 0 ? (
                      <li className="text-brand-gray">Nenhum item.</li>
                    ) : (
                      data.stock.semEstoque.map((item) => (
                        <li key={item.id}>
                          <Link href={item.href} className="hover:underline">
                            {item.produtoNome} · {item.sku}
                          </Link>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <div className="border border-neutral-200 bg-brand-white p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-gray">
                    Estoque baixo
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    {data.stock.estoqueBaixo.length === 0 ? (
                      <li className="text-brand-gray">Nenhum item.</li>
                    ) : (
                      data.stock.estoqueBaixo.map((item) => (
                        <li key={item.id}>
                          <Link href={item.href} className="hover:underline">
                            {item.produtoNome} · {item.sku} ({item.quantidadeDisponivel})
                          </Link>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <div className="border border-neutral-200 bg-brand-white p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-gray">
                    Últimas movimentações
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    {data.stock.movimentacoes.length === 0 ? (
                      <li className="text-brand-gray">Nenhuma movimentação.</li>
                    ) : (
                      data.stock.movimentacoes.map((item) => (
                        <li key={item.id}>
                          <Link href={item.href} className="hover:underline">
                            {item.tipo} · {item.produtoNome} ({item.quantidade})
                          </Link>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </Section>
          ) : null}

          {(data.financial || data.deliveries) && (
            <div className="grid gap-6 xl:grid-cols-2">
              {data.financial ? (
                <Section
                  title="Financeiro"
                  action={
                    <Link href="/admin/financeiro" className="text-sm underline">
                      Ver financeiro
                    </Link>
                  }
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <MiniStat
                      label="Receitas do período"
                      value={formatCurrency(data.financial.receitasPeriodo)}
                    />
                    <MiniStat
                      label="Despesas do período"
                      value={formatCurrency(data.financial.despesasPeriodo)}
                    />
                    <MiniStat label="Saldo" value={formatCurrency(data.financial.saldo)} />
                    <MiniStat
                      label="Contas vencidas"
                      value={`${data.financial.contasVencidas.receber.quantidade + data.financial.contasVencidas.pagar.quantidade} (${formatCurrency(data.financial.contasVencidas.receber.valor + data.financial.contasVencidas.pagar.valor)})`}
                    />
                    <MiniStat
                      label="A vencer (7 dias)"
                      value={`${data.financial.contasAVencer.receber.quantidade + data.financial.contasAVencer.pagar.quantidade} (${formatCurrency(data.financial.contasAVencer.receber.valor + data.financial.contasAVencer.pagar.valor)})`}
                    />
                  </div>
                </Section>
              ) : null}

              {data.deliveries ? (
                <Section
                  title="Entregas"
                  action={
                    <Link href="/admin/entregas" className="text-sm underline">
                      Ver entregas
                    </Link>
                  }
                >
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <MiniStat label="Em preparação" value={data.deliveries.emPreparacao} />
                    <MiniStat label="Prontas" value={data.deliveries.prontas} />
                    <MiniStat label="Saiu para entrega" value={data.deliveries.saiuParaEntrega} />
                    <MiniStat label="Concluídas" value={data.deliveries.concluidas} />
                    <MiniStat label="Canceladas" value={data.deliveries.canceladas} />
                  </div>
                </Section>
              ) : null}
            </div>
          )}

          <Section title="Atividades recentes">
            <div className="overflow-x-auto border border-neutral-200 bg-brand-white">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-brand-gray">
                  <tr>
                    <th className="px-4 py-3">Data/Hora</th>
                    <th className="px-4 py-3">Usuário</th>
                    <th className="px-4 py-3">Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  {data.activities.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-brand-gray">
                        Nenhuma atividade recente.
                      </td>
                    </tr>
                  ) : (
                    data.activities.map((activity) => (
                      <tr key={activity.id} className="border-b border-neutral-100">
                        <td className="px-4 py-3 text-brand-gray">
                          {formatDateTime(activity.createdAt)}
                        </td>
                        <td className="px-4 py-3">{activity.usuarioNome ?? "—"}</td>
                        <td className="px-4 py-3">{activity.descricao}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
