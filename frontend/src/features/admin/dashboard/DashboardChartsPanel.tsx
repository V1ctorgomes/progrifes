"use client";

import {
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
  Legend,
  Filler,
);

ChartJS.defaults.font.family = "inherit";
ChartJS.defaults.color = "#737373";

function formatDayLabel(value: string) {
  const [, month, day] = value.split("-");
  return `${day}/${month}`;
}

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#0a0a0a",
      titleColor: "#ffffff",
      bodyColor: "#ffffff",
      padding: 12,
      cornerRadius: 8,
      displayColors: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      border: {
        display: false,
      }
    },
    y: {
      border: {
        display: false,
      },
      grid: {
        color: "#f5f5f5",
      }
    }
  }
};

export function DashboardChartsPanel({ charts }: { charts: DashboardCharts }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl bg-neutral-50/50 p-5 border border-neutral-100 transition-colors hover:border-neutral-200">
        <h3 className="mb-6 text-sm font-bold text-brand-black">
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
                  borderColor: "#0a0a0a",
                  backgroundColor: "rgba(10, 10, 10, 0.05)",
                  fill: true,
                  tension: 0.4,
                  pointBackgroundColor: "#ffffff",
                  pointBorderColor: "#0a0a0a",
                  pointBorderWidth: 2,
                  pointRadius: 3,
                  pointHoverRadius: 6,
                },
              ],
            }}
            options={{
              ...commonOptions,
              plugins: {
                ...commonOptions.plugins,
                tooltip: {
                  ...commonOptions.plugins.tooltip,
                  callbacks: {
                    label: (ctx) => formatCurrency(Number(ctx.raw) || 0),
                  },
                },
              },
              scales: {
                ...commonOptions.scales,
                y: {
                  ...commonOptions.scales.y,
                  ticks: {
                    callback: (value) => formatCurrency(Number(value) || 0),
                  },
                },
              },
            }}
          />
        </div>
      </div>

      <div className="rounded-xl bg-neutral-50/50 p-5 border border-neutral-100 transition-colors hover:border-neutral-200">
        <h3 className="mb-6 text-sm font-bold text-brand-black">
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
                  backgroundColor: "#0a0a0a",
                  borderRadius: 4,
                  barPercentage: 0.6,
                  hoverBackgroundColor: "#262626",
                },
              ],
            }}
            options={{
              ...commonOptions,
              scales: {
                ...commonOptions.scales,
                y: {
                  ...commonOptions.scales.y,
                  beginAtZero: true, 
                  ticks: { precision: 0 }
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
