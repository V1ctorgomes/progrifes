"use client";

import type { AccountPayableDetail } from "@/types/accounts-payable";
import { formatCurrency } from "@/utils/cn";

interface AccountPayablePrintViewProps {
  account: AccountPayableDetail;
}

export function AccountPayablePrintView({ account }: AccountPayablePrintViewProps) {
  return (
    <div id="account-payable-print-area" className="hidden print:block">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #account-payable-print-area,
          #account-payable-print-area * {
            visibility: visible;
          }
          #account-payable-print-area {
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
            Comprovante — Conta a Pagar {account.numeroFormatado}
          </p>
          <p className="text-xs text-neutral-600">
            Emitido em {new Date().toLocaleString("pt-BR")}
          </p>
        </header>

        <section>
          <h2 className="mb-1 text-sm font-bold uppercase">Fornecedor</h2>
          <p>{account.supplierNome}</p>
        </section>

        <section className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p>
              <strong>Valor original:</strong> {formatCurrency(account.valorOriginal)}
            </p>
            <p>
              <strong>Pago:</strong> {formatCurrency(account.valorPago)}
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

        {account.pagamentos.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase">Pagamentos</h2>
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
                {account.pagamentos.map((payment) => (
                  <tr key={payment.id} className="border-b border-neutral-300">
                    <td className="py-1">
                      {new Date(payment.pagoEm).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-1">{payment.paymentMethodNome}</td>
                    <td className="py-1 text-right">{formatCurrency(payment.valor)}</td>
                    <td className="py-1 text-center">{payment.estornado ? "Sim" : "Não"}</td>
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

export function printAccountPayable() {
  window.print();
}
