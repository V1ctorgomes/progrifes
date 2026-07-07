import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  PayableGenerationMode,
  Prisma,
  PurchaseOrderStatus,
} from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { InventoryEntryService } from "../inventory/inventory-entry.service";
import { PurchaseOrderHistoryService } from "../purchase-orders/purchase-order-history.service";
import { getStatusDescription } from "../purchase-orders/purchase-order-status.config";
import { PayableSettlementService } from "../accounts-payable/payable-settlement.service";
import { formatPayableNumero } from "../accounts-payable/accounts-payable.mapper";
import { CreateGoodsReceiptDto, ListGoodsReceiptsQueryDto } from "./dto/goods-receipt.dto";
import { ErpSettingsService } from "./erp-settings.service";
import { GoodsReceiptsRepository } from "./goods-receipts.repository";

const RECEIVABLE_STATUSES: PurchaseOrderStatus[] = [
  "APROVADA",
  "ENVIADA",
  "RECEBIMENTO_PARCIAL",
];

type ReceiptWithRelations = NonNullable<
  Awaited<ReturnType<GoodsReceiptsRepository["findById"]>>
>;

@Injectable()
export class GoodsReceiptsService {
  constructor(
    private readonly repository: GoodsReceiptsRepository,
    private readonly prisma: PrismaService,
    private readonly inventoryEntryService: InventoryEntryService,
    private readonly purchaseOrderHistoryService: PurchaseOrderHistoryService,
    private readonly erpSettingsService: ErpSettingsService,
    private readonly payableSettlementService: PayableSettlementService,
  ) {}

  async findAll(query: ListGoodsReceiptsQueryDto) {
    const where = await this.buildWhere(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.repository.findMany(where, skip, limit),
      this.repository.count(where),
    ]);

    return {
      data: items.map((item) => this.toListResponse(item)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const receipt = await this.repository.findById(id);
    if (!receipt) {
      throw new NotFoundException("Recebimento não encontrado");
    }
    return this.toDetailResponse(receipt);
  }

  async findByPurchaseOrderId(purchaseOrderId: string) {
    const receipts = await this.repository.findByPurchaseOrderId(purchaseOrderId);
    return receipts.map((receipt) => this.toDetailResponse(receipt));
  }

  async getOrderReceiptSummary(purchaseOrderId: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id: purchaseOrderId, deletedAt: null },
      include: { itens: true },
    });

    if (!order) {
      throw new NotFoundException("Ordem de compra não encontrada");
    }

    const receivedMap = await this.getReceivedQuantitiesByItem(order.itens.map((i) => i.id));

    const itens = order.itens.map((item) => {
      const quantidadeRecebida = receivedMap.get(item.id) ?? 0;
      const quantidadePendente = item.quantidade - quantidadeRecebida;
      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        produtoNome: item.produtoNome,
        sku: item.sku,
        quantidadePedida: item.quantidade,
        quantidadeRecebida,
        quantidadePendente,
        valorUnitario: Number(item.valorUnitario),
        desconto: Number(item.desconto),
        subtotal: Number(item.subtotal),
      };
    });

    const canReceive =
      RECEIVABLE_STATUSES.includes(order.status) &&
      itens.some((item) => item.quantidadePendente > 0);

    return {
      purchaseOrderId: order.id,
      status: order.status,
      canReceive,
      itens,
    };
  }

  async create(dto: CreateGoodsReceiptDto, usuarioId: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id: dto.purchaseOrderId, deletedAt: null },
      include: {
        supplier: true,
        itens: true,
      },
    });

    if (!order) {
      throw new NotFoundException("Ordem de compra não encontrada");
    }

    if (order.status === "CANCELADA") {
      throw new BadRequestException("Não é possível receber uma ordem cancelada");
    }

    if (order.status === "RECEBIDA") {
      throw new BadRequestException("Ordem já foi totalmente recebida");
    }

    if (!RECEIVABLE_STATUSES.includes(order.status)) {
      throw new BadRequestException("Apenas ordens aprovadas podem ser recebidas");
    }

    const itemsToReceive = dto.itens.filter((item) => item.quantidadeRecebida > 0);
    if (!itemsToReceive.length) {
      throw new BadRequestException("Informe ao menos uma quantidade recebida");
    }

    const receivedMap = await this.getReceivedQuantitiesByItem(order.itens.map((i) => i.id));
    const orderItemMap = new Map(order.itens.map((item) => [item.id, item]));

    let receiptValue = new Prisma.Decimal(0);
    const preparedItems: Array<{
      purchaseOrderItemId: string;
      variantId: string;
      quantidadeRecebida: number;
      poItem: (typeof order.itens)[number];
    }> = [];

    for (const item of itemsToReceive) {
      const poItem = orderItemMap.get(item.purchaseOrderItemId);
      if (!poItem) {
        throw new BadRequestException("Item inválido para esta ordem");
      }

      const alreadyReceived = receivedMap.get(poItem.id) ?? 0;
      const pending = poItem.quantidade - alreadyReceived;

      if (item.quantidadeRecebida > pending) {
        throw new BadRequestException(
          `Quantidade recebida excede o pendente para ${poItem.produtoNome}`,
        );
      }

      const lineValue = poItem.subtotal
        .mul(item.quantidadeRecebida)
        .div(poItem.quantidade);

      receiptValue = receiptValue.add(lineValue);

      preparedItems.push({
        purchaseOrderItemId: poItem.id,
        variantId: poItem.variantId,
        quantidadeRecebida: item.quantidadeRecebida,
        poItem,
      });
    }

    const totalOrderedQty = order.itens.reduce((sum, item) => sum + item.quantidade, 0);
    const receivedThisTime = preparedItems.reduce(
      (sum, item) => sum + item.quantidadeRecebida,
      0,
    );
    const alreadyReceivedTotal = [...receivedMap.values()].reduce((sum, qty) => sum + qty, 0);
    const progressRatio =
      totalOrderedQty > 0
        ? new Prisma.Decimal(alreadyReceivedTotal + receivedThisTime).div(totalOrderedQty)
        : new Prisma.Decimal(0);

    const freightShare = order.frete.mul(progressRatio).sub(
      order.frete.mul(
        totalOrderedQty > 0
          ? new Prisma.Decimal(alreadyReceivedTotal).div(totalOrderedQty)
          : new Prisma.Decimal(0),
      ),
    );
    const discountShare = order.desconto.mul(progressRatio).sub(
      order.desconto.mul(
        totalOrderedQty > 0
          ? new Prisma.Decimal(alreadyReceivedTotal).div(totalOrderedQty)
          : new Prisma.Decimal(0),
      ),
    );

    receiptValue = receiptValue.add(freightShare).sub(discountShare);
    if (receiptValue.lessThan(0)) {
      receiptValue = new Prisma.Decimal(0);
    }

    const payableMode = await this.erpSettingsService.getPayableGenerationMode();
    const ocFormatado = `OC-${String(order.numero).padStart(6, "0")}`;

    const receipt = await this.prisma.$transaction(async (tx) => {
      const numero = await this.repository.getNextNumero(tx);
      const numeroFormatado = this.formatNumero(numero);

      const created = await this.repository.create(
        {
          numero,
          valorTotal: receiptValue,
          observacoes: dto.observacoes?.trim() || null,
          purchaseOrder: { connect: { id: order.id } },
          usuario: { connect: { id: usuarioId } },
          itens: {
            create: preparedItems.map((item) => ({
              purchaseOrderItem: { connect: { id: item.purchaseOrderItemId } },
              variant: { connect: { id: item.variantId } },
              quantidadeRecebida: item.quantidadeRecebida,
            })),
          },
        },
        tx,
      );

      for (const item of preparedItems) {
        await this.inventoryEntryService.createWithinTransaction(
          {
            variantId: item.variantId,
            tipo: "COMPRA",
            quantidade: item.quantidadeRecebida,
            valorUnitario: Number(item.poItem.valorUnitario),
            fornecedor: order.supplier.nomeFantasia,
            documento: numeroFormatado,
          },
          usuarioId,
          tx,
          {
            goodsReceiptId: created.id,
            documento: `${ocFormatado} / ${numeroFormatado}`,
            observacoes: `Recebimento de mercadorias — ${item.poItem.produtoNome}`,
          },
        );
      }

      const updatedReceivedMap = await this.getReceivedQuantitiesByItem(
        order.itens.map((i) => i.id),
        tx,
      );

      const fullyReceived = order.itens.every((poItem) => {
        const received = updatedReceivedMap.get(poItem.id) ?? 0;
        return received >= poItem.quantidade;
      });

      const newStatus: PurchaseOrderStatus = fullyReceived
        ? "RECEBIDA"
        : "RECEBIMENTO_PARCIAL";

      const now = new Date();
      await tx.purchaseOrder.update({
        where: { id: order.id },
        data: {
          status: newStatus,
          ...(newStatus === "RECEBIDA" ? { recebidaEm: now } : {}),
        },
      });

      if (order.status !== newStatus) {
        await this.purchaseOrderHistoryService.recordStatusChange(
          order.id,
          newStatus,
          usuarioId,
          getStatusDescription(newStatus),
          tx,
        );
      }

      const shouldCreatePayable =
        payableMode === PayableGenerationMode.PER_RECEIPT ||
        (payableMode === PayableGenerationMode.AT_COMPLETION && fullyReceived);

      if (shouldCreatePayable) {
        const payableValue =
          payableMode === PayableGenerationMode.AT_COMPLETION
            ? order.total
            : receiptValue;

        await this.payableSettlementService.createFromGoodsReceipt(
          {
            supplierId: order.supplierId,
            purchaseOrderId: order.id,
            goodsReceiptId:
              payableMode === PayableGenerationMode.PER_RECEIPT ? created.id : null,
            goodsReceiptNumero: created.numero,
            purchaseOrderNumero: order.numero,
            valor: payableValue,
            usuarioId,
            vencimento: order.previsaoEntrega,
            observacoes:
              payableMode === PayableGenerationMode.AT_COMPLETION
                ? `Conta a pagar — ${ocFormatado}`
                : `Conta a pagar — ${numeroFormatado} (${ocFormatado})`,
            atCompletion: payableMode === PayableGenerationMode.AT_COMPLETION,
          },
          tx,
        );
      }

      return tx.goodsReceipt.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          purchaseOrder: {
            include: {
              supplier: {
                select: {
                  id: true,
                  razaoSocial: true,
                  nomeFantasia: true,
                  cnpj: true,
                },
              },
            },
          },
          usuario: { select: { id: true, nome: true, email: true } },
          itens: {
            include: {
              purchaseOrderItem: true,
              variant: {
                include: {
                  produto: { select: { id: true, nome: true } },
                  atributos: {
                    include: { attributeValue: { include: { attribute: true } } },
                  },
                },
              },
            },
          },
          contaPagar: true,
        },
      });
    });

    return this.toDetailResponse(receipt);
  }

  formatNumero(numero: number) {
    return `REC-${String(numero).padStart(6, "0")}`;
  }

  formatOcNumero(numero: number) {
    return `OC-${String(numero).padStart(6, "0")}`;
  }

  private async getReceivedQuantitiesByItem(
    itemIds: string[],
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    if (!itemIds.length) return new Map<string, number>();

    const rows = await client.goodsReceiptItem.groupBy({
      by: ["purchaseOrderItemId"],
      where: { purchaseOrderItemId: { in: itemIds } },
      _sum: { quantidadeRecebida: true },
    });

    return new Map(
      rows.map((row) => [row.purchaseOrderItemId, row._sum.quantidadeRecebida ?? 0]),
    );
  }

  private async buildWhere(query: ListGoodsReceiptsQueryDto) {
    const where: Prisma.GoodsReceiptWhereInput = {};

    if (query.purchaseOrderId) {
      where.purchaseOrderId = query.purchaseOrderId;
    }

    if (query.supplierId) {
      where.purchaseOrder = { supplierId: query.supplierId };
    }

    if (query.situacao) {
      const statusMap: Record<string, PurchaseOrderStatus[]> = {
        PENDENTE: ["APROVADA", "ENVIADA"],
        PARCIAL: ["RECEBIMENTO_PARCIAL"],
        RECEBIDO: ["RECEBIDA"],
      };
      where.purchaseOrder = {
        ...(where.purchaseOrder as Prisma.PurchaseOrderWhereInput | undefined),
        status: { in: statusMap[query.situacao] },
      };
    }

    if (query.dataInicio || query.dataFim) {
      where.createdAt = {};
      if (query.dataInicio) where.createdAt.gte = new Date(query.dataInicio);
      if (query.dataFim) {
        const end = new Date(query.dataFim);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      const numero = Number(term.replace(/\D/g, ""));
      where.OR = [
        {
          purchaseOrder: {
            supplier: {
              OR: [
                { razaoSocial: { contains: term, mode: "insensitive" } },
                { nomeFantasia: { contains: term, mode: "insensitive" } },
              ],
            },
          },
        },
        {
          itens: {
            some: {
              OR: [
                { purchaseOrderItem: { produtoNome: { contains: term, mode: "insensitive" } } },
                { purchaseOrderItem: { sku: { contains: term, mode: "insensitive" } } },
              ],
            },
          },
        },
      ];

      if (Number.isFinite(numero) && numero > 0) {
        where.OR.push({ numero });
        where.OR.push({ purchaseOrder: { numero } });
      }
    }

    return where;
  }

  private toListResponse(receipt: ReceiptWithRelations) {
    return {
      id: receipt.id,
      numero: receipt.numero,
      numeroFormatado: this.formatNumero(receipt.numero),
      purchaseOrderId: receipt.purchaseOrderId,
      ordemNumero: receipt.purchaseOrder.numero,
      ordemNumeroFormatado: this.formatOcNumero(receipt.purchaseOrder.numero),
      ordemStatus: receipt.purchaseOrder.status,
      fornecedorNome: receipt.purchaseOrder.supplier.nomeFantasia,
      supplierId: receipt.purchaseOrder.supplierId,
      valorTotal: Number(receipt.valorTotal),
      itensCount: receipt.itens.length,
      responsavel: receipt.usuario
        ? { id: receipt.usuario.id, nome: receipt.usuario.nome }
        : null,
      createdAt: receipt.createdAt.toISOString(),
    };
  }

  private toDetailResponse(receipt: ReceiptWithRelations) {
    return {
      ...this.toListResponse(receipt),
      observacoes: receipt.observacoes,
      fornecedor: receipt.purchaseOrder.supplier,
      contaPagar: receipt.contaPagar
        ? {
            id: receipt.contaPagar.id,
            numero: receipt.contaPagar.numero,
            numeroFormatado: formatPayableNumero(receipt.contaPagar.numero),
            valorOriginal: Number(receipt.contaPagar.valorOriginal),
            saldo: Number(receipt.contaPagar.saldo),
            status: receipt.contaPagar.status,
            vencimento: receipt.contaPagar.vencimento.toISOString(),
          }
        : null,
      itens: receipt.itens.map((item) => ({
        id: item.id,
        purchaseOrderItemId: item.purchaseOrderItemId,
        variantId: item.variantId,
        produtoNome: item.purchaseOrderItem.produtoNome,
        sku: item.purchaseOrderItem.sku,
        quantidadePedida: item.purchaseOrderItem.quantidade,
        quantidadeRecebida: item.quantidadeRecebida,
        valorUnitario: Number(item.purchaseOrderItem.valorUnitario),
      })),
    };
  }
}
