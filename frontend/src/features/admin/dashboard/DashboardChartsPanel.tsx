"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import type { DashboardCharts } from "@/types/admin-dashboard";
import { formatCurrency } from "@/utils/cn";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Filler,
);

function formatDayLabel(value: string) {
  const [, month, day] = value.split("-");
  return `${day}/${month}`;
}

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
};

export function DashboardChartsPanel({ charts }: { charts: DashboardCharts }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="border border-brand-black bg-brand-white p-5">
        <div className="mb-5 flex items-baseline justify-between gap-2">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.22em] text-brand-gray">
            Faturamento
          </h3>
          <span className="h-px flex-1 bg-neutral-200" />
        </div>
        <div className="h-56">
          <Line
            data={{
              labels: charts.faturamento.map((item) => formatDayLabel(item.periodo)),
              datasets: [
                {
                  label: "Faturamento",
                  data: charts.faturamento.map((item) => item.valor),
                  borderColor: "#0a0a0a",
                  backgroundColor: "rgba(200,169,110,0.25)",
                  borderWidth: 2,
                  fill: true,
                  tension: 0.35,
                  pointRadius: 0,
                  pointHoverRadius: 4,
                },
              ],
            }}
            options={{
              ...chartDefaults,
              plugins: {
                ...chartDefaults.plugins,
                tooltip: {
                  callbacks: {
                    label: (ctx) => formatCurrency(Number(ctx.raw) || 0),
                  },
                },
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { color: "#6b6b6b", maxRotation: 0, autoSkipPadding: 12 },
                  border: { display: false },
                },
                y: {
                  grid: { color: "rgba(0,0,0,0.06)" },
                  ticks: {
                    color: "#6b6b6b",
                    callback: (value) => formatCurrency(Number(value) || 0),
                  },
                  border: { display: false },
                },
              },
            }}
          />
        </div>
      </div>

      <div className="border border-brand-black bg-brand-white p-5">
        <div className="mb-5 flex items-baseline justify-between gap-2">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.22em] text-brand-gray">
            Pedidos
          </h3>
          <span className="h-px flex-1 bg-neutral-200" />
        </div>
        <div className="h-56">
          <Bar
            data={{
              labels: charts.pedidos.map((item) => formatDayLabel(item.periodo)),
              datasets: [
                {
                  label: "Pedidos",
                  data: charts.pedidos.map((item) => item.quantidade),
                  backgroundColor: "#0a0a0a",
                  hoverBackgroundColor: "#c8a96e",
                  borderSkipped: false,
                },
              ],
            }}
            options={{
              ...chartDefaults,
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { color: "#6b6b6b", maxRotation: 0, autoSkipPadding: 12 },
                  border: { display: false },
                },
                y: {
                  beginAtZero: true,
                  grid: { color: "rgba(0,0,0,0.06)" },
                  ticks: { color: "#6b6b6b", precision: 0 },
                  border: { display: false },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
