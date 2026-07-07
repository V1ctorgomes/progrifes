import { Injectable, NotFoundException } from "@nestjs/common";
import { InventoryMovementType } from "@prisma/client";
import {
  MOVEMENT_SOURCE_LABELS,
  MOVEMENT_TYPE_LABELS,
  ORIGEM_LABELS,
  resolveMovementSourceCategory,
} from "./inventory-movement.labels";
import {
  InventoryMovementRepository,
  MovementWithRelations,
} from "./inventory-movement.repository";

@Injectable()
export class InventoryMovementHistoryService {
  constructor(private readonly repository: InventoryMovementRepository) {}

  async findAll(query: import("./dto/inventory-movement.dto").ListInventoryMovementsQueryDto) {
    const where = this.buildWhere(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.repository.findMany(where, skip, limit, { createdAt: "desc" }),
      this.repository.count(where),
    ]);

    return {
      data: items.map((item) => this.toListResponse(item)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const movement = await this.repository.findById(id);
    if (!movement) {
      throw new NotFoundException("Movimentação não encontrada");
    }
    return this.toDetailResponse(movement);
  }

  private buildWhere(
    query: import("./dto/inventory-movement.dto").ListInventoryMovementsQueryDto,
  ): import("@prisma/client").Prisma.InventoryMovementWhereInput {
    const where: import("@prisma/client").Prisma.InventoryMovementWhereInput = {};

    if (query.tipo) where.tipo = query.tipo;
    if (query.origem) where.origem = query.origem;
    if (query.usuarioId) where.usuarioId = query.usuarioId;

    if (query.categoriaOrigem) {
      where.OR = this.buildSourceCategoryFilter(query.categoriaOrigem);
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

    const variantWhere: import("@prisma/client").Prisma.ProductVariantWhereInput = {
      deletedAt: null,
    };
    if (query.produtoId) variantWhere.produtoId = query.produtoId;
    if (query.categoriaId) {
      variantWhere.produto = { categoriaId: query.categoriaId };
    }

    if (query.search) {
      const search = query.search.trim();
      const searchOr: import("@prisma/client").Prisma.InventoryMovementWhereInput[] = [
        { documento: { contains: search, mode: "insensitive" } },
        { motivo: { contains: search, mode: "insensitive" } },
        { descricao: { contains: search, mode: "insensitive" } },
        { usuario: { nome: { contains: search, mode: "insensitive" } } },
        {
          variant: {
            deletedAt: null,
            OR: [
              { sku: { contains: search, mode: "insensitive" } },
              { produto: { nome: { contains: search, mode: "insensitive" } } },
            ],
          },
        },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchOr }];
        delete where.OR;
      } else {
        where.OR = searchOr;
      }
    } else if (query.produtoId || query.categoriaId) {
      where.variant = variantWhere;
    }

    return where;
  }

  private buildSourceCategoryFilter(
    categoria: string,
  ): import("@prisma/client").Prisma.InventoryMovementWhereInput[] {
    switch (categoria) {
      case "ENTRADA":
        return [{ tipo: InventoryMovementType.ENTRADA }];
      case "SAIDA":
        return [
          { tipo: InventoryMovementType.SAIDA },
          { tipo: InventoryMovementType.BAIXA, origem: "VENDA" },
        ];
      case "PEDIDO":
        return [
          { tipo: InventoryMovementType.RESERVA },
          { tipo: InventoryMovementType.LIBERACAO },
        ];
      case "INVENTARIO":
        return [{ origem: "INVENTARIO" }];
      default:
        return [];
    }
  }

  private formatVariantLabel(
    atributos: Array<{ attributeValue: { attribute: { nome: string }; valor: string } }>,
  ) {
    if (!atributos.length) return "Padrão";
    return atributos
      .map((item) => `${item.attributeValue.attribute.nome}: ${item.attributeValue.valor}`)
      .join(" / ");
  }

  toListResponse(movement: MovementWithRelations) {
    const variant = movement.variant;
    const sourceCategory = resolveMovementSourceCategory(movement.tipo, movement.origem);

    return {
      id: movement.id,
      numero: movement.numero,
      numeroFormatado: movement.numero ? `SAI-${String(movement.numero).padStart(5, "0")}` : null,
      variantId: movement.variantId,
      produtoId: variant.produtoId,
      produtoNome: variant.produto.nome,
      categoriaNome: variant.produto.categoria.nome,
      sku: variant.sku,
      varianteLabel: this.formatVariantLabel(variant.atributos),
      tipo: movement.tipo,
      tipoLabel: MOVEMENT_TYPE_LABELS[movement.tipo],
      origem: movement.origem,
      origemLabel: movement.origem ? (ORIGEM_LABELS[movement.origem] ?? movement.origem) : null,
      categoriaOrigem: sourceCategory,
      categoriaOrigemLabel: MOVEMENT_SOURCE_LABELS[sourceCategory],
      quantidade: movement.quantidade,
      saldoAnterior: movement.saldoAnterior,
      saldoAtual: movement.saldoAtual,
      motivo: movement.motivo,
      documento: movement.documento,
      usuarioId: movement.usuarioId,
      responsavelNome: movement.usuario?.nome ?? null,
      orderId: movement.orderId,
      orderNumero: movement.order?.numero ?? null,
      entryId: movement.entryId,
      entryNumero: movement.entry?.numero ?? null,
      createdAt: movement.createdAt,
    };
  }

  toDetailResponse(movement: MovementWithRelations) {
    const base = this.toListResponse(movement);
    return {
      ...base,
      observacoes: movement.descricao,
      responsavelEmail: movement.usuario?.email ?? null,
      orderNumeroFormatado: movement.order
        ? `#${String(movement.order.numero).padStart(5, "0")}`
        : null,
      entryNumeroFormatado: movement.entry
        ? `ENT-${String(movement.entry.numero).padStart(5, "0")}`
        : null,
      automatica: Boolean(movement.orderId || movement.entryId),
    };
  }
}
