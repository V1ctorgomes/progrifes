"use client";

import type { GoodsReceipt } from "@/types/goods-receipt";
import { formatCnpj } from "@/types/supplier";
import { formatCurrency } from "@/utils/cn";

interface GoodsReceiptPrintViewProps {
  receipt: GoodsReceipt;
}

export function GoodsReceiptPrintView({ receipt }: GoodsReceiptPrintViewProps) {
  return (
    <div id="goods-receipt-print-area" className="hidden print:block">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #goods-receipt-print-area,
          #goods-receipt-print-area * {
            visibility: visible;
          }
          #goods-receipt-print-area {
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
          <p className="text-sm font-semibold">Comprovante de Recebimento {receipt.numeroFormatado}</p>
          <p className="text-xs text-neutral-600">
            Ordem {receipt.ordemNumeroFormatado} ·{" "}
            {new Date(receipt.createdAt).toLocaleString("pt-BR")}
          </p>
        </header>

        <section>
          <h2 className="mb-1 text-sm font-bold uppercase">Fornecedor</h2>
          <p>{receipt.fornecedor.razaoSocial}</p>
          <p>{receipt.fornecedor.nomeFantasia}</p>
          <p>CNPJ: {formatCnpj(receipt.fornecedor.cnpj)}</p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold uppercase">Itens recebidos</h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-black">
                <th className="py-1 text-left">Produto</th>
                <th className="py-1 text-left">SKU</th>
                <th className="py-1 text-center">Pedida</th>
                <th className="py-1 text-center">Recebida</th>
              </tr>
            </thead>
            <tbody>
              {receipt.itens.map((item) => (
                <tr key={item.id} className="border-b border-neutral-300">
                  <td className="py-1 pr-2">{item.produtoNome}</td>
                  <td className="py-1">{item.sku}</td>
                  <td className="py-1 text-center">{item.quantidadePedida}</td>
                  <td className="py-1 text-center">{item.quantidadeRecebida}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="text-sm">
          <div className="flex justify-between font-semibold">
            <span>Valor do recebimento</span>
            <span>{formatCurrency(receipt.valorTotal)}</span>
          </div>
          {receipt.contaPagar && (
            <p className="mt-2 text-xs">
              Conta a pagar gerada: {receipt.contaPagar.numeroFormatado} —{" "}
              {formatCurrency(receipt.contaPagar.saldo)}
            </p>
          )}
        </section>

        {receipt.observacoes && (
          <section>
            <h2 className="mb-1 text-sm font-bold uppercase">Observações</h2>
            <p className="whitespace-pre-wrap">{receipt.observacoes}</p>
          </section>
        )}

        <section className="border-t border-black pt-3 text-sm">
          <p>Responsável: {receipt.responsavel?.nome ?? "—"}</p>
          <p>Data: {new Date(receipt.createdAt).toLocaleString("pt-BR")}</p>
        </section>
      </div>
    </div>
  );
}

export function printGoodsReceipt() {
  window.print();
}
