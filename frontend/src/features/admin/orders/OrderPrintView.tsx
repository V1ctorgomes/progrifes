"use client";

import type { Order } from "@/types/order";
import { PAYMENT_METHOD_LABELS } from "@/types/order";
import { formatCurrency } from "@/utils/cn";

interface OrderPrintViewProps {
  order: Order;
}

function formatVariant(item: Order["itens"][number]) {
  const parts = [item.cor, item.tamanho].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : "—";
}

export function OrderPrintView({ order }: OrderPrintViewProps) {
  return (
    <div id="order-print-area" className="hidden print:block">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #order-print-area,
          #order-print-area * {
            visibility: visible;
          }
          #order-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 8mm;
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #000;
          }
        }
      `}</style>

      <div className="space-y-4">
        <header className="border-b border-black pb-3 text-center">
          <h1 className="text-lg font-bold uppercase">Grifres</h1>
          <p className="text-sm">Pedido {order.numeroFormatado}</p>
          <p className="text-xs text-neutral-600">
            {new Date(order.createdAt).toLocaleString("pt-BR")}
          </p>
        </header>

        <section>
          <h2 className="mb-1 text-sm font-bold uppercase">Cliente</h2>
          <p>{order.clienteNome}</p>
          <p>{order.clienteTelefone}</p>
          {order.clienteEmail && <p>{order.clienteEmail}</p>}
        </section>

        <section>
          <h2 className="mb-1 text-sm font-bold uppercase">Endereço</h2>
          <p>
            {order.rua}, {order.numeroEndereco}
            {order.complemento ? ` — ${order.complemento}` : ""}
          </p>
          <p>
            {order.bairro} — {order.cidade}/{order.estado}
          </p>
          <p>CEP: {order.cep}</p>
          {order.referencia && <p>Ref.: {order.referencia}</p>}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold uppercase">Itens</h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-black">
                <th className="py-1 text-left">Produto</th>
                <th className="py-1 text-left">SKU</th>
                <th className="py-1 text-center">Qtd</th>
                <th className="py-1 text-right">Unit.</th>
                <th className="py-1 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.itens.map((item) => (
                <tr key={item.id} className="border-b border-neutral-300">
                  <td className="py-1 pr-2">
                    <div>{item.produtoNome}</div>
                    <div className="text-neutral-600">{formatVariant(item)}</div>
                  </td>
                  <td className="py-1">{item.sku}</td>
                  <td className="py-1 text-center">{item.quantidade}</td>
                  <td className="py-1 text-right">{formatCurrency(item.precoUnitario)}</td>
                  <td className="py-1 text-right">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="border-t border-black pt-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Entrega</span>
            <span>{formatCurrency(order.taxaEntrega)}</span>
          </div>
          <div className="mt-1 flex justify-between font-bold">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </section>

        <section>
          <h2 className="mb-1 text-sm font-bold uppercase">Pagamento</h2>
          <p>{PAYMENT_METHOD_LABELS[order.formaPagamento]}</p>
          {order.formaPagamento === "DINHEIRO" && order.trocoPara != null && (
            <p>Troco para: {formatCurrency(order.trocoPara)}</p>
          )}
        </section>

        {order.observacoes && (
          <section>
            <h2 className="mb-1 text-sm font-bold uppercase">Observações</h2>
            <p className="whitespace-pre-wrap">{order.observacoes}</p>
          </section>
        )}

        <footer className="border-t border-black pt-2 text-center text-xs text-neutral-600">
          Status: {order.statusLabel}
        </footer>
      </div>
    </div>
  );
}

export function printOrder() {
  window.print();
}
