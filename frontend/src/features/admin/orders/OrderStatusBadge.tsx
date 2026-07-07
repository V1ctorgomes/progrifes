import type { OrderStatus } from "@/types/order";

interface OrderStatusBadgeProps {
  label: string;
  color: string;
  className?: string;
}

export function OrderStatusBadge({ label, color, className }: OrderStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-white ${className ?? ""}`}
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}

export const ORDER_STATUS_OPTIONS: Array<{ value: OrderStatus | ""; label: string }> = [
  { value: "", label: "Todos os status" },
  { value: "AGUARDANDO_CONFIRMACAO", label: "Aguardando Confirmação" },
  { value: "CONFIRMADO", label: "Confirmado" },
  { value: "SEPARANDO", label: "Separando" },
  { value: "PRONTO_PARA_ENTREGA", label: "Pronto para Entrega" },
  { value: "SAIU_PARA_ENTREGA", label: "Saiu para Entrega" },
  { value: "ENTREGUE", label: "Entregue" },
  { value: "CANCELADO", label: "Cancelado" },
];

export const ORDER_SORT_OPTIONS = [
  { value: "recent", label: "Mais recentes" },
  { value: "oldest", label: "Mais antigos" },
  { value: "total_desc", label: "Maior valor" },
  { value: "total_asc", label: "Menor valor" },
  { value: "status", label: "Status" },
] as const;
