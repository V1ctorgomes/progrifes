import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, PurchaseOrderStatus, UserRole } from "@prisma/client";
import { hasPermission } from "../../common/permissions/role-permissions";
import { PrismaService } from "../../database/prisma.service";
import {
  CancelPurchaseOrderDto,
  CreatePurchaseOrderDto,
  ListPurchaseOrdersQueryDto,
  PurchaseOrderItemDto,
  UpdatePurchaseOrderDto,
  UpdatePurchaseOrderStatusDto,
} from "./dto/purchase-order.dto";
import { PurchaseOrderHistoryService } from "./purchase-order-history.service";
import {
  getNextStatuses,
  getStatusDescription,
  getStatusMeta,
  getStatusTimestampField,
  PURCHASE_ORDER_STATUS_META,
  requiresApproval,
} from "./purchase-order-status.config";
import {
  PurchaseOrdersRepository,
  PurchaseOrderWithRelations,
} from "./purchase-orders.repository";

type PreparedItem = {
  productId: string;
  variantId: string;
  produtoNome: string;
  sku: string;
  quantidade: number;
  valorUnitario: Prisma.Decimal;
  desconto: Prisma.Decimal;
  subtotal: Prisma.Decimal;
};

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly repository: PurchaseOrdersRepository,
    private readonly prisma: PrismaService,
    private readonly historyService: PurchaseOrderHistoryService,
  ) {}

  getStatusDefinitions() {
    return Object.values(PURCHASE_ORDER_STATUS_META).sort((a, b) => a.ordem - b.ordem);
  }

  async getDashboard() {
    const baseWhere = { deletedAt: null };
    const [rascunho, aguardando, aprovadas, enviadas, recebidas, canceladas] =
      await Promise.all([
        this.repository.countByStatus("RASCUNHO", baseWhere),
        this.repository.countByStatus("AGUARDANDO_APROVACAO", baseWhere),
        this.repository.countByStatus("APROVADA", baseWhere),
        this.repository.countByStatus("ENVIADA", baseWhere),
        this.repository.countByStatus("RECEBIDA", baseWhere),
        this.repository.countByStatus("CANCELADA", baseWhere),
      ]);

    return { rascunho, aguardando, aprovadas, enviadas, recebidas, canceladas };
  }

  async findAll(query: ListPurchaseOrdersQueryDto) {
    const where = this.buildWhere(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.repository.findMany(where, skip, limit),
      this.repository.count(where),
    ]);

    return {
      data: items.map((order) => this.toListResponse(order)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const order = await this.repository.findById(id);
    if (!order) {
      throw new NotFoundException("Ordem de compra não encontrada");
    }
    return this.toDetailResponse(order);
  }

  async getHistory(id: string) {
    await this.ensureExists(id);
    const entries = await this.historyService.findByOrderId(id);
    return entries.map((entry) => ({
      id: entry.id,
      status: entry.status,
      statusLabel: getStatusMeta(entry.status).nome,
      descricao: entry.descricao,
      usuario: entry.usuario
        ? { id: entry.usuario.id, nome: entry.usuario.nome, email: entry.usuario.email }
        : null,
      createdAt: entry.createdAt.toISOString(),
    }));
  }

  async create(dto: CreatePurchaseOrderDto, usuarioId?: string) {
    await this.ensureActiveSupplier(dto.supplierId);
    const preparedItems = await this.prepareItems(dto.itens);
    const totals = this.calculateTotals(
      preparedItems,
      dto.frete ?? 0,
      dto.desconto ?? 0,
    );

    const order = await this.prisma.$transaction(async (tx) => {
      const numero = await this.repository.getNextNumero(tx);

      const created = await tx.purchaseOrder.create({
        data: {
          numero,
          supplierId: dto.supplierId,
          status: "RASCUNHO",
          data: new Date(dto.data),
          previsaoEntrega: new Date(dto.previsaoEntrega),
          frete: totals.frete,
          desconto: totals.desconto,
          subtotal: totals.subtotal,
          total: totals.total,
          pedidoFornecedor: dto.pedidoFornecedor?.trim() || null,
          observacoes: dto.observacoes?.trim() || null,
          usuarioId: usuarioId ?? null,
          itens: {
            create: preparedItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              produtoNome: item.produtoNome,
              sku: item.sku,
              quantidade: item.quantidade,
              valorUnitario: item.valorUnitario,
              desconto: item.desconto,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          supplier: {
            select: {
              id: true,
              razaoSocial: true,
              nomeFantasia: true,
              cnpj: true,
              telefone: true,
              email: true,
              endereco: true,
            },
          },
          usuario: { select: { id: true, nome: true, email: true } },
          itens: {
            include: {
              product: { select: { id: true, nome: true } },
              variant: { select: { id: true, sku: true } },
            },
          },
        },
      });

      await this.historyService.recordStatusChange(
        created.id,
        "RASCUNHO",
        usuarioId,
        "Ordem de compra criada",
        tx,
      );

      return created;
    });

    return this.toDetailResponse(order);
  }

  async update(id: string, dto: UpdatePurchaseOrderDto) {
    const current = await this.ensureExists(id);

    if (current.status !== "RASCUNHO") {
      throw new BadRequestException("Apenas ordens em rascunho podem ser editadas");
    }

    const supplierId = dto.supplierId ?? current.supplierId;
    if (dto.supplierId) {
      await this.ensureActiveSupplier(dto.supplierId);
    }

    let preparedItems: PreparedItem[] | undefined;
    if (dto.itens) {
      preparedItems = await this.prepareItems(dto.itens);
    }

    const frete = dto.frete ?? Number(current.frete);
    const desconto = dto.desconto ?? Number(current.desconto);
    const itemsForTotals =
      preparedItems ??
      current.itens.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        produtoNome: item.produtoNome,
        sku: item.sku,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
        desconto: item.desconto,
        subtotal: item.subtotal,
      }));

    const totals = this.calculateTotals(itemsForTotals, frete, desconto);

    const order = await this.prisma.$transaction(async (tx) => {
      if (preparedItems) {
        await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
      }

      const updated = await tx.purchaseOrder.update({
        where: { id },
        data: {
          supplierId,
          data: dto.data ? new Date(dto.data) : undefined,
          previsaoEntrega: dto.previsaoEntrega ? new Date(dto.previsaoEntrega) : undefined,
          frete: totals.frete,
          desconto: totals.desconto,
          subtotal: totals.subtotal,
          total: totals.total,
          pedidoFornecedor:
            dto.pedidoFornecedor === undefined
              ? undefined
              : dto.pedidoFornecedor?.trim() || null,
          observacoes:
            dto.observacoes === undefined ? undefined : dto.observacoes?.trim() || null,
          ...(preparedItems
            ? {
                itens: {
                  create: preparedItems.map((item) => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    produtoNome: item.produtoNome,
                    sku: item.sku,
                    quantidade: item.quantidade,
                    valorUnitario: item.valorUnitario,
                    desconto: item.desconto,
                    subtotal: item.subtotal,
                  })),
                },
              }
            : {}),
        },
        include: {
          supplier: {
            select: {
              id: true,
              razaoSocial: true,
              nomeFantasia: true,
              cnpj: true,
              telefone: true,
              email: true,
              endereco: true,
            },
          },
          usuario: { select: { id: true, nome: true, email: true } },
          itens: {
            include: {
              product: { select: { id: true, nome: true } },
              variant: { select: { id: true, sku: true } },
            },
          },
        },
      });

      return updated;
    });

    return this.toDetailResponse(order);
  }

  async updateStatus(
    id: string,
    dto: UpdatePurchaseOrderStatusDto,
    usuarioId?: string,
    userRole?: UserRole,
  ) {
    const order = await this.ensureExists(id);

    if (order.status === "CANCELADA" || order.status === "RECEBIDA") {
      throw new BadRequestException("Não é possível alterar o status desta ordem");
    }

    const allowed = getNextStatuses(order.status);
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException("Transição de status inválida");
    }

    if (requiresApproval(dto.status)) {
      if (!userRole || !hasPermission(userRole, "purchases:approve")) {
        throw new ForbiddenException("Usuário não autorizado a aprovar ordens de compra");
      }
    }

    if (dto.status === "AGUARDANDO_APROVACAO" && order.itens.length === 0) {
      throw new BadRequestException("A ordem deve possuir ao menos um item");
    }

    const timestampField = getStatusTimestampField(dto.status);
    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await this.repository.update(
        id,
        {
          status: dto.status,
          ...(timestampField ? { [timestampField]: now } : {}),
        },
        tx,
      );

      await this.historyService.recordStatusChange(
        id,
        dto.status,
        usuarioId,
        getStatusDescription(dto.status),
        tx,
      );

      return result;
    });

    return this.toDetailResponse(updated);
  }

  async cancel(id: string, dto: CancelPurchaseOrderDto, usuarioId?: string) {
    const order = await this.ensureExists(id);

    if (order.status === "CANCELADA") {
      throw new BadRequestException("Ordem já está cancelada");
    }

    if (order.status === "RECEBIDA") {
      throw new BadRequestException("Não é possível cancelar uma ordem recebida");
    }

    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await this.repository.update(
        id,
        {
          status: "CANCELADA",
          motivoCancelamento: dto.motivo.trim(),
          canceladaEm: now,
        },
        tx,
      );

      await this.historyService.recordStatusChange(
        id,
        "CANCELADA",
        usuarioId,
        `Ordem cancelada: ${dto.motivo.trim()}`,
        tx,
      );

      return result;
    });

    return this.toDetailResponse(updated);
  }

  async remove(id: string) {
    const order = await this.ensureExists(id);

    if (order.status !== "RASCUNHO") {
      throw new BadRequestException("Apenas ordens em rascunho podem ser excluídas");
    }

    await this.repository.softDelete(id);
    return { message: "Ordem de compra removida com sucesso" };
  }

  async duplicate(id: string, usuarioId?: string) {
    const source = await this.ensureExists(id);

    const order = await this.prisma.$transaction(async (tx) => {
      const numero = await this.repository.getNextNumero(tx);

      const created = await tx.purchaseOrder.create({
        data: {
          numero,
          supplierId: source.supplierId,
          status: "RASCUNHO",
          data: new Date(),
          previsaoEntrega: source.previsaoEntrega,
          frete: source.frete,
          desconto: source.desconto,
          subtotal: source.subtotal,
          total: source.total,
          pedidoFornecedor: null,
          observacoes: source.observacoes
            ? `Cópia de ${this.formatNumero(source.numero)}. ${source.observacoes}`
            : `Cópia de ${this.formatNumero(source.numero)}`,
          usuarioId: usuarioId ?? null,
          itens: {
            create: source.itens.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              produtoNome: item.produtoNome,
              sku: item.sku,
              quantidade: item.quantidade,
              valorUnitario: item.valorUnitario,
              desconto: item.desconto,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          supplier: {
            select: {
              id: true,
              razaoSocial: true,
              nomeFantasia: true,
              cnpj: true,
              telefone: true,
              email: true,
              endereco: true,
            },
          },
          usuario: { select: { id: true, nome: true, email: true } },
          itens: {
            include: {
              product: { select: { id: true, nome: true } },
              variant: { select: { id: true, sku: true } },
            },
          },
        },
      });

      await this.historyService.recordStatusChange(
        created.id,
        "RASCUNHO",
        usuarioId,
        `Ordem duplicada a partir de ${this.formatNumero(source.numero)}`,
        tx,
      );

      return created;
    });

    return this.toDetailResponse(order);
  }

  private buildWhere(query: ListPurchaseOrdersQueryDto): Prisma.PurchaseOrderWhereInput {
    const where: Prisma.PurchaseOrderWhereInput = { deletedAt: null };

    if (query.status) {
      where.status = query.status;
    }

    if (query.supplierId) {
      where.supplierId = query.supplierId;
    }

    if (query.usuarioId) {
      where.usuarioId = query.usuarioId;
    }

    if (query.dataInicio || query.dataFim) {
      where.data = {};
      if (query.dataInicio) {
        where.data.gte = new Date(query.dataInicio);
      }
      if (query.dataFim) {
        const end = new Date(query.dataFim);
        end.setHours(23, 59, 59, 999);
        where.data.lte = end;
      }
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      const numero = Number(term.replace(/\D/g, ""));

      where.OR = [
        { pedidoFornecedor: { contains: term, mode: "insensitive" } },
        {
          supplier: {
            OR: [
              { razaoSocial: { contains: term, mode: "insensitive" } },
              { nomeFantasia: { contains: term, mode: "insensitive" } },
            ],
          },
        },
        {
          itens: {
            some: {
              OR: [
                { produtoNome: { contains: term, mode: "insensitive" } },
                { sku: { contains: term, mode: "insensitive" } },
              ],
            },
          },
        },
      ];

      if (Number.isFinite(numero) && numero > 0) {
        where.OR.push({ numero });
      }

      if (term.toUpperCase().startsWith("OC-")) {
        const ocNumero = Number(term.replace(/\D/g, ""));
        if (Number.isFinite(ocNumero) && ocNumero > 0) {
          where.OR.push({ numero: ocNumero });
        }
      }
    }

    return where;
  }

  private async ensureExists(id: string) {
    const order = await this.repository.findById(id);
    if (!order) {
      throw new NotFoundException("Ordem de compra não encontrada");
    }
    return order;
  }

  private async ensureActiveSupplier(supplierId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, deletedAt: null, ativo: true },
    });
    if (!supplier) {
      throw new BadRequestException("Fornecedor inválido ou inativo");
    }
  }

  private async prepareItems(items: PurchaseOrderItemDto[]): Promise<PreparedItem[]> {
    if (!items.length) {
      throw new BadRequestException("Informe ao menos um item na ordem");
    }

    const prepared: PreparedItem[] = [];

    for (const item of items) {
      const variant = await this.prisma.productVariant.findFirst({
        where: { id: item.variantId, deletedAt: null, ativo: true },
        include: { produto: true },
      });

      if (!variant || variant.produtoId !== item.productId) {
        throw new BadRequestException("Variante de produto inválida");
      }

      const valorUnitario = new Prisma.Decimal(item.valorUnitario);
      const desconto = new Prisma.Decimal(item.desconto ?? 0);
      const bruto = valorUnitario.mul(item.quantidade);
      const subtotal = bruto.sub(desconto);

      if (subtotal.lessThan(0)) {
        throw new BadRequestException("Subtotal do item não pode ser negativo");
      }

      prepared.push({
        productId: variant.produtoId,
        variantId: variant.id,
        produtoNome: variant.produto.nome,
        sku: variant.sku,
        quantidade: item.quantidade,
        valorUnitario,
        desconto,
        subtotal,
      });
    }

    return prepared;
  }

  private calculateTotals(
    items: Array<{ subtotal: Prisma.Decimal }>,
    frete: number,
    desconto: number,
  ) {
    const subtotal = items.reduce(
      (sum, item) => sum.add(item.subtotal),
      new Prisma.Decimal(0),
    );
    const freteDecimal = new Prisma.Decimal(frete);
    const descontoDecimal = new Prisma.Decimal(desconto);
    const total = subtotal.add(freteDecimal).sub(descontoDecimal);

    if (total.lessThan(0)) {
      throw new BadRequestException("Total da ordem não pode ser negativo");
    }

    return {
      subtotal,
      frete: freteDecimal,
      desconto: descontoDecimal,
      total,
    };
  }

  formatNumero(numero: number) {
    return `OC-${String(numero).padStart(6, "0")}`;
  }

  private toListResponse(order: PurchaseOrderWithRelations) {
    const meta = getStatusMeta(order.status);
    return {
      id: order.id,
      numero: order.numero,
      numeroFormatado: this.formatNumero(order.numero),
      supplierId: order.supplierId,
      fornecedorNome: order.supplier.nomeFantasia,
      fornecedorRazaoSocial: order.supplier.razaoSocial,
      status: order.status,
      statusLabel: meta.nome,
      statusCor: meta.cor,
      data: order.data.toISOString(),
      previsaoEntrega: order.previsaoEntrega.toISOString(),
      subtotal: Number(order.subtotal),
      total: Number(order.total),
      pedidoFornecedor: order.pedidoFornecedor,
      responsavel: order.usuario
        ? { id: order.usuario.id, nome: order.usuario.nome }
        : null,
      itensCount: order.itens.length,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  private toDetailResponse(order: PurchaseOrderWithRelations) {
    const meta = getStatusMeta(order.status);
    const nextStatuses = getNextStatuses(order.status).map((status) => getStatusMeta(status));

    return {
      ...this.toListResponse(order),
      frete: Number(order.frete),
      desconto: Number(order.desconto),
      observacoes: order.observacoes,
      motivoCancelamento: order.motivoCancelamento,
      aprovadaEm: order.aprovadaEm?.toISOString() ?? null,
      enviadaEm: order.enviadaEm?.toISOString() ?? null,
      recebidaEm: order.recebidaEm?.toISOString() ?? null,
      canceladaEm: order.canceladaEm?.toISOString() ?? null,
      canEdit: order.status === "RASCUNHO",
      nextStatuses,
      fornecedor: {
        id: order.supplier.id,
        razaoSocial: order.supplier.razaoSocial,
        nomeFantasia: order.supplier.nomeFantasia,
        cnpj: order.supplier.cnpj,
        telefone: order.supplier.telefone,
        email: order.supplier.email,
        endereco: order.supplier.endereco,
      },
      itens: order.itens.map((item) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        produtoNome: item.produtoNome,
        sku: item.sku,
        quantidade: item.quantidade,
        valorUnitario: Number(item.valorUnitario),
        desconto: Number(item.desconto),
        subtotal: Number(item.subtotal),
      })),
    };
  }
}
