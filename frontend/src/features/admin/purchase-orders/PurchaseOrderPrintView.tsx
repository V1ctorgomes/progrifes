import type { PurchaseOrder } from "@/types/purchase-order";
import { formatCnpj, formatPhone } from "@/types/supplier";
import { formatCurrency } from "@/utils/cn";

interface PurchaseOrderPrintViewProps {
  order: PurchaseOrder;
}

export function PurchaseOrderPrintView({ order }: PurchaseOrderPrintViewProps) {
  const address = order.fornecedor.endereco;

  return (
    <div id="purchase-order-print-area" className="hidden print:block">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #purchase-order-print-area,
          #purchase-order-print-area * {
            visibility: visible;
          }
          #purchase-order-print-area {
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
          <p className="text-sm font-semibold">Ordem de Compra {order.numeroFormatado}</p>
          <p className="text-xs text-neutral-600">
            Data: {new Date(order.data).toLocaleDateString("pt-BR")} · Previsão:{" "}
            {new Date(order.previsaoEntrega).toLocaleDateString("pt-BR")}
          </p>
        </header>

        <section>
          <h2 className="mb-1 text-sm font-bold uppercase">Fornecedor</h2>
          <p className="font-medium">{order.fornecedor.razaoSocial}</p>
          <p>{order.fornecedor.nomeFantasia}</p>
          <p>CNPJ: {formatCnpj(order.fornecedor.cnpj)}</p>
          <p>{formatPhone(order.fornecedor.telefone)}</p>
          {order.fornecedor.email && <p>{order.fornecedor.email}</p>}
          {address && (
            <p className="mt-1">
              {address.rua}, {address.numero}
              {address.complemento ? ` — ${address.complemento}` : ""} — {address.bairro} —{" "}
              {address.cidade}/{address.estado} — CEP {address.cep}
            </p>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold uppercase">Produtos</h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-black">
                <th className="py-1 text-left">Produto</th>
                <th className="py-1 text-left">SKU</th>
                <th className="py-1 text-center">Qtd</th>
                <th className="py-1 text-right">Unit.</th>
                <th className="py-1 text-right">Desc.</th>
                <th className="py-1 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.itens.map((item) => (
                <tr key={item.id} className="border-b border-neutral-300">
                  <td className="py-1 pr-2">{item.produtoNome}</td>
                  <td className="py-1">{item.sku}</td>
                  <td className="py-1 text-center">{item.quantidade}</td>
                  <td className="py-1 text-right">{formatCurrency(item.valorUnitario)}</td>
                  <td className="py-1 text-right">{formatCurrency(item.desconto)}</td>
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
            <span>Frete</span>
            <span>{formatCurrency(order.frete)}</span>
          </div>
          <div className="flex justify-between">
            <span>Descontos</span>
            <span>{formatCurrency(order.desconto)}</span>
          </div>
          <div className="mt-1 flex justify-between font-bold">
            <span>Total Geral</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </section>

        {order.pedidoFornecedor && (
          <section>
            <h2 className="mb-1 text-sm font-bold uppercase">Pedido do fornecedor</h2>
            <p>{order.pedidoFornecedor}</p>
          </section>
        )}

        {order.observacoes && (
          <section>
            <h2 className="mb-1 text-sm font-bold uppercase">Observações</h2>
            <p className="whitespace-pre-wrap">{order.observacoes}</p>
          </section>
        )}

        <section className="mt-10 border-t border-black pt-8">
          <p className="text-center text-sm">Assinatura do responsável</p>
          <div className="mx-auto mt-12 h-px w-64 bg-black" />
        </section>
      </div>
    </div>
  );
}

export function printPurchaseOrder() {
  window.print();
}
