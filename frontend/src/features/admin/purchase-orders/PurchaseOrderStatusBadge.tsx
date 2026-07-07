interface PurchaseOrderStatusBadgeProps {
  label: string;
  color: string;
  className?: string;
}

export function PurchaseOrderStatusBadge({
  label,
  color,
  className,
}: PurchaseOrderStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-white ${className ?? ""}`}
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}
