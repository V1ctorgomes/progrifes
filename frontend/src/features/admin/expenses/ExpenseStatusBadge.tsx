import { cn } from "@/utils/cn";
import type { ExpenseStatus } from "@/types/expenses";

const STATUS_STYLES: Record<ExpenseStatus, string> = {
  PENDENTE: "bg-amber-100 text-amber-900",
  PAGO: "bg-emerald-100 text-emerald-900",
  PARCIALMENTE_PAGO: "bg-sky-100 text-sky-900",
  VENCIDO: "bg-red-100 text-red-900",
  CANCELADO: "bg-neutral-200 text-neutral-700",
  ESTORNADO: "bg-purple-100 text-purple-900",
};

const STATUS_LABELS: Record<ExpenseStatus, string> = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
  PARCIALMENTE_PAGO: "Parcial",
  VENCIDO: "Vencido",
  CANCELADO: "Cancelado",
  ESTORNADO: "Estornado",
};

export function ExpenseStatusBadge({ status }: { status: ExpenseStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
