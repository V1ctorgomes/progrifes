import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InventoryEntryType, InventoryMovementType, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import {
  CreateInventoryEntryDto,
  ListInventoryEntriesQueryDto,
} from "./dto/inventory-entry.dto";
import {
  computeDisponivel,
  computeInventoryStatus,
} from "./inventory-stock.config";
import { InventoryEntryRepository } from "./inventory-entry.repository";
import { InventoryMovementService } from "./inventory-movement.service";

const ENTRY_TYPE_LABELS: Record<InventoryEntryType, string> = {
  COMPRA: "Compra",
  REPOSICAO: "Reposição",
  DEVOLUCAO_CLIENTE: "Devolução de Cliente",
  AJUSTE_POSITIVO: "Ajuste Positivo",
  PRODUCAO: "Produção",
  OUTROS: "Outros",
};

@Injectable()
export class InventoryEntryService {
  constructor(
    private readonly repository: InventoryEntryRepository,
    private readonly movementService: InventoryMovementService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(query: ListInventoryEntriesQueryDto) {
    const where = this.buildWhere(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.repository.findMany(where, skip, limit, { dataEntrada: "desc" }),
      this.repository.count(where),
    ]);

    return {
      data: items.map((item) => this.toListResponse(item)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const entry = await this.repository.findById(id);
    if (!entry) {
      throw new NotFoundException("Entrada de estoque não encontrada");
    }
    return this.toDetailResponse(entry);
  }

  async create(dto: CreateInventoryEntryDto, usuarioId: string) {
    return this.prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findFirst({
        where: { id: dto.variantId, deletedAt: null },
        include: { inventory: true },
      });

      if (!variant) {
        throw new NotFoundException("Variante não encontrada");
      }

      if (!variant.ativo) {
        throw new BadRequestException("Não é possível registrar entrada para variante inativa");
      }

      let inventory = variant.inventory;
      if (!inventory) {
        inventory = await tx.inventory.create({
          data: {
            variant: { connect: { id: variant.id } },
            quantidadeTotal: 0,
            quantidadeReservada: 0,
            quantidadeDisponivel: 0,
            estoqueMinimo: variant.estoqueMinimo,
            status: computeInventoryStatus(0, variant.estoqueMinimo),
          },
        });
      }

      const saldoAnterior = inventory.quantidadeTotal;
      const saldoAtual = saldoAnterior + dto.quantidade;
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

      const numero = await this.repository.getNextNumero(tx);
      const dataEntrada = dto.dataEntrada ? new Date(dto.dataEntrada) : new Date();

      const entry = await this.repository.create(
        {
          numero,
          variant: { connect: { id: variant.id } },
          tipo: dto.tipo,
          quantidade: dto.quantidade,
          valorUnitario: dto.valorUnitario,
          documento: dto.documento?.trim() || null,
          notaFiscal: dto.notaFiscal?.trim() || null,
          fornecedor: dto.fornecedor?.trim() || null,
          observacoes: dto.observacoes?.trim() || null,
          usuario: { connect: { id: usuarioId } },
          dataEntrada,
        },
        tx,
      );

      await this.movementService.record(
        {
          variantId: variant.id,
          tipo: InventoryMovementType.ENTRADA,
          origem: dto.tipo,
          quantidade: dto.quantidade,
          saldoAnterior,
          saldoAtual,
          referenciaId: entry.id,
          entryId: entry.id,
          usuarioId,
          descricao: this.buildMovementDescription(dto),
        },
        tx,
      );

      const refreshed = await tx.inventoryEntry.findUnique({
        where: { id: entry.id },
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
          movimento: true,
        },
      });

      return this.toDetailResponse(refreshed!);
    });
  }

  getEntryTypeLabels() {
    return ENTRY_TYPE_LABELS;
  }

  private buildMovementDescription(dto: CreateInventoryEntryDto) {
    const parts = [`Entrada de estoque — ${ENTRY_TYPE_LABELS[dto.tipo]}`];
    if (dto.documento) parts.push(`Doc: ${dto.documento}`);
    if (dto.observacoes) parts.push(dto.observacoes);
    return parts.join(" | ").slice(0, 500);
  }

  private buildWhere(query: ListInventoryEntriesQueryDto): Prisma.InventoryEntryWhereInput {
    const where: Prisma.InventoryEntryWhereInput = {};

    if (query.tipo) where.tipo = query.tipo;
    if (query.fornecedor) {
      where.fornecedor = { contains: query.fornecedor.trim(), mode: "insensitive" };
    }
    if (query.usuarioId) where.usuarioId = query.usuarioId;

    if (query.dataInicio || query.dataFim) {
      where.dataEntrada = {};
      if (query.dataInicio) where.dataEntrada.gte = new Date(query.dataInicio);
      if (query.dataFim) {
        const end = new Date(query.dataFim);
        end.setHours(23, 59, 59, 999);
        where.dataEntrada.lte = end;
      }
    }

    const variantWhere: Prisma.ProductVariantWhereInput = { deletedAt: null };
    if (query.produtoId) variantWhere.produtoId = query.produtoId;
    if (query.categoriaId) {
      variantWhere.produto = { categoriaId: query.categoriaId };
    }

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { documento: { contains: search, mode: "insensitive" } },
        { notaFiscal: { contains: search, mode: "insensitive" } },
        { fornecedor: { contains: search, mode: "insensitive" } },
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
    } else if (Object.keys(variantWhere).length > 1 || query.produtoId || query.categoriaId) {
      where.variant = variantWhere;
    }

    return where;
  }

  private formatVariantLabel(
    atributos: Array<{ attributeValue: { attribute: { nome: string }; valor: string } }>,
  ) {
    if (!atributos.length) return "Padrão";
    return atributos.map((item) => `${item.attributeValue.attribute.nome}: ${item.attributeValue.valor}`).join(" / ");
  }

  private toListResponse(
    entry: NonNullable<Awaited<ReturnType<InventoryEntryRepository["findById"]>>>,
  ) {
    const variant = entry.variant;
    return {
      id: entry.id,
      numero: entry.numero,
      numeroFormatado: `ENT-${String(entry.numero).padStart(5, "0")}`,
      variantId: entry.variantId,
      produtoId: variant.produtoId,
      produtoNome: variant.produto.nome,
      categoriaNome: variant.produto.categoria.nome,
      sku: variant.sku,
      varianteLabel: this.formatVariantLabel(variant.atributos),
      tipo: entry.tipo,
      tipoLabel: ENTRY_TYPE_LABELS[entry.tipo],
      quantidade: entry.quantidade,
      documento: entry.documento,
      fornecedor: entry.fornecedor,
      usuarioId: entry.usuarioId,
      responsavelNome: entry.usuario?.nome ?? null,
      dataEntrada: entry.dataEntrada,
      createdAt: entry.createdAt,
    };
  }

  private toDetailResponse(
    entry: NonNullable<Awaited<ReturnType<InventoryEntryRepository["findById"]>>>,
  ) {
    const base = this.toListResponse(entry);
    const movimento = entry.movimento;

    return {
      ...base,
      valorUnitario: entry.valorUnitario ? Number(entry.valorUnitario) : null,
      notaFiscal: entry.notaFiscal,
      observacoes: entry.observacoes,
      responsavelEmail: entry.usuario?.email ?? null,
      movimento: movimento
        ? {
            id: movimento.id,
            saldoAnterior: movimento.saldoAnterior,
            saldoAtual: movimento.saldoAtual,
            createdAt: movimento.createdAt,
          }
        : null,
    };
  }
}
