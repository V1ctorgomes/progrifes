"use client";

import type { InventoryEntryDetail } from "@/types/inventory-entry";
import { formatEntryDate } from "@/types/inventory-entry";

interface StockEntryPrintViewProps {
  entry: InventoryEntryDetail;
}

export function StockEntryPrintView({ entry }: StockEntryPrintViewProps) {
  return (
    <div id="stock-entry-print-area" className="hidden print:block">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #stock-entry-print-area,
          #stock-entry-print-area * {
            visibility: visible;
          }
          #stock-entry-print-area {
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
          <p className="text-sm">Comprovante de Entrada de Estoque</p>
          <p className="text-lg font-bold">{entry.numeroFormatado}</p>
          <p className="text-xs text-neutral-600">{formatEntryDate(entry.dataEntrada)}</p>
        </header>

        <section>
          <h2 className="mb-1 text-sm font-bold uppercase">Produto</h2>
          <p>{entry.produtoNome}</p>
          <p className="text-xs text-neutral-600">{entry.categoriaNome}</p>
        </section>

        <section>
          <h2 className="mb-1 text-sm font-bold uppercase">Variante</h2>
          <p>{entry.varianteLabel}</p>
          <p className="font-mono text-xs">SKU: {entry.sku}</p>
        </section>

        <section className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-bold uppercase">Quantidade</p>
            <p className="text-lg">{entry.quantidade}</p>
          </div>
          <div>
            <p className="font-bold uppercase">Tipo</p>
            <p>{entry.tipoLabel}</p>
          </div>
          <div>
            <p className="font-bold uppercase">Responsável</p>
            <p>{entry.responsavelNome ?? "—"}</p>
          </div>
          {entry.valorUnitario != null && (
            <div>
              <p className="font-bold uppercase">Valor unitário</p>
              <p>
                {entry.valorUnitario.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            </div>
          )}
        </section>

        {(entry.documento || entry.notaFiscal || entry.fornecedor) && (
          <section>
            <h2 className="mb-1 text-sm font-bold uppercase">Documentação</h2>
            {entry.documento && <p>Documento: {entry.documento}</p>}
            {entry.notaFiscal && <p>NF: {entry.notaFiscal}</p>}
            {entry.fornecedor && <p>Fornecedor: {entry.fornecedor}</p>}
          </section>
        )}

        {entry.observacoes && (
          <section>
            <h2 className="mb-1 text-sm font-bold uppercase">Observações</h2>
            <p className="whitespace-pre-wrap">{entry.observacoes}</p>
          </section>
        )}

        {entry.movimento && (
          <section className="border-t border-neutral-300 pt-3 text-xs text-neutral-600">
            <p>
              Saldo anterior: {entry.movimento.saldoAnterior ?? "—"} → Saldo atual:{" "}
              {entry.movimento.saldoAtual ?? "—"}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
