"use client";

import { useQuery } from "@tanstack/react-query";
import { ordersAdminApi } from "@/lib/admin-api";
import { formatCurrency } from "@/utils/cn";
import { PAYMENT_METHOD_LABELS } from "@/types/order";

export function OrdersAdminPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: ordersAdminApi.list,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
          Pedidos
        </h1>
        <p className="text-sm text-brand-gray">Pedidos realizados pela loja virtual</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-brand-gray">Carregando pedidos...</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-brand-gray">Nenhum pedido registrado ainda.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-neutral-200 text-sm">
            <thead className="bg-brand-light">
              <tr>
                <th className="px-4 py-3 text-left">Pedido</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Telefone</th>
                <th className="px-4 py-3 text-left">Pagamento</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Data</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-neutral-200">
                  <td className="px-4 py-3 font-mono font-medium">{order.numeroFormatado}</td>
                  <td className="px-4 py-3">{order.clienteNome}</td>
                  <td className="px-4 py-3">{order.clienteTelefone}</td>
                  <td className="px-4 py-3">
                    {PAYMENT_METHOD_LABELS[order.formaPagamento]}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(order.total)}</td>
                  <td className="px-4 py-3">{order.statusLabel}</td>
                  <td className="px-4 py-3">
                    {new Date(order.createdAt).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
