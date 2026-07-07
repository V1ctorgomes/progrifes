import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InventoryMovementType, InventoryStatus, Inventory, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { ListInventoryQueryDto } from "./dto/inventory.dto";
import {
  computeDisponivel,
  computeInventoryStatus,
  INVENTORY_STATUS_META,
  toStockStatusKey,
} from "./inventory-stock.config";
import { InventoryMovementService } from "./inventory-movement.service";
import { InventoryRepository } from "./inventory.repository";

type OrderItemStock = { variantId: string; quantidade: number; produtoNome?: string; sku?: string };

@Injectable()
export class InventoryService {
  constructor(
    private readonly repository: InventoryRepository,
    private readonly prisma: PrismaService,
    private readonly movementService: InventoryMovementService,
  ) {}

  async findAll(query: ListInventoryQueryDto) {
    const where = this.buildWhere(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const orderBy = this.buildOrderBy(query.sort);

    const [items, total] = await Promise.all([
      this.repository.findMany(where, skip, limit, orderBy),
      this.repository.count(where),
    ]);

    return {
      data: items.map((item) => this.toListResponse(item)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByVariantId(variantId: string) {
    const inventory = await this.repository.findByVariantId(variantId);
    if (!inventory) {
      throw new NotFoundException("Estoque não encontrado para esta variante");
    }
    return this.toListResponse(inventory);
  }

  async getAlerts() {
    const [estoqueBaixo, semEstoque, comReserva] = await Promise.all([
      this.repository.countByStatus(InventoryStatus.ESTOQUE_BAIXO),
      this.repository.countByStatus(InventoryStatus.SEM_ESTOQUE),
      this.repository.countReserved(),
    ]);

    const [itensBaixo, itensSem, itensReservados] = await Promise.all([
      this.repository.findMany({ status: InventoryStatus.ESTOQUE_BAIXO }, 0, 10, {
        quantidadeDisponivel: "asc",
      }),
      this.repository.findMany({ status: InventoryStatus.SEM_ESTOQUE }, 0, 10, {
        updatedAt: "desc",
      }),
      this.repository.findMany({ quantidadeReservada: { gt: 0 } }, 0, 10, {
        quantidadeReservada: "desc",
      }),
    ]);

    return {
      estoqueBaixo,
      semEstoque,
      comReserva,
      itensBaixo: itensBaixo.map((item) => this.toListResponse(item)),
      itensSem: itensSem.map((item) => this.toListResponse(item)),
      itensReservados: itensReservados.map((item) => this.toListResponse(item)),
    };
  }

  async getLowStock() {
    const items = await this.repository.findMany(
      { status: InventoryStatus.ESTOQUE_BAIXO },
      0,
      100,
      { quantidadeDisponivel: "asc" },
    );
    return items.map((item) => this.toListResponse(item));
  }

  async getOutOfStock() {
    const items = await this.repository.findMany(
      { status: InventoryStatus.SEM_ESTOQUE },
      0,
      100,
      { updatedAt: "desc" },
    );
    return items.map((item) => this.toListResponse(item));
  }

  async ensureForVariant(
    variantId: string,
    quantidadeTotal: number,
    estoqueMinimo: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Inventory> {
    const client = tx ?? this.prisma;
    const existing = await client.inventory.findUnique({ where: { variantId } });
    if (existing) {
      return this.syncTotals(variantId, quantidadeTotal, estoqueMinimo, tx);
    }

    const disponivel = computeDisponivel(quantidadeTotal, 0);
    const status = computeInventoryStatus(disponivel, estoqueMinimo);

    const inventory = await this.repository.create(
      {
        variant: { connect: { id: variantId } },
        quantidadeTotal,
        quantidadeReservada: 0,
        quantidadeDisponivel: disponivel,
        estoqueMinimo,
        status,
      },
      tx,
    );

    await this.syncVariantEstoque(variantId, quantidadeTotal, estoqueMinimo, tx);
    return inventory;
  }

  async syncFromVariantUpdate(
    variantId: string,
    quantidadeTotal: number,
    estoqueMinimo: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Inventory> {
    const client = tx ?? this.prisma;
    const existing = await client.inventory.findUnique({ where: { variantId } });
    if (!existing) {
      return this.ensureForVariant(variantId, quantidadeTotal, estoqueMinimo, tx);
    }

    if (quantidadeTotal !== existing.quantidadeTotal) {
      throw new BadRequestException(
        "O saldo de estoque só pode ser alterado pelo módulo de entradas de estoque",
      );
    }

    return this.updateEstoqueMinimo(variantId, estoqueMinimo, tx);
  }

  async updateEstoqueMinimo(
    variantId: string,
    estoqueMinimo: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Inventory> {
    const client = tx ?? this.prisma;
    const inventory = await client.inventory.findUnique({ where: { variantId } });
    if (!inventory) {
      return this.ensureForVariant(variantId, 0, estoqueMinimo, tx);
    }

    const quantidadeDisponivel = computeDisponivel(
      inventory.quantidadeTotal,
      inventory.quantidadeReservada,
    );
    const status = computeInventoryStatus(quantidadeDisponivel, estoqueMinimo);

    const updated = await this.repository.update(
      variantId,
      { estoqueMinimo, quantidadeDisponivel, status },
      tx,
    );

    await client.productVariant.update({
      where: { id: variantId },
      data: { estoqueMinimo },
    });

    return updated;
  }

  async reserveForOrder(orderId: string, items: OrderItemStock[], tx: Prisma.TransactionClient) {
    for (const item of items) {
      await this.reserveItem(orderId, item, tx);
    }
  }

  async releaseForOrder(orderId: string, items: OrderItemStock[], tx: Prisma.TransactionClient) {
    for (const item of items) {
      await this.releaseItem(orderId, item, tx);
    }
  }

  async finalizeForOrder(orderId: string, items: OrderItemStock[], tx: Prisma.TransactionClient) {
    for (const item of items) {
      await this.finalizeItem(orderId, item, tx);
    }
  }

  private async reserveItem(orderId: string, item: OrderItemStock, tx: Prisma.TransactionClient) {
    const inventory = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
    if (!inventory) {
      throw new BadRequestException(`Estoque não configurado para a variante ${item.variantId}`);
    }

    const disponivelAntes = computeDisponivel(inventory.quantidadeTotal, inventory.quantidadeReservada);
    if (disponivelAntes < item.quantidade) {
      throw new BadRequestException(
        `Estoque insuficiente para ${item.produtoNome ?? "produto"} (${item.sku ?? item.variantId}). Disponível: ${disponivelAntes}`,
      );
    }

    const quantidadeReservada = inventory.quantidadeReservada + item.quantidade;
    const quantidadeDisponivel = computeDisponivel(inventory.quantidadeTotal, quantidadeReservada);
    const status = computeInventoryStatus(quantidadeDisponivel, inventory.estoqueMinimo);

    await tx.inventory.update({
      where: { variantId: item.variantId },
      data: { quantidadeReservada, quantidadeDisponivel, status },
    });

    await this.syncVariantEstoque(item.variantId, inventory.quantidadeTotal, inventory.estoqueMinimo, tx);

    await this.movementService.record(
      {
        variantId: item.variantId,
        orderId,
        tipo: InventoryMovementType.RESERVA,
        origem: "PEDIDO",
        quantidade: item.quantidade,
        saldoAnterior: disponivelAntes,
        saldoAtual: quantidadeDisponivel,
        referenciaId: orderId,
        descricao: "Reserva de estoque para pedido",
      },
      tx,
    );
  }

  private async releaseItem(orderId: string, item: OrderItemStock, tx: Prisma.TransactionClient) {
    const inventory = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
    if (!inventory) return;

    const disponivelAntes = computeDisponivel(inventory.quantidadeTotal, inventory.quantidadeReservada);
    const quantidadeReservada = Math.max(0, inventory.quantidadeReservada - item.quantidade);
    const quantidadeDisponivel = computeDisponivel(inventory.quantidadeTotal, quantidadeReservada);
    const status = computeInventoryStatus(quantidadeDisponivel, inventory.estoqueMinimo);

    await tx.inventory.update({
      where: { variantId: item.variantId },
      data: { quantidadeReservada, quantidadeDisponivel, status },
    });

    await this.syncVariantEstoque(item.variantId, inventory.quantidadeTotal, inventory.estoqueMinimo, tx);

    await this.movementService.record(
      {
        variantId: item.variantId,
        orderId,
        tipo: InventoryMovementType.LIBERACAO,
        origem: "PEDIDO",
        quantidade: item.quantidade,
        saldoAnterior: disponivelAntes,
        saldoAtual: quantidadeDisponivel,
        referenciaId: orderId,
        descricao: "Liberação de reserva por cancelamento",
      },
      tx,
    );
  }

  private async finalizeItem(orderId: string, item: OrderItemStock, tx: Prisma.TransactionClient) {
    const inventory = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
    if (!inventory) return;

    const saldoAnterior = inventory.quantidadeTotal;
    const quantidadeTotal = Math.max(0, inventory.quantidadeTotal - item.quantidade);
    const quantidadeReservada = Math.max(0, inventory.quantidadeReservada - item.quantidade);
    const quantidadeDisponivel = computeDisponivel(quantidadeTotal, quantidadeReservada);
    const status = computeInventoryStatus(quantidadeDisponivel, inventory.estoqueMinimo);

    await tx.inventory.update({
      where: { variantId: item.variantId },
      data: { quantidadeTotal, quantidadeReservada, quantidadeDisponivel, status },
    });

    await this.syncVariantEstoque(item.variantId, quantidadeTotal, inventory.estoqueMinimo, tx);

    await this.movementService.record(
      {
        variantId: item.variantId,
        orderId,
        tipo: InventoryMovementType.BAIXA,
        origem: "PEDIDO",
        quantidade: item.quantidade,
        saldoAnterior,
        saldoAtual: quantidadeTotal,
        referenciaId: orderId,
        descricao: "Baixa definitiva por entrega do pedido",
      },
      tx,
    );
  }

  private async syncTotals(
    variantId: string,
    quantidadeTotal: number,
    estoqueMinimo: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Inventory> {
    const client = tx ?? this.prisma;
    const inventory = await client.inventory.findUnique({ where: { variantId } });
    if (!inventory) {
      return this.ensureForVariant(variantId, quantidadeTotal, estoqueMinimo, tx);
    }

    if (quantidadeTotal < inventory.quantidadeReservada) {
      throw new BadRequestException(
        "Quantidade total não pode ser menor que a quantidade reservada",
      );
    }

    const quantidadeDisponivel = computeDisponivel(quantidadeTotal, inventory.quantidadeReservada);
    const status = computeInventoryStatus(quantidadeDisponivel, estoqueMinimo);

    const updated = await this.repository.update(
      variantId,
      { quantidadeTotal, estoqueMinimo, quantidadeDisponivel, status },
      tx,
    );

    await this.syncVariantEstoque(variantId, quantidadeTotal, estoqueMinimo, tx);
    await client.productVariant.update({
      where: { id: variantId },
      data: { estoque: quantidadeTotal, estoqueMinimo },
    });

    return updated;
  }

  private async syncVariantEstoque(
    variantId: string,
    quantidadeTotal: number,
    estoqueMinimo: number,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    await client.productVariant.update({
      where: { id: variantId },
      data: { estoque: quantidadeTotal, estoqueMinimo },
    });
  }

  private buildWhere(query: ListInventoryQueryDto): Prisma.InventoryWhereInput {
    const variantWhere: Prisma.ProductVariantWhereInput = { deletedAt: null };

    if (query.produtoId) {
      variantWhere.produtoId = query.produtoId;
    }

    const produtoWhere: Prisma.ProductWhereInput = {};
    if (query.categoriaId) {
      produtoWhere.categoriaId = query.categoriaId;
    }
    if (query.produtoAtivo !== undefined) {
      produtoWhere.ativo = query.produtoAtivo;
    }
    if (Object.keys(produtoWhere).length > 0) {
      variantWhere.produto = produtoWhere;
    }

    if (query.search) {
      const search = query.search.trim();
      variantWhere.OR = [
        { sku: { contains: search, mode: "insensitive" } },
        { produto: { nome: { contains: search, mode: "insensitive" } } },
        { produto: { categoria: { nome: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const where: Prisma.InventoryWhereInput = { variant: variantWhere };

    if (query.status) {
      where.status = query.status;
    }

    return where;
  }

  private buildOrderBy(
    sort?: ListInventoryQueryDto["sort"],
  ): Prisma.InventoryOrderByWithRelationInput | Prisma.InventoryOrderByWithRelationInput[] {
    switch (sort) {
      case "disponivel_asc":
        return { quantidadeDisponivel: "asc" };
      case "disponivel_desc":
        return { quantidadeDisponivel: "desc" };
      case "total_asc":
        return { quantidadeTotal: "asc" };
      case "total_desc":
        return { quantidadeTotal: "desc" };
      case "nome":
        return { variant: { produto: { nome: "asc" } } };
      case "categoria":
        return { variant: { produto: { categoria: { nome: "asc" } } } };
      case "sku":
        return { variant: { sku: "asc" } };
      default:
        return { quantidadeDisponivel: "asc" };
    }
  }

  private toListResponse(
    inventory: Awaited<ReturnType<InventoryRepository["findByVariantId"]>> & object,
  ) {
    const variant = inventory.variant!;
    const meta = INVENTORY_STATUS_META[inventory.status];

    const atributos = variant.atributos.map((item) => ({
      nome: item.attributeValue.attribute.nome,
      valor: item.attributeValue.valor,
    }));

    return {
      id: inventory.id,
      variantId: inventory.variantId,
      produtoId: variant.produtoId,
      produtoNome: variant.produto.nome,
      produtoAtivo: variant.produto.ativo,
      varianteAtiva: variant.ativo,
      categoriaId: variant.produto.categoriaId,
      categoriaNome: variant.produto.categoria.nome,
      sku: variant.sku,
      atributos,
      quantidadeTotal: inventory.quantidadeTotal,
      quantidadeReservada: inventory.quantidadeReservada,
      quantidadeDisponivel: inventory.quantidadeDisponivel,
      estoqueMinimo: inventory.estoqueMinimo,
      status: inventory.status,
      statusLabel: meta.nome,
      statusCor: meta.cor,
      statusKey: toStockStatusKey(inventory.status),
      updatedAt: inventory.updatedAt,
    };
  }
}
