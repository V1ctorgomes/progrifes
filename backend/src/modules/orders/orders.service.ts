import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Order, OrderItem, OrderStatus, PaymentMethod, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import {
  CancelOrderDto,
  CreateOrderDto,
  ListOrdersQueryDto,
  UpdateOrderStatusDto,
} from "./dto/order.dto";
import { OrderHistoryService } from "./order-history.service";
import { InventoryService } from "../inventory/inventory.service";
import { CustomersService } from "../customers/customers.service";
import {
  getNextStatuses,
  getStatusDescription,
  getStatusMeta,
  getStatusTimestampField,
  ORDER_STATUS_META,
} from "./order-status.config";
import { OrdersRepository } from "./orders.repository";

type OrderItemWithVariant = OrderItem & {
  variant: { imagens: Array<{ url: string }> };
};

type OrderWithItems = Order & { itens: OrderItemWithVariant[] };

@Injectable()
export class OrdersService {
  constructor(
    private readonly repository: OrdersRepository,
    private readonly prisma: PrismaService,
    private readonly historyService: OrderHistoryService,
    private readonly customersService: CustomersService,
    private readonly inventoryService: InventoryService,
  ) {}

  getStatusDefinitions() {
    return Object.values(ORDER_STATUS_META).sort((a, b) => a.ordem - b.ordem);
  }

  async getDashboard() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const [pedidosHoje, aguardando, separando, saiuEntrega, entregues, cancelados] =
      await Promise.all([
        this.repository.count({ createdAt: { gte: start } }),
        this.repository.countByStatus("AGUARDANDO_CONFIRMACAO"),
        this.repository.countByStatus("SEPARANDO"),
        this.repository.countByStatus("SAIU_PARA_ENTREGA"),
        this.repository.countByStatus("ENTREGUE"),
        this.repository.countByStatus("CANCELADO"),
      ]);

    return {
      pedidosHoje,
      aguardando,
      separando,
      saiuEntrega,
      entregues,
      cancelados,
    };
  }

  async findAllAdmin(query: ListOrdersQueryDto) {
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
      data: items.map((order) => this.toListResponse(order)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const order = await this.repository.findById(id);
    if (!order) {
      throw new NotFoundException("Pedido não encontrado");
    }
    return this.toDetailResponse(order);
  }

  async findByNumero(numero: number) {
    const order = await this.repository.findByNumero(numero);
    if (!order) {
      throw new NotFoundException("Pedido não encontrado");
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
      createdAt: entry.createdAt,
    }));
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, usuarioId?: string) {
    const order = await this.ensureExists(id);

    if (order.status === "CANCELADO" || order.status === "ENTREGUE") {
      throw new BadRequestException("Não é possível alterar o status deste pedido");
    }

    const allowed = getNextStatuses(order.status);
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException("Transição de status inválida");
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

      if (dto.status === "ENTREGUE") {
        const orderItems = await tx.orderItem.findMany({ where: { orderId: id } });
        await this.inventoryService.finalizeForOrder(
          id,
          orderItems.map((item) => ({
            variantId: item.variantId,
            quantidade: item.quantidade,
            produtoNome: item.produtoNome,
            sku: item.sku,
          })),
          tx,
        );
      }

      return result;
    });

    return this.toDetailResponse(updated);
  }

  async cancel(id: string, dto: CancelOrderDto, usuarioId?: string) {
    const order = await this.ensureExists(id);

    if (order.status === "CANCELADO") {
      throw new BadRequestException("Pedido já está cancelado");
    }

    if (order.status === "ENTREGUE") {
      throw new BadRequestException("Não é possível cancelar um pedido entregue");
    }

    const now = new Date();

    const orderItems = order.itens;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await this.repository.update(
        id,
        {
          status: "CANCELADO",
          motivoCancelamento: dto.motivo.trim(),
          canceladoEm: now,
        },
        tx,
      );

      await this.historyService.recordStatusChange(
        id,
        "CANCELADO",
        usuarioId,
        `Pedido cancelado: ${dto.motivo.trim()}`,
        tx,
      );

      await this.inventoryService.releaseForOrder(
        id,
        orderItems.map((item) => ({
          variantId: item.variantId,
          quantidade: item.quantidade,
          produtoNome: item.produtoNome,
          sku: item.sku,
        })),
        tx,
      );

      return result;
    });

    return this.toDetailResponse(updated);
  }

  async create(dto: CreateOrderDto) {
    const order = await this.prisma.$transaction(async (tx) => {
      const preparedItems = await this.prepareItems(dto.itens, tx);
      const subtotal = preparedItems.reduce((sum, item) => sum + item.subtotal, 0);
      const taxaEntrega = 0;
      const total = subtotal + taxaEntrega;
      const numero = await this.repository.getNextNumero(tx);

      const customer = await this.customersService.upsertFromCheckout(
        {
          nome: dto.clienteNome,
          telefone: dto.clienteTelefone,
          email: dto.clienteEmail,
          cep: dto.cep,
          rua: dto.rua,
          numero: dto.numeroEndereco,
          bairro: dto.bairro,
          cidade: dto.cidade,
          estado: dto.estado,
          complemento: dto.complemento,
          referencia: dto.referencia,
        },
        tx,
      );

      const created = await tx.order.create({
        data: {
          numero,
          customerId: customer.id,
          clienteNome: dto.clienteNome.trim(),
          clienteTelefone: dto.clienteTelefone.trim(),
          clienteEmail: dto.clienteEmail?.trim() || null,
          cep: dto.cep.trim(),
          rua: dto.rua.trim(),
          numeroEndereco: dto.numeroEndereco.trim(),
          bairro: dto.bairro.trim(),
          cidade: dto.cidade.trim(),
          estado: dto.estado.trim().toUpperCase(),
          complemento: dto.complemento?.trim() || null,
          referencia: dto.referencia?.trim() || null,
          formaPagamento: dto.formaPagamento,
          trocoPara: dto.trocoPara ?? null,
          observacoes: dto.observacoes?.trim() || null,
          subtotal,
          taxaEntrega,
          total,
          itens: {
            create: preparedItems.map((item) => ({
              produtoId: item.produtoId,
              variantId: item.variantId,
              produtoNome: item.produtoNome,
              sku: item.sku,
              cor: item.cor,
              tamanho: item.tamanho,
              quantidade: item.quantidade,
              precoUnitario: item.precoUnitario,
              subtotal: item.subtotal,
            })),
          },
        },
        include: orderInclude,
      });

      await this.historyService.recordStatusChange(
        created.id,
        "AGUARDANDO_CONFIRMACAO",
        null,
        "Pedido criado",
        tx,
      );

      await this.inventoryService.reserveForOrder(
        created.id,
        preparedItems.map((item) => ({
          variantId: item.variantId,
          quantidade: item.quantidade,
          produtoNome: item.produtoNome,
          sku: item.sku,
        })),
        tx,
      );

      return created;
    });

    const response = this.toDetailResponse(order);
    return {
      ...response,
      whatsappUrl: this.buildWhatsAppUrl(response),
      whatsappMessage: this.buildWhatsAppMessage(response),
    };
  }

  private buildWhere(query: ListOrdersQueryDto): Prisma.OrderWhereInput {
    const where: Prisma.OrderWhereInput = {};

    if (query.search) {
      const search = query.search.trim();
      const numero = Number(search.replace("#", ""));
      where.OR = [
        { clienteNome: { contains: search, mode: "insensitive" } },
        { clienteTelefone: { contains: search, mode: "insensitive" } },
        ...(Number.isFinite(numero) ? [{ numero }] : []),
      ];
    }

    if (query.status) where.status = query.status;
    if (query.formaPagamento) where.formaPagamento = query.formaPagamento;
    if (query.bairro) {
      where.bairro = { contains: query.bairro, mode: "insensitive" };
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

    if (query.valorMin !== undefined || query.valorMax !== undefined) {
      where.total = {};
      if (query.valorMin !== undefined) where.total.gte = query.valorMin;
      if (query.valorMax !== undefined) where.total.lte = query.valorMax;
    }

    return where;
  }

  private buildOrderBy(
    sort?: ListOrdersQueryDto["sort"],
  ): Prisma.OrderOrderByWithRelationInput | Prisma.OrderOrderByWithRelationInput[] {
    switch (sort) {
      case "oldest":
        return { createdAt: "asc" };
      case "total_desc":
        return { total: "desc" };
      case "total_asc":
        return { total: "asc" };
      case "status":
        return { status: "asc" };
      case "recent":
      default:
        return { createdAt: "desc" };
    }
  }

  private async prepareItems(items: CreateOrderDto["itens"], tx: Prisma.TransactionClient) {
    const prepared: Array<{
      produtoId: string;
      variantId: string;
      produtoNome: string;
      sku: string;
      cor: string | null;
      tamanho: string | null;
      quantidade: number;
      precoUnitario: number;
      subtotal: number;
    }> = [];

    for (const item of items) {
      const variant = await tx.productVariant.findFirst({
        where: { id: item.varianteId, deletedAt: null, ativo: true },
        include: {
          produto: true,
          atributos: {
            include: { attributeValue: { include: { attribute: true } } },
          },
        },
      });

      if (!variant || !variant.produto.ativo || variant.produto.deletedAt) {
        throw new BadRequestException(`Variante inválida ou indisponível: ${item.varianteId}`);
      }

      const inventory = await tx.inventory.findUnique({ where: { variantId: variant.id } });
      const disponivel = inventory?.quantidadeDisponivel ?? variant.estoque;

      if (disponivel < item.quantidade) {
        throw new BadRequestException(
          `Estoque insuficiente para ${variant.produto.nome} (${variant.sku}). Disponível: ${disponivel}`,
        );
      }

      const precoUnitario = variant.preco
        ? Number(variant.preco)
        : Number(variant.produto.preco);

      const cor =
        variant.atributos.find((attr) => attr.attributeValue.attribute.nome === "Cor")
          ?.attributeValue.valor ?? null;
      const tamanho =
        variant.atributos.find((attr) => attr.attributeValue.attribute.nome === "Tamanho")
          ?.attributeValue.valor ?? null;

      prepared.push({
        produtoId: variant.produtoId,
        variantId: variant.id,
        produtoNome: variant.produto.nome,
        sku: variant.sku,
        cor,
        tamanho,
        quantidade: item.quantidade,
        precoUnitario,
        subtotal: precoUnitario * item.quantidade,
      });
    }

    return prepared;
  }

  private async ensureExists(id: string) {
    const order = await this.repository.findById(id);
    if (!order) {
      throw new NotFoundException("Pedido não encontrado");
    }
    return order;
  }

  formatNumero(numero: number) {
    return `#${String(numero).padStart(6, "0")}`;
  }

  buildWhatsAppMessage(order: { numeroFormatado: string; clienteNome: string; clienteTelefone: string }) {
    return [
      "Olá!",
      "",
      "Acabei de realizar um pedido pelo site da Grifres.",
      "",
      `Pedido: ${order.numeroFormatado}`,
      "",
      `Nome: ${order.clienteNome}`,
      "",
      `Telefone: ${order.clienteTelefone}`,
      "",
      "Aguardo a confirmação.",
      "",
      "Obrigado!",
    ].join("\n");
  }

  buildWhatsAppUrl(order: { numeroFormatado: string; clienteNome: string; clienteTelefone: string }) {
    const phone = process.env.WHATSAPP_NUMBER ?? process.env.STORE_WHATSAPP ?? "5585989484821";
    const message = this.buildWhatsAppMessage(order);
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  private toListResponse(order: OrderWithItems) {
    const statusMeta = getStatusMeta(order.status);
    const itemCount = order.itens.reduce((sum, item) => sum + item.quantidade, 0);

    return {
      id: order.id,
      customerId: order.customerId,
      numero: order.numero,
      numeroFormatado: this.formatNumero(order.numero),
      clienteNome: order.clienteNome,
      clienteTelefone: order.clienteTelefone,
      formaPagamento: order.formaPagamento,
      total: Number(order.total),
      status: order.status,
      statusLabel: statusMeta.nome,
      statusCor: statusMeta.cor,
      itemCount,
      createdAt: order.createdAt,
    };
  }

  private toDetailResponse(order: OrderWithItems) {
    const statusMeta = getStatusMeta(order.status);
    const nextStatuses = getNextStatuses(order.status).map((status) => getStatusMeta(status));

    return {
      id: order.id,
      customerId: order.customerId,
      numero: order.numero,
      numeroFormatado: this.formatNumero(order.numero),
      clienteNome: order.clienteNome,
      clienteTelefone: order.clienteTelefone,
      clienteEmail: order.clienteEmail,
      cep: order.cep,
      rua: order.rua,
      numeroEndereco: order.numeroEndereco,
      bairro: order.bairro,
      cidade: order.cidade,
      estado: order.estado,
      complemento: order.complemento,
      referencia: order.referencia,
      formaPagamento: order.formaPagamento,
      trocoPara: order.trocoPara ? Number(order.trocoPara) : null,
      observacoes: order.observacoes,
      subtotal: Number(order.subtotal),
      taxaEntrega: Number(order.taxaEntrega),
      total: Number(order.total),
      status: order.status,
      statusLabel: statusMeta.nome,
      statusCor: statusMeta.cor,
      statusDescricao: statusMeta.descricao,
      motivoCancelamento: order.motivoCancelamento,
      confirmadoEm: order.confirmadoEm,
      separadoEm: order.separadoEm,
      prontoEntregaEm: order.prontoEntregaEm,
      saiuEntregaEm: order.saiuEntregaEm,
      entregueEm: order.entregueEm,
      canceladoEm: order.canceladoEm,
      nextStatuses,
      itens: order.itens.map((item) => ({
        id: item.id,
        produtoId: item.produtoId,
        variantId: item.variantId,
        produtoNome: item.produtoNome,
        sku: item.sku,
        cor: item.cor,
        tamanho: item.tamanho,
        quantidade: item.quantidade,
        precoUnitario: Number(item.precoUnitario),
        subtotal: Number(item.subtotal),
        imagem: item.variant?.imagens?.[0]?.url ?? null,
      })),
      itemCount: order.itens.reduce((sum, item) => sum + item.quantidade, 0),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}

const orderInclude = {
  itens: {
    orderBy: { produtoNome: "asc" as const },
    include: {
      variant: {
        include: {
          imagens: { orderBy: { ordem: "asc" as const }, take: 1 },
        },
      },
    },
  },
};
