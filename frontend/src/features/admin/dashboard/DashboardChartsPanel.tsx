"use client";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import type { DashboardCharts } from "@/types/admin-dashboard";
import { formatCurrency } from "@/utils/cn";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

const CHART_COLORS = ["#111111", "#6b7280", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6"];

function formatDayLabel(value: string) {
  const [, month, day] = value.split("-");
  return `${day}/${month}`;
}

export function DashboardChartsPanel({ charts }: { charts: DashboardCharts }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="border border-neutral-200 bg-brand-white p-4">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-black">
          Faturamento
        </h3>
        <div className="h-64">
          <Line
            data={{
              labels: charts.faturamento.map((item) => formatDayLabel(item.periodo)),
              datasets: [
                {
                  label: "Faturamento",
                  data: charts.faturamento.map((item) => item.valor),
                  borderColor: "#111111",
                  backgroundColor: "rgba(17,17,17,0.08)",
                  fill: true,
                  tension: 0.3,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (ctx) => formatCurrency(Number(ctx.raw) || 0),
                  },
                },
              },
              scales: {
                y: {
                  ticks: {
                    callback: (value) => formatCurrency(Number(value) || 0),
                  },
                },
              },
            }}
          />
        </div>
      </div>

      <div className="border border-neutral-200 bg-brand-white p-4">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-black">
          Pedidos
        </h3>
        <div className="h-64">
          <Bar
            data={{
              labels: charts.pedidos.map((item) => formatDayLabel(item.periodo)),
              datasets: [
                {
                  label: "Pedidos",
                  data: charts.pedidos.map((item) => item.quantidade),
                  backgroundColor: "#111111",
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
            }}
          />
        </div>
      </div>

      <div className="border border-neutral-200 bg-brand-white p-4">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-black">
          Formas de Pagamento
        </h3>
        <div className="mx-auto h-64 max-w-xs">
          {charts.formasPagamento.length === 0 ? (
            <p className="text-sm text-brand-gray">Sem dados no período.</p>
          ) : (
            <Doughnut
              data={{
                labels: charts.formasPagamento.map((item) => item.label),
                datasets: [
                  {
                    data: charts.formasPagamento.map((item) => item.quantidade),
                    backgroundColor: CHART_COLORS,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } },
              }}
            />
          )}
        </div>
      </div>

      <div className="border border-neutral-200 bg-brand-white p-4">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-black">
          Status dos Pedidos
        </h3>
        <div className="mx-auto h-64 max-w-xs">
          {charts.statusPedidos.length === 0 ? (
            <p className="text-sm text-brand-gray">Sem dados no período.</p>
          ) : (
            <Doughnut
              data={{
                labels: charts.statusPedidos.map((item) => item.label),
                datasets: [
                  {
                    data: charts.statusPedidos.map((item) => item.quantidade),
                    backgroundColor: CHART_COLORS,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } },
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
