"use client";

import type { InventoryOutputDetail } from "@/types/inventory-output";
import { formatMovementDate } from "@/types/inventory-output";

interface StockOutputPrintViewProps {
  output: InventoryOutputDetail;
}

export function StockOutputPrintView({ output }: StockOutputPrintViewProps) {
  return (
    <div id="stock-output-print-area" className="hidden print:block">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #stock-output-print-area,
          #stock-output-print-area * {
            visibility: visible;
          }
          #stock-output-print-area {
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
          <p className="text-sm">Comprovante de Saída de Estoque</p>
          {output.numeroFormatado && (
            <p className="text-lg font-bold">{output.numeroFormatado}</p>
          )}
          <p className="text-xs text-neutral-600">{formatMovementDate(output.createdAt)}</p>
        </header>

        <section>
          <h2 className="mb-1 text-sm font-bold uppercase">Produto</h2>
          <p>{output.produtoNome}</p>
          <p className="text-xs text-neutral-600">{output.categoriaNome}</p>
        </section>

        <section>
          <h2 className="mb-1 text-sm font-bold uppercase">Variante</h2>
          <p>{output.varianteLabel}</p>
          <p className="font-mono text-xs">SKU: {output.sku}</p>
        </section>

        <section className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-bold uppercase">Quantidade</p>
            <p className="text-lg">{output.quantidade}</p>
          </div>
          <div>
            <p className="font-bold uppercase">Tipo</p>
            <p>{output.tipoSaidaLabel}</p>
          </div>
          <div>
            <p className="font-bold uppercase">Responsável</p>
            <p>{output.responsavelNome ?? "—"}</p>
          </div>
          <div>
            <p className="font-bold uppercase">Motivo</p>
            <p>{output.motivo ?? "—"}</p>
          </div>
        </section>

        {output.documento && (
          <section>
            <h2 className="mb-1 text-sm font-bold uppercase">Documento</h2>
            <p>{output.documento}</p>
          </section>
        )}

        {output.observacoes && (
          <section>
            <h2 className="mb-1 text-sm font-bold uppercase">Observações</h2>
            <p className="whitespace-pre-wrap">{output.observacoes}</p>
          </section>
        )}
      </div>
    </div>
  );
}
