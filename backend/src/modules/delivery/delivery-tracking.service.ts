import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import { DeliveryStatus, OrderStatus, PaymentMethod, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { OrdersService } from "../orders/orders.service";
import { DeliveryPersonService } from "./delivery-person.service";
import {
  AssignDeliveryPersonToDeliveryDto,
  ListDeliveriesQueryDto,
  UpdateDeliveryStatusDto,
} from "./dto/delivery-tracking.dto";
import { DeliveryTrackingRepository } from "./delivery-tracking.repository";
import {
  getDeliveryStatusDescription,
  getDeliveryStatusMeta,
  getNextDeliveryStatuses,
  mapDeliveryRecord,
  mapDeliveryStatusToOrderStatus,
  mapOrderStatusToDeliveryStatus,
} from "./delivery-tracking.utils";

type DashboardCache = {
  data: Awaited<ReturnType<DeliveryTrackingService["buildDashboard"]>>;
  expiresAt: number;
};

@Injectable()
export class DeliveryTrackingService {
  private dashboardCache: DashboardCache | null = null;
  private readonly cacheTtlMs = 60_000;

  constructor(
    private readonly repository: DeliveryTrackingRepository,
    private readonly prisma: PrismaService,
    private readonly deliveryPersonService: DeliveryPersonService,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
  ) {}

  async findAll(query: ListDeliveriesQueryDto) {
    const where = this.buildWhere(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.repository.findMany(where, skip, limit, { createdAt: "desc" }),
      this.repository.count(where),
    ]);

    return {
      data: items.map((item) => mapDeliveryRecord(item)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const delivery = await this.ensureExists(id);
    const history = await this.repository.findHistory(id);

    return {
      ...mapDeliveryRecord(delivery),
      history: history.map((entry) => ({
        id: entry.id,
        status: entry.status,
        statusLabel: getDeliveryStatusMeta(entry.status).nome,
        notes: entry.notes,
        usuario: entry.usuario,
        createdAt: entry.createdAt,
      })),
    };
  }

  async getDashboard() {
    const now = Date.now();
    if (this.dashboardCache && now < this.dashboardCache.expiresAt) {
      return this.dashboardCache.data;
    }

    const data = await this.buildDashboard();
    this.dashboardCache = { data, expiresAt: now + this.cacheTtlMs };
    return data;
  }

  async updateStatus(id: string, dto: UpdateDeliveryStatusDto, usuarioId?: string) {
    const delivery = await this.ensureExists(id);

    if (delivery.status === "ENTREGUE" || delivery.status === "CANCELADO") {
      throw new BadRequestException("Não é possível alterar o status desta entrega");
    }

    const allowed = getNextDeliveryStatuses(delivery.status);
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException("Transição de status inválida");
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await this.repository.update(
        id,
        {
          status: dto.status,
          ...(dto.status === "SAIU_PARA_ENTREGA" ? { leftForDeliveryAt: now } : {}),
          ...(dto.status === "ENTREGUE" ? { deliveredAt: now } : {}),
        },
        tx,
      );

      await this.repository.recordHistory(
        {
          deliveryId: id,
          status: dto.status,
          usuarioId,
          notes: dto.notes?.trim() || null,
        },
        tx,
      );

      if (dto.status === "CANCELADO") {
        await this.ordersService.cancelInTransaction(
          delivery.orderId,
          dto.notes?.trim() || "Cancelado via painel de entregas",
          usuarioId,
          tx,
        );
        return;
      }

      const targetOrderStatus = mapDeliveryStatusToOrderStatus(dto.status);
      if (targetOrderStatus) {
        await this.ordersService.syncToOrderStatus(
          delivery.orderId,
          targetOrderStatus,
          usuarioId,
          tx,
        );
      }
    });

    this.invalidateCache();
    return this.findById(id);
  }

  async assignDeliveryPerson(
    id: string,
    dto: AssignDeliveryPersonToDeliveryDto,
    usuarioId?: string,
  ) {
    const delivery = await this.ensureExists(id);

    await this.deliveryPersonService.assignToOrder(
      delivery.orderId,
      dto.deliveryPersonId,
      usuarioId,
    );

    await this.repository.update(id, {
      deliveryPerson: dto.deliveryPersonId
        ? { connect: { id: dto.deliveryPersonId } }
        : { disconnect: true },
    });

    this.invalidateCache();
    return this.findById(id);
  }

  async createForOrder(
    order: {
      id: string;
      deliveryPersonId: string | null;
      prazoEntregaMinutos: number | null;
    },
    tx: Prisma.TransactionClient,
    usuarioId?: string,
  ) {
    const created = await this.repository.create(
      {
        orderId: order.id,
        deliveryPersonId: order.deliveryPersonId,
        estimatedDeliveryTime: order.prazoEntregaMinutos,
        status: DeliveryStatus.PEDIDO_RECEBIDO,
      },
      tx,
    );

    await this.repository.recordHistory(
      {
        deliveryId: created.id,
        status: DeliveryStatus.PEDIDO_RECEBIDO,
        usuarioId,
        notes: "Pedido criado",
      },
      tx,
    );

    this.invalidateCache();
    return created;
  }

  async syncFromOrder(
    orderId: string,
    orderStatus: OrderStatus,
    tx: Prisma.TransactionClient,
    usuarioId?: string,
    notes?: string,
  ) {
    const delivery = await tx.delivery.findUnique({ where: { orderId } });
    if (!delivery) return;

    const nextStatus = mapOrderStatusToDeliveryStatus(orderStatus);
    if (delivery.status === nextStatus) return;

    const now = new Date();

    await tx.delivery.update({
      where: { id: delivery.id },
      data: {
        status: nextStatus,
        ...(nextStatus === DeliveryStatus.SAIU_PARA_ENTREGA
          ? { leftForDeliveryAt: delivery.leftForDeliveryAt ?? now }
          : {}),
        ...(nextStatus === DeliveryStatus.ENTREGUE
          ? { deliveredAt: delivery.deliveredAt ?? now }
          : {}),
      },
    });

    await this.repository.recordHistory(
      {
        deliveryId: delivery.id,
        status: nextStatus,
        usuarioId,
        notes: notes ?? getDeliveryStatusDescription(nextStatus),
      },
      tx,
    );

    this.invalidateCache();
  }

  async syncDeliveryPersonFromOrder(
    orderId: string,
    deliveryPersonId: string | null,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    const delivery = await client.delivery.findUnique({ where: { orderId } });
    if (!delivery) return;

    await client.delivery.update({
      where: { id: delivery.id },
      data: {
        deliveryPerson: deliveryPersonId
          ? { connect: { id: deliveryPersonId } }
          : { disconnect: true },
      },
    });

    this.invalidateCache();
  }

  private async buildDashboard() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const openStatuses: DeliveryStatus[] = [
      DeliveryStatus.PEDIDO_RECEBIDO,
      DeliveryStatus.EM_SEPARACAO,
      DeliveryStatus.PRONTO_PARA_ENTREGA,
    ];

    const [
      entregasHoje,
      entregasEmAberto,
      entregasEmAndamento,
      entregasConcluidas,
      entregasCanceladas,
      completedDeliveries,
      ranking,
    ] = await Promise.all([
      this.repository.count({ createdAt: { gte: start } }),
      this.repository.count({ status: { in: openStatuses } }),
      this.repository.count({ status: DeliveryStatus.SAIU_PARA_ENTREGA }),
      this.repository.count({ status: DeliveryStatus.ENTREGUE }),
      this.repository.count({ status: DeliveryStatus.CANCELADO }),
      this.prisma.delivery.findMany({
        where: {
          status: DeliveryStatus.ENTREGUE,
          deliveredAt: { not: null },
          leftForDeliveryAt: { not: null },
        },
        select: { leftForDeliveryAt: true, deliveredAt: true },
      }),
      this.prisma.delivery.groupBy({
        by: ["deliveryPersonId"],
        where: {
          status: DeliveryStatus.ENTREGUE,
          deliveryPersonId: { not: null },
        },
        _count: { _all: true },
        orderBy: { _count: { deliveryPersonId: "desc" } },
        take: 1,
      }),
    ]);

    const averageMinutes =
      completedDeliveries.length > 0
        ? Math.round(
            completedDeliveries.reduce((sum, delivery) => {
              const startAt = delivery.leftForDeliveryAt!.getTime();
              const endAt = delivery.deliveredAt!.getTime();
              return sum + (endAt - startAt) / 60_000;
            }, 0) / completedDeliveries.length,
          )
        : 0;

    let entregadorComMaisEntregas: {
      id: string;
      name: string;
      total: number;
    } | null = null;

    if (ranking[0]?.deliveryPersonId) {
      const person = await this.prisma.deliveryPerson.findFirst({
        where: { id: ranking[0].deliveryPersonId, deletedAt: null },
      });
      if (person) {
        entregadorComMaisEntregas = {
          id: person.id,
          name: person.name,
          total: ranking[0]._count._all,
        };
      }
    }

    return {
      entregasHoje,
      entregasEmAberto,
      entregasEmAndamento,
      entregasConcluidas,
      entregasCanceladas,
      tempoMedioEntregaMinutos: averageMinutes,
      entregadorComMaisEntregas,
    };
  }

  private buildWhere(query: ListDeliveriesQueryDto): Prisma.DeliveryWhereInput {
    const where: Prisma.DeliveryWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.deliveryPersonId) where.deliveryPersonId = query.deliveryPersonId;

    if (query.bairro?.trim()) {
      where.order = {
        bairro: { contains: query.bairro.trim(), mode: "insensitive" },
      };
    }

    if (query.formaPagamento) {
      where.order = {
        ...(where.order as Prisma.OrderWhereInput | undefined),
        formaPagamento: query.formaPagamento as PaymentMethod,
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
      const numero = Number(term.replace("#", ""));
      where.order = {
        ...(where.order as Prisma.OrderWhereInput | undefined),
        OR: [
          { clienteNome: { contains: term, mode: "insensitive" } },
          { clienteTelefone: { contains: term, mode: "insensitive" } },
          ...(Number.isFinite(numero) ? [{ numero }] : []),
          {
            deliveryPerson: {
              name: { contains: term, mode: "insensitive" },
            },
          },
        ],
      };
    }

    return where;
  }

  private async ensureExists(id: string) {
    const delivery = await this.repository.findById(id);
    if (!delivery) {
      throw new NotFoundException("Entrega não encontrada");
    }
    return delivery;
  }

  private invalidateCache() {
    this.dashboardCache = null;
  }
}
