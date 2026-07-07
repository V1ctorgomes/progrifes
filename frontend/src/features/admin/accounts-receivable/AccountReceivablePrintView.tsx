"use client";

import type { AccountReceivableDetail } from "@/types/accounts-receivable";
import { formatCurrency } from "@/utils/cn";

interface AccountReceivablePrintViewProps {
  account: AccountReceivableDetail;
}

export function AccountReceivablePrintView({ account }: AccountReceivablePrintViewProps) {
  return (
    <div id="account-receivable-print-area" className="hidden print:block">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #account-receivable-print-area,
          #account-receivable-print-area * {
            visibility: visible;
          }
          #account-receivable-print-area {
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
          <p className="text-sm font-semibold">
            Comprovante — Conta a Receber {account.numeroFormatado}
          </p>
          <p className="text-xs text-neutral-600">
            Emitido em {new Date().toLocaleString("pt-BR")}
          </p>
        </header>

        <section>
          <h2 className="mb-1 text-sm font-bold uppercase">Cliente</h2>
          <p>{account.customerNome}</p>
        </section>

        <section className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p>
              <strong>Valor original:</strong> {formatCurrency(account.valorOriginal)}
            </p>
            <p>
              <strong>Recebido:</strong> {formatCurrency(account.valorRecebido)}
            </p>
            <p>
              <strong>Saldo:</strong> {formatCurrency(account.saldo)}
            </p>
          </div>
          <div>
            <p>
              <strong>Status:</strong> {account.status}
            </p>
            <p>
              <strong>Vencimento:</strong>{" "}
              {new Date(account.vencimento).toLocaleDateString("pt-BR")}
            </p>
            <p>
              <strong>Categoria:</strong> {account.categoryNome}
            </p>
          </div>
        </section>

        {account.recebimentos.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase">Recebimentos</h2>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-black">
                  <th className="py-1 text-left">Data</th>
                  <th className="py-1 text-left">Forma</th>
                  <th className="py-1 text-right">Valor</th>
                  <th className="py-1 text-center">Estornado</th>
                </tr>
              </thead>
              <tbody>
                {account.recebimentos.map((receipt) => (
                  <tr key={receipt.id} className="border-b border-neutral-300">
                    <td className="py-1">
                      {new Date(receipt.recebidoEm).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-1">{receipt.paymentMethodNome}</td>
                    <td className="py-1 text-right">{formatCurrency(receipt.valor)}</td>
                    <td className="py-1 text-center">{receipt.estornado ? "Sim" : "Não"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </div>
  );
}

export function printAccountReceivable() {
  window.print();
}
