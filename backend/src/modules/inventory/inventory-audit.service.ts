import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  InventoryAuditStatus,
  InventoryAuditType,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import {
  CreateInventoryAuditDto,
  ListInventoryAuditsQueryDto,
} from "./dto/inventory-audit.dto";
import { InventoryAdjustmentService } from "./inventory-adjustment.service";
import { InventoryAuditRepository } from "./inventory-audit.repository";
import { InventoryCountService } from "./inventory-count.service";

const AUDIT_TYPE_LABELS: Record<InventoryAuditType, string> = {
  GERAL: "Inventário Geral",
  PARCIAL: "Inventário Parcial",
  CATEGORIA: "Inventário por Categoria",
  PRODUTO: "Inventário por Produto",
  VARIANTE: "Inventário por Variante",
};

const AUDIT_STATUS_LABELS: Record<InventoryAuditStatus, string> = {
  RASCUNHO: "Rascunho",
  EM_ANDAMENTO: "Em Andamento",
  PAUSADO: "Pausado",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

const ADJUSTMENT_TYPE_LABELS = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
  NENHUM: "Nenhum",
};

@Injectable()
export class InventoryAuditService {
  constructor(
    private readonly repository: InventoryAuditRepository,
    private readonly countService: InventoryCountService,
    private readonly adjustmentService: InventoryAdjustmentService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(query: ListInventoryAuditsQueryDto) {
    const where = this.buildWhere(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.repository.findMany(where, skip, limit, { dataInventario: "desc" }),
      this.repository.count(where),
    ]);

    return {
      data: items.map((item) => this.toListResponse(item)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const audit = await this.repository.findById(id);
    if (!audit) throw new NotFoundException("Inventário não encontrado");
    return this.toDetailResponse(audit);
  }

  async create(dto: CreateInventoryAuditDto, usuarioId: string) {
    this.validateCreateDto(dto);

    return this.prisma.$transaction(async (tx) => {
      const variants = await this.resolveVariants(dto, tx);
      if (!variants.length) {
        throw new BadRequestException("Nenhuma variante encontrada para o inventário");
      }

      const numero = await this.repository.getNextNumero(tx);
      const dataInventario = dto.dataInventario ? new Date(dto.dataInventario) : new Date();

      const audit = await this.repository.create(
        {
          numero,
          nome: dto.nome.trim(),
          tipo: dto.tipo,
          status: InventoryAuditStatus.RASCUNHO,
          categoria: dto.categoriaId ? { connect: { id: dto.categoriaId } } : undefined,
          produto: dto.produtoId ? { connect: { id: dto.produtoId } } : undefined,
          variant: dto.variantId ? { connect: { id: dto.variantId } } : undefined,
          usuario: { connect: { id: usuarioId } },
          observacoes: dto.observacoes?.trim() || null,
          dataInventario,
          itens: {
            create: variants.map((variant) => ({
              variant: { connect: { id: variant.id } },
              quantidadeSistema: variant.inventory?.quantidadeTotal ?? variant.estoque ?? 0,
            })),
          },
        },
        tx,
      );

      return this.toDetailResponse(audit);
    });
  }

  async start(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const audit = await tx.inventoryAudit.findUnique({ where: { id } });
      if (!audit) throw new NotFoundException("Inventário não encontrado");

      if (
        audit.status !== InventoryAuditStatus.RASCUNHO &&
        audit.status !== InventoryAuditStatus.PAUSADO
      ) {
        throw new BadRequestException("Somente inventários em rascunho ou pausados podem ser iniciados");
      }

      const active = await this.repository.findActiveInProgress(tx);
      if (active && active.id !== id) {
        throw new BadRequestException(
          `Já existe um inventário em andamento (${active.nome}). Finalize ou pause-o antes.`,
        );
      }

      const updated = await this.repository.update(
        id,
        { status: InventoryAuditStatus.EM_ANDAMENTO },
        tx,
      );
      return this.toDetailResponse(updated);
    });
  }

  async pause(id: string) {
    const audit = await this.ensureExists(id);
    if (audit.status !== InventoryAuditStatus.EM_ANDAMENTO) {
      throw new BadRequestException("Somente inventários em andamento podem ser pausados");
    }

    const updated = await this.repository.update(id, {
      status: InventoryAuditStatus.PAUSADO,
    });
    return this.toDetailResponse(updated);
  }

  async finish(id: string, usuarioId: string) {
    return this.prisma.$transaction(async (tx) => {
      const audit = await tx.inventoryAudit.findUnique({
        where: { id },
        include: { itens: true },
      });
      if (!audit) throw new NotFoundException("Inventário não encontrado");

      if (
        audit.status !== InventoryAuditStatus.EM_ANDAMENTO &&
        audit.status !== InventoryAuditStatus.PAUSADO
      ) {
        throw new BadRequestException("Somente inventários em andamento ou pausados podem ser finalizados");
      }

      const summary = this.countService.computeSummary(audit.itens);
      if (!summary.contagemCompleta) {
        throw new BadRequestException(
          `Contagem incompleta: ${summary.itensPendentes} item(ns) pendente(s)`,
        );
      }

      await this.adjustmentService.applyAuditAdjustments(audit, usuarioId, tx);

      const updated = await this.repository.update(
        id,
        {
          status: InventoryAuditStatus.FINALIZADO,
          finishedAt: new Date(),
        },
        tx,
      );

      return this.toDetailResponse(updated);
    });
  }

  private async ensureExists(id: string) {
    const audit = await this.repository.findById(id);
    if (!audit) throw new NotFoundException("Inventário não encontrado");
    return audit;
  }

  private validateCreateDto(dto: CreateInventoryAuditDto) {
    switch (dto.tipo) {
      case InventoryAuditType.CATEGORIA:
        if (!dto.categoriaId) throw new BadRequestException("Informe a categoria");
        break;
      case InventoryAuditType.PRODUTO:
        if (!dto.produtoId) throw new BadRequestException("Informe o produto");
        break;
      case InventoryAuditType.VARIANTE:
        if (!dto.variantId) throw new BadRequestException("Informe a variante");
        break;
      case InventoryAuditType.PARCIAL:
        if (!dto.variantIds?.length) {
          throw new BadRequestException("Informe ao menos uma variante para inventário parcial");
        }
        break;
      default:
        break;
    }
  }

  private async resolveVariants(dto: CreateInventoryAuditDto, tx: Prisma.TransactionClient) {
    const baseWhere: Prisma.ProductVariantWhereInput = {
      deletedAt: null,
      ativo: true,
      produto: { ativo: true, deletedAt: null },
    };

    switch (dto.tipo) {
      case InventoryAuditType.CATEGORIA:
        baseWhere.produto = { ativo: true, deletedAt: null, categoriaId: dto.categoriaId };
        break;
      case InventoryAuditType.PRODUTO:
        baseWhere.produtoId = dto.produtoId;
        break;
      case InventoryAuditType.VARIANTE:
        baseWhere.id = dto.variantId;
        break;
      case InventoryAuditType.PARCIAL:
        baseWhere.id = { in: dto.variantIds };
        break;
      default:
        break;
    }

    return tx.productVariant.findMany({
      where: baseWhere,
      include: { inventory: true },
      orderBy: { sku: "asc" },
    });
  }

  private buildWhere(query: ListInventoryAuditsQueryDto): Prisma.InventoryAuditWhereInput {
    const where: Prisma.InventoryAuditWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.tipo) where.tipo = query.tipo;
    if (query.categoriaId) where.categoriaId = query.categoriaId;
    if (query.usuarioId) where.usuarioId = query.usuarioId;

    if (query.dataInicio || query.dataFim) {
      where.dataInventario = {};
      if (query.dataInicio) where.dataInventario.gte = new Date(query.dataInicio);
      if (query.dataFim) {
        const end = new Date(query.dataFim);
        end.setHours(23, 59, 59, 999);
        where.dataInventario.lte = end;
      }
    }

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { nome: { contains: search, mode: "insensitive" } },
        { usuario: { nome: { contains: search, mode: "insensitive" } } },
      ];
    }

    return where;
  }

  private formatVariantLabel(
    atributos: Array<{ attributeValue: { attribute: { nome: string }; valor: string } }>,
  ) {
    if (!atributos.length) return "Padrão";
    return atributos
      .map((item) => `${item.attributeValue.attribute.nome}: ${item.attributeValue.valor}`)
      .join(" / ");
  }

  private toListResponse(
    audit: Awaited<ReturnType<InventoryAuditRepository["findMany"]>>[number],
  ) {
    return {
      id: audit.id,
      numero: audit.numero,
      numeroFormatado: `INV-${String(audit.numero).padStart(5, "0")}`,
      nome: audit.nome,
      tipo: audit.tipo,
      tipoLabel: AUDIT_TYPE_LABELS[audit.tipo],
      status: audit.status,
      statusLabel: AUDIT_STATUS_LABELS[audit.status],
      responsavelNome: audit.usuario.nome,
      categoriaNome: audit.categoria?.nome ?? null,
      produtoNome: audit.produto?.nome ?? null,
      totalItens: audit._count.itens,
      dataInventario: audit.dataInventario,
      createdAt: audit.createdAt,
      finishedAt: audit.finishedAt,
    };
  }

  private toDetailResponse(
    audit: NonNullable<Awaited<ReturnType<InventoryAuditRepository["findById"]>>>,
  ) {
    const summary = this.countService.computeSummary(audit.itens);

    return {
      id: audit.id,
      numero: audit.numero,
      numeroFormatado: `INV-${String(audit.numero).padStart(5, "0")}`,
      nome: audit.nome,
      tipo: audit.tipo,
      tipoLabel: AUDIT_TYPE_LABELS[audit.tipo],
      status: audit.status,
      statusLabel: AUDIT_STATUS_LABELS[audit.status],
      categoriaId: audit.categoriaId,
      categoriaNome: audit.categoria?.nome ?? null,
      produtoId: audit.produtoId,
      produtoNome: audit.produto?.nome ?? null,
      variantId: audit.variantId,
      variantSku: audit.variant?.sku ?? null,
      responsavelId: audit.usuarioId,
      responsavelNome: audit.usuario.nome,
      responsavelEmail: audit.usuario.email,
      observacoes: audit.observacoes,
      dataInventario: audit.dataInventario,
      createdAt: audit.createdAt,
      finishedAt: audit.finishedAt,
      resumo: summary,
      itens: audit.itens.map((item) => ({
        id: item.id,
        variantId: item.variantId,
        produtoNome: item.variant.produto.nome,
        categoriaNome: item.variant.produto.categoria.nome,
        sku: item.variant.sku,
        varianteLabel: this.formatVariantLabel(item.variant.atributos),
        quantidadeSistema: item.quantidadeSistema,
        quantidadeFisica: item.quantidadeFisica,
        diferenca: item.diferenca,
        tipoAjuste: item.tipoAjuste,
        tipoAjusteLabel: item.tipoAjuste ? ADJUSTMENT_TYPE_LABELS[item.tipoAjuste] : null,
        contado: item.contado,
      })),
    };
  }
}
