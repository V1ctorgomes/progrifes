import { cn } from "@/utils/cn";
import type { ReceivableStatus } from "@/types/accounts-receivable";

const STATUS_STYLES: Record<ReceivableStatus, string> = {
  PENDENTE: "bg-amber-100 text-amber-900",
  RECEBIDO: "bg-emerald-100 text-emerald-900",
  PARCIALMENTE_RECEBIDO: "bg-sky-100 text-sky-900",
  VENCIDO: "bg-red-100 text-red-900",
  CANCELADO: "bg-neutral-200 text-neutral-700",
  ESTORNADO: "bg-purple-100 text-purple-900",
};

const STATUS_LABELS: Record<ReceivableStatus, string> = {
  PENDENTE: "Pendente",
  RECEBIDO: "Recebido",
  PARCIALMENTE_RECEBIDO: "Parcial",
  VENCIDO: "Vencido",
  CANCELADO: "Cancelado",
  ESTORNADO: "Estornado",
};

export function ReceivableStatusBadge({ status }: { status: ReceivableStatus }) {
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
