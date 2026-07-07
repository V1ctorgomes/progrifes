import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InventoryMovementType, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import {
  CreateInventoryOutputDto,
  ListInventoryOutputsQueryDto,
} from "./dto/inventory-output.dto";
import {
  computeDisponivel,
  computeInventoryStatus,
} from "./inventory-stock.config";
import { InventoryMovementHistoryService } from "./inventory-movement-history.service";
import { InventoryMovementRepository } from "./inventory-movement.repository";
import { InventoryMovementService } from "./inventory-movement.service";
import { OUTPUT_TYPE_LABELS } from "./inventory-output.types";

@Injectable()
export class InventoryOutputService {
  constructor(
    private readonly repository: InventoryMovementRepository,
    private readonly movementService: InventoryMovementService,
    private readonly historyService: InventoryMovementHistoryService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(query: ListInventoryOutputsQueryDto) {
    const where = this.buildWhere(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.repository.findMany(where, skip, limit, { createdAt: "desc" }),
      this.repository.count(where),
    ]);

    return {
      data: items.map((item) => this.toOutputResponse(item)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const movement = await this.repository.findById(id);
    if (!movement || !this.isOutputMovement(movement.tipo, movement.origem)) {
      throw new NotFoundException("Saída de estoque não encontrada");
    }
    return this.toOutputDetail(movement);
  }

  async create(dto: CreateInventoryOutputDto, usuarioId: string) {
    return this.prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findFirst({
        where: { id: dto.variantId, deletedAt: null },
        include: { inventory: true },
      });

      if (!variant) {
        throw new NotFoundException("Variante não encontrada");
      }

      if (!variant.ativo) {
        throw new BadRequestException("Não é possível registrar saída para variante inativa");
      }

      const inventory = variant.inventory;
      if (!inventory) {
        throw new BadRequestException("Estoque não configurado para esta variante");
      }

      const disponivel = computeDisponivel(
        inventory.quantidadeTotal,
        inventory.quantidadeReservada,
      );

      if (dto.quantidade > disponivel) {
        throw new BadRequestException(
          `Estoque disponível insuficiente. Disponível: ${disponivel}`,
        );
      }

      const saldoAnterior = inventory.quantidadeTotal;
      const saldoAtual = saldoAnterior - dto.quantidade;
      const quantidadeDisponivel = computeDisponivel(
        saldoAtual,
        inventory.quantidadeReservada,
      );
      const status = computeInventoryStatus(quantidadeDisponivel, inventory.estoqueMinimo);

      await tx.inventory.update({
        where: { variantId: variant.id },
        data: { quantidadeTotal: saldoAtual, quantidadeDisponivel, status },
      });

      await tx.productVariant.update({
        where: { id: variant.id },
        data: { estoque: saldoAtual },
      });

      const numero = await this.repository.getNextOutputNumero(tx);
      const descricao = this.buildDescription(dto);

      const movement = await this.movementService.record(
        {
          variantId: variant.id,
          tipo: InventoryMovementType.SAIDA,
          origem: dto.tipo,
          quantidade: dto.quantidade,
          saldoAnterior,
          saldoAtual,
          referenciaId: undefined,
          usuarioId,
          motivo: dto.motivo.trim(),
          documento: dto.documento?.trim() || undefined,
          descricao,
          numero,
        },
        tx,
      );

      const refreshed = await tx.inventoryMovement.findUnique({
        where: { id: movement.id },
        include: {
          variant: {
            include: {
              produto: { include: { categoria: true } },
              atributos: {
                include: { attributeValue: { include: { attribute: true } } },
              },
            },
          },
          usuario: { select: { id: true, nome: true, email: true } },
          order: { select: { id: true, numero: true } },
          entry: { select: { id: true, numero: true, tipo: true } },
        },
      });

      return this.toOutputDetail(refreshed!);
    });
  }

  private isOutputMovement(tipo: InventoryMovementType, origem: string | null) {
    return tipo === InventoryMovementType.SAIDA || (tipo === InventoryMovementType.BAIXA && origem === "VENDA");
  }

  private buildDescription(dto: CreateInventoryOutputDto) {
    const parts = [dto.observacoes?.trim()].filter(Boolean);
    if (!parts.length) {
      return `Saída de estoque — ${OUTPUT_TYPE_LABELS[dto.tipo]}`;
    }
    return parts.join(" | ").slice(0, 500);
  }

  private buildWhere(query: ListInventoryOutputsQueryDto): Prisma.InventoryMovementWhereInput {
    const outputFilter: Prisma.InventoryMovementWhereInput = {
      OR: [
        { tipo: InventoryMovementType.SAIDA },
        { tipo: InventoryMovementType.BAIXA, origem: "VENDA" },
      ],
    };

    const filters: Prisma.InventoryMovementWhereInput[] = [outputFilter];

    if (query.tipo) {
      if (query.tipo === "VENDA") {
        filters.push({ tipo: InventoryMovementType.BAIXA, origem: "VENDA" });
      } else {
        filters.push({ tipo: InventoryMovementType.SAIDA, origem: query.tipo });
      }
    }

    if (query.usuarioId) filters.push({ usuarioId: query.usuarioId });

    if (query.dataInicio || query.dataFim) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (query.dataInicio) createdAt.gte = new Date(query.dataInicio);
      if (query.dataFim) {
        const end = new Date(query.dataFim);
        end.setHours(23, 59, 59, 999);
        createdAt.lte = end;
      }
      filters.push({ createdAt });
    }

    const variantWhere: Prisma.ProductVariantWhereInput = { deletedAt: null };
    if (query.produtoId) variantWhere.produtoId = query.produtoId;
    if (query.categoriaId) {
      variantWhere.produto = { categoriaId: query.categoriaId };
    }

    if (query.search) {
      const search = query.search.trim();
      filters.push({
        OR: [
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
        ],
      });
    } else if (query.produtoId || query.categoriaId) {
      filters.push({ variant: variantWhere });
    }

    return { AND: filters };
  }

  private toOutputResponse(
    movement: NonNullable<Awaited<ReturnType<InventoryMovementRepository["findById"]>>>,
  ) {
    const base = this.historyService.toListResponse(movement);
    const isVenda = movement.tipo === InventoryMovementType.BAIXA && movement.origem === "VENDA";

    return {
      ...base,
      tipoSaida: isVenda ? "VENDA" : movement.origem,
      tipoSaidaLabel: isVenda
        ? "Venda"
        : OUTPUT_TYPE_LABELS[movement.origem as keyof typeof OUTPUT_TYPE_LABELS] ?? movement.origem ?? "—",
      automatica: isVenda,
      numeroFormatado: isVenda
        ? movement.order
          ? `PED-${String(movement.order.numero).padStart(5, "0")}`
          : null
        : base.numeroFormatado,
    };
  }

  private toOutputDetail(
    movement: NonNullable<Awaited<ReturnType<InventoryMovementRepository["findById"]>>>,
  ) {
    const base = this.toOutputResponse(movement);
    const detail = this.historyService.toDetailResponse(movement);
    return { ...detail, ...base };
  }
}
