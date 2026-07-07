"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { productsAdminApi, suppliersAdminApi, variantsAdminApi } from "@/lib/admin-api";
import { formatVariantLabel } from "@/lib/variants";
import type { ProductVariant } from "@/types/variant";
import type {
  PurchaseOrder,
  PurchaseOrderInput,
  PurchaseOrderItemInput,
} from "@/types/purchase-order";
import { formatCurrency } from "@/utils/cn";

const emptyItem = (): PurchaseOrderItemInput => ({
  productId: "",
  variantId: "",
  quantidade: 1,
  valorUnitario: 0,
  desconto: 0,
});

interface PurchaseOrderFormProps {
  initial?: PurchaseOrder | null;
  onSubmit: (data: PurchaseOrderInput) => void;
  loading?: boolean;
  error?: string;
}

export function PurchaseOrderForm({
  initial,
  onSubmit,
  loading,
  error,
}: PurchaseOrderFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [supplierId, setSupplierId] = useState(initial?.supplierId ?? "");
  const [data, setData] = useState(initial?.data ? initial.data.slice(0, 10) : today);
  const [previsaoEntrega, setPrevisaoEntrega] = useState(
    initial?.previsaoEntrega ? initial.previsaoEntrega.slice(0, 10) : "",
  );
  const [frete, setFrete] = useState(String(initial?.frete ?? 0));
  const [desconto, setDesconto] = useState(String(initial?.desconto ?? 0));
  const [pedidoFornecedor, setPedidoFornecedor] = useState(initial?.pedidoFornecedor ?? "");
  const [observacoes, setObservacoes] = useState(initial?.observacoes ?? "");
  const [itens, setItens] = useState<PurchaseOrderItemInput[]>(
    initial?.itens.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario,
      desconto: item.desconto,
    })) ?? [emptyItem()],
  );

  const { data: suppliersData } = useQuery({
    queryKey: ["admin", "suppliers", "select"],
    queryFn: () => suppliersAdminApi.list({ limit: 200, ativo: true }),
  });

  const { data: productsData } = useQuery({
    queryKey: ["admin", "products", "purchase-form"],
    queryFn: () => productsAdminApi.list({ limit: 200, ativo: true }),
  });

  const suppliers = suppliersData?.data ?? [];
  const products = productsData?.data ?? [];

  useEffect(() => {
    if (!initial) return;
    setSupplierId(initial.supplierId);
    setData(initial.data.slice(0, 10));
    setPrevisaoEntrega(initial.previsaoEntrega.slice(0, 10));
    setFrete(String(initial.frete));
    setDesconto(String(initial.desconto));
    setPedidoFornecedor(initial.pedidoFornecedor ?? "");
    setObservacoes(initial.observacoes ?? "");
    setItens(
      initial.itens.map((item) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
        desconto: item.desconto,
      })),
    );
  }, [initial]);

  const totals = useMemo(() => {
    const subtotal = itens.reduce((sum, item) => {
      const bruto = item.quantidade * item.valorUnitario;
      return sum + bruto - (item.desconto ?? 0);
    }, 0);
    const freteValue = Number(frete) || 0;
    const descontoValue = Number(desconto) || 0;
    return {
      subtotal,
      frete: freteValue,
      desconto: descontoValue,
      total: subtotal + freteValue - descontoValue,
    };
  }, [itens, frete, desconto]);

  const updateItem = (index: number, patch: Partial<PurchaseOrderItemInput>) => {
    setItens((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      supplierId,
      data,
      previsaoEntrega,
      frete: Number(frete) || 0,
      desconto: Number(desconto) || 0,
      pedidoFornecedor: pedidoFornecedor || undefined,
      observacoes: observacoes || undefined,
      itens: itens.filter((item) => item.variantId),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-black">
            Fornecedor *
          </label>
          <select
            className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            required
          >
            <option value="">Selecione...</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.nomeFantasia}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Data *"
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          required
        />
        <Input
          label="Previsão de entrega *"
          type="date"
          value={previsaoEntrega}
          onChange={(e) => setPrevisaoEntrega(e.target.value)}
          required
        />
        <Input
          label="Nº pedido do fornecedor"
          value={pedidoFornecedor}
          onChange={(e) => setPedidoFornecedor(e.target.value)}
        />
        <Input
          label="Frete"
          type="number"
          min="0"
          step="0.01"
          value={frete}
          onChange={(e) => setFrete(e.target.value)}
        />
        <Input
          label="Desconto geral"
          type="number"
          min="0"
          step="0.01"
          value={desconto}
          onChange={(e) => setDesconto(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-medium text-brand-black">Itens da ordem</p>
          <Button type="button" variant="secondary" onClick={() => setItens((c) => [...c, emptyItem()])}>
            Adicionar item
          </Button>
        </div>

        {itens.map((item, index) => (
          <PurchaseOrderItemRow
            key={item.id ?? index}
            item={item}
            products={products}
            onChange={(patch) => updateItem(index, patch)}
            onRemove={() => setItens((current) => current.filter((_, i) => i !== index))}
            canRemove={itens.length > 1}
          />
        ))}
      </div>

      <div className="border border-neutral-200 bg-brand-light p-4 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCurrency(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Frete</span>
          <span>{formatCurrency(totals.frete)}</span>
        </div>
        <div className="flex justify-between">
          <span>Descontos</span>
          <span>{formatCurrency(totals.desconto)}</span>
        </div>
        <div className="mt-2 flex justify-between font-semibold">
          <span>Total geral</span>
          <span>{formatCurrency(totals.total)}</span>
        </div>
      </div>

      <Input
        label="Observações"
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : initial ? "Salvar alterações" : "Criar ordem"}
      </Button>
    </form>
  );
}

function PurchaseOrderItemRow({
  item,
  products,
  onChange,
  onRemove,
  canRemove,
}: {
  item: PurchaseOrderItemInput;
  products: Array<{ id: string; nome: string }>;
  onChange: (patch: Partial<PurchaseOrderItemInput>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const { data: variants = [] } = useQuery({
    queryKey: ["admin", "variants", item.productId, "purchase-form"],
    queryFn: () => variantsAdminApi.listByProduct(item.productId),
    enabled: Boolean(item.productId),
  });

  const activeVariants = variants.filter((variant: ProductVariant) => variant.ativo);
  const subtotal = item.quantidade * item.valorUnitario - (item.desconto ?? 0);

  return (
    <div className="grid gap-3 border border-neutral-200 p-4 lg:grid-cols-6">
      <div className="lg:col-span-2">
        <label className="mb-1.5 block text-sm font-medium text-brand-black">Produto</label>
        <select
          className="w-full border border-neutral-300 bg-brand-white px-3 py-2 text-sm"
          value={item.productId}
          onChange={(e) =>
            onChange({ productId: e.target.value, variantId: "", valorUnitario: 0 })
          }
        >
          <option value="">Selecione...</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.nome}
            </option>
          ))}
        </select>
      </div>
      <div className="lg:col-span-2">
        <label className="mb-1.5 block text-sm font-medium text-brand-black">Variante</label>
        <select
          className="w-full border border-neutral-300 bg-brand-white px-3 py-2 text-sm"
          value={item.variantId}
          onChange={(e) => {
            const variant = activeVariants.find((v: ProductVariant) => v.id === e.target.value);
            onChange({
              variantId: e.target.value,
              valorUnitario: variant?.custo ? Number(variant.custo) : item.valorUnitario,
            });
          }}
          disabled={!item.productId}
        >
          <option value="">Selecione...</option>
          {activeVariants.map((variant: ProductVariant) => (
            <option key={variant.id} value={variant.id}>
              {formatVariantLabel(variant)} — {variant.sku}
            </option>
          ))}
        </select>
      </div>
      <Input
        label="Qtd"
        type="number"
        min="1"
        value={String(item.quantidade)}
        onChange={(e) => onChange({ quantidade: Number(e.target.value) || 1 })}
      />
      <Input
        label="Valor unit."
        type="number"
        min="0"
        step="0.01"
        value={String(item.valorUnitario)}
        onChange={(e) => onChange({ valorUnitario: Number(e.target.value) || 0 })}
      />
      <Input
        label="Desconto"
        type="number"
        min="0"
        step="0.01"
        value={String(item.desconto ?? 0)}
        onChange={(e) => onChange({ desconto: Number(e.target.value) || 0 })}
      />
      <div className="flex items-end justify-between gap-2 lg:col-span-6">
        <p className="text-sm text-brand-gray">Subtotal: {formatCurrency(subtotal)}</p>
        {canRemove && (
          <Button type="button" variant="secondary" size="sm" onClick={onRemove}>
            Remover
          </Button>
        )}
      </div>
    </div>
  );
}
