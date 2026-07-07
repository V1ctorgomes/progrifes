"use client";

import type { InventoryAuditDetail } from "@/types/inventory-audit";
import { formatAuditDate } from "@/types/inventory-audit";

interface StockAuditPrintViewProps {
  audit: InventoryAuditDetail;
}

export function StockAuditPrintView({ audit }: StockAuditPrintViewProps) {
  return (
    <div id="stock-audit-print-area" className="hidden print:block">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #stock-audit-print-area,
          #stock-audit-print-area * {
            visibility: visible;
          }
          #stock-audit-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 8mm;
            font-family: Arial, sans-serif;
            font-size: 11px;
            color: #000;
          }
        }
      `}</style>

      <div className="space-y-4">
        <header className="border-b border-black pb-3 text-center">
          <h1 className="text-lg font-bold uppercase">Grifres</h1>
          <p className="text-sm">Relatório de Inventário de Estoque</p>
          <p className="text-lg font-bold">{audit.numeroFormatado}</p>
          <p>{audit.nome}</p>
          <p className="text-xs text-neutral-600">{formatAuditDate(audit.dataInventario)}</p>
        </header>

        <section className="grid grid-cols-2 gap-2 text-sm">
          <p>
            <strong>Tipo:</strong> {audit.tipoLabel}
          </p>
          <p>
            <strong>Responsável:</strong> {audit.responsavelNome}
          </p>
          <p>
            <strong>Itens conferidos:</strong> {audit.resumo.itensConferidos}
          </p>
          <p>
            <strong>Divergências:</strong> {audit.resumo.divergencias}
          </p>
          <p>
            <strong>Total ajustado:</strong> {audit.resumo.totalAjustado}
          </p>
        </section>

        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-black">
              <th className="py-1 text-left">Produto</th>
              <th className="py-1 text-left">Variante</th>
              <th className="py-1 text-left">SKU</th>
              <th className="py-1 text-right">Sistema</th>
              <th className="py-1 text-right">Físico</th>
              <th className="py-1 text-right">Diferença</th>
              <th className="py-1 text-left">Ajuste</th>
            </tr>
          </thead>
          <tbody>
            {audit.itens.map((item) => (
              <tr key={item.id} className="border-b border-neutral-300">
                <td className="py-1">{item.produtoNome}</td>
                <td className="py-1">{item.varianteLabel}</td>
                <td className="py-1 font-mono">{item.sku}</td>
                <td className="py-1 text-right">{item.quantidadeSistema}</td>
                <td className="py-1 text-right">{item.quantidadeFisica ?? "—"}</td>
                <td className="py-1 text-right">{item.diferenca ?? "—"}</td>
                <td className="py-1">{item.tipoAjusteLabel ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
