"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type {
  CreateGoodsReceiptInput,
  OrderReceiptSummary,
} from "@/types/goods-receipt";

interface ReceiveGoodsFormProps {
  purchaseOrderId: string;
  summary: OrderReceiptSummary;
  onSubmit: (data: CreateGoodsReceiptInput) => void;
  loading?: boolean;
  error?: string;
}

export function ReceiveGoodsForm({
  purchaseOrderId,
  summary,
  onSubmit,
  loading,
  error,
}: ReceiveGoodsFormProps) {
  const [observacoes, setObservacoes] = useState("");
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  useEffect(() => {
    setQuantities(
      Object.fromEntries(
        summary.itens.map((item) => [item.id, String(item.quantidadePendente)]),
      ),
    );
  }, [summary]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      purchaseOrderId,
      observacoes: observacoes || undefined,
      itens: summary.itens.map((item) => ({
        purchaseOrderItemId: item.id,
        quantidadeRecebida: Number(quantities[item.id] ?? 0) || 0,
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full border border-neutral-200 text-sm">
          <thead className="bg-brand-light">
            <tr>
              <th className="px-3 py-2 text-left">Produto</th>
              <th className="px-3 py-2 text-left">SKU</th>
              <th className="px-3 py-2 text-right">Pedida</th>
              <th className="px-3 py-2 text-right">Já recebida</th>
              <th className="px-3 py-2 text-right">Pendente</th>
              <th className="px-3 py-2 text-right">Receber agora</th>
            </tr>
          </thead>
          <tbody>
            {summary.itens.map((item) => (
              <tr key={item.id} className="border-t border-neutral-200">
                <td className="px-3 py-2">{item.produtoNome}</td>
                <td className="px-3 py-2">{item.sku}</td>
                <td className="px-3 py-2 text-right">{item.quantidadePedida}</td>
                <td className="px-3 py-2 text-right">{item.quantidadeRecebida}</td>
                <td className="px-3 py-2 text-right">{item.quantidadePendente}</td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    min="0"
                    max={item.quantidadePendente}
                    className="w-20 border border-neutral-300 px-2 py-1 text-right text-sm"
                    value={quantities[item.id] ?? "0"}
                    disabled={item.quantidadePendente <= 0}
                    onChange={(e) =>
                      setQuantities((current) => ({
                        ...current,
                        [item.id]: e.target.value,
                      }))
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Input
        label="Observações"
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
        placeholder="Informações sobre a conferência..."
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Confirmando..." : "Confirmar recebimento"}
      </Button>
    </form>
  );
}
