import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DeliveryPersonStatus, OrderStatus, Prisma } from "@prisma/client";
import { isValidPhone } from "../../common/utils/phone";
import { PrismaService } from "../../database/prisma.service";
import {
  CreateDeliveryPersonDto,
  ListDeliveryPersonsQueryDto,
  UpdateDeliveryPersonDto,
} from "./dto/delivery-person.dto";
import { DeliveryPersonRepository } from "./delivery-person.repository";
import {
  DELIVERY_PERSON_STATUS_LABELS,
  mapDeliveryPerson,
  normalizeCpf,
  normalizePhone,
} from "./delivery-person.utils";

@Injectable()
export class DeliveryPersonService {
  private availableCache: ReturnType<typeof mapDeliveryPerson>[] | null = null;
  private availableCacheExpiresAt = 0;
  private readonly cacheTtlMs = 60_000;

  constructor(
    private readonly repository: DeliveryPersonRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(query: ListDeliveryPersonsQueryDto) {
    const where = this.buildWhere(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.repository.findMany(where, skip, limit, { name: "asc" }),
      this.repository.count(where),
    ]);

    const data = await Promise.all(
      items.map(async (item) => ({
        ...mapDeliveryPerson(item),
        stats: await this.getStats(item.id),
      })),
    );

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const person = await this.ensureExists(id);
    const [stats, history] = await Promise.all([
      this.getStats(id),
      this.prisma.deliveryPersonHistory.findMany({
        where: { deliveryPersonId: id },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          usuario: { select: { id: true, nome: true, email: true } },
        },
      }),
    ]);

    return {
      ...mapDeliveryPerson(person),
      stats,
      history: history.map((entry) => ({
        id: entry.id,
        operacao: entry.operacao,
        descricao: entry.descricao,
        usuario: entry.usuario,
        createdAt: entry.createdAt,
      })),
    };
  }

  async getAvailableList() {
    const now = Date.now();
    if (this.availableCache && now < this.availableCacheExpiresAt) {
      return this.availableCache;
    }

    const items = await this.repository.findAvailable();
    const mapped = items.map((item) => mapDeliveryPerson(item));
    this.availableCache = mapped;
    this.availableCacheExpiresAt = now + this.cacheTtlMs;
    return mapped;
  }

  async getDashboard() {
    const [
      entregadoresAtivos,
      entregadoresDisponiveis,
      entregadoresEmRota,
      totalEntregas,
      ranking,
    ] = await Promise.all([
      this.repository.count({
        deletedAt: null,
        status: { not: DeliveryPersonStatus.INATIVO },
      }),
      this.repository.count({
        deletedAt: null,
        status: DeliveryPersonStatus.DISPONIVEL,
      }),
      this.repository.count({
        deletedAt: null,
        status: DeliveryPersonStatus.EM_ENTREGA,
      }),
      this.prisma.order.count({
        where: {
          status: OrderStatus.ENTREGUE,
          deliveryPersonId: { not: null },
        },
      }),
      this.prisma.order.groupBy({
        by: ["deliveryPersonId"],
        where: {
          status: OrderStatus.ENTREGUE,
          deliveryPersonId: { not: null },
        },
        _count: { _all: true },
        orderBy: { _count: { deliveryPersonId: "desc" } },
        take: 1,
      }),
    ]);

    let entregadorComMaisEntregas: {
      id: string;
      name: string;
      total: number;
    } | null = null;

    if (ranking[0]?.deliveryPersonId) {
      const person = await this.repository.findById(ranking[0].deliveryPersonId);
      if (person) {
        entregadorComMaisEntregas = {
          id: person.id,
          name: person.name,
          total: ranking[0]._count._all,
        };
      }
    }

    return {
      entregadoresAtivos,
      entregadoresDisponiveis,
      entregadoresEmRota,
      totalEntregas,
      entregadorComMaisEntregas,
    };
  }

  async create(dto: CreateDeliveryPersonDto, usuarioId?: string) {
    const phone = this.resolvePhone(dto.phone);
    const cpf = normalizeCpf(dto.cpf);
    await this.ensureCpfAvailable(cpf);

    const person = await this.prisma.$transaction(async (tx) => {
      const created = await tx.deliveryPerson.create({
        data: {
          name: dto.name.trim(),
          phone,
          cpf,
          document: dto.document?.trim() || null,
          status: dto.status ?? DeliveryPersonStatus.DISPONIVEL,
          notes: dto.notes?.trim() || null,
        },
      });

      await tx.deliveryPersonHistory.create({
        data: {
          deliveryPersonId: created.id,
          operacao: "CRIACAO",
          descricao: `Entregador ${created.name} cadastrado`,
          usuarioId,
        },
      });

      return created;
    });

    this.invalidateCache();
    return mapDeliveryPerson(person);
  }

  async update(id: string, dto: UpdateDeliveryPersonDto, usuarioId?: string) {
    const current = await this.ensureExists(id);
    const phone = dto.phone !== undefined ? this.resolvePhone(dto.phone) : current.phone;
    const cpf = dto.cpf !== undefined ? normalizeCpf(dto.cpf) : current.cpf;

    if (cpf && cpf !== current.cpf) {
      await this.ensureCpfAvailable(cpf, id);
    }

    const person = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.deliveryPerson.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          phone,
          cpf,
          document: dto.document === undefined ? undefined : dto.document?.trim() || null,
          status: dto.status,
          notes: dto.notes === undefined ? undefined : dto.notes?.trim() || null,
        },
      });

      await tx.deliveryPersonHistory.create({
        data: {
          deliveryPersonId: id,
          operacao: "ATUALIZACAO",
          descricao: `Entregador ${updated.name} atualizado`,
          usuarioId,
        },
      });

      return updated;
    });

    this.invalidateCache();
    return mapDeliveryPerson(person);
  }

  async updateStatus(id: string, status: DeliveryPersonStatus, usuarioId?: string) {
    await this.ensureExists(id);

    const person = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.deliveryPerson.update({
        where: { id },
        data: { status },
      });

      await tx.deliveryPersonHistory.create({
        data: {
          deliveryPersonId: id,
          operacao: "STATUS",
          descricao: `Status alterado para ${DELIVERY_PERSON_STATUS_LABELS[status]}`,
          usuarioId,
        },
      });

      return updated;
    });

    this.invalidateCache();
    return mapDeliveryPerson(person);
  }

  async remove(id: string, usuarioId?: string) {
    const current = await this.ensureExists(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.deliveryPerson.update({
        where: { id },
        data: { deletedAt: new Date(), status: DeliveryPersonStatus.INATIVO },
      });

      await tx.deliveryPersonHistory.create({
        data: {
          deliveryPersonId: id,
          operacao: "EXCLUSAO",
          descricao: `Entregador ${current.name} excluído logicamente`,
          usuarioId,
        },
      });
    });

    this.invalidateCache();
    return { success: true };
  }

  async assignToOrder(
    orderId: string,
    deliveryPersonId: string | null | undefined,
    usuarioId?: string,
  ) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException("Pedido não encontrado");
    }

    if (order.status === OrderStatus.CANCELADO || order.status === OrderStatus.ENTREGUE) {
      throw new BadRequestException("Não é possível alterar o entregador deste pedido");
    }

    if (deliveryPersonId) {
      const person = await this.ensureExists(deliveryPersonId);
      if (person.status !== DeliveryPersonStatus.DISPONIVEL) {
        throw new BadRequestException(
          "Apenas entregadores disponíveis podem receber novos pedidos",
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { deliveryPersonId: deliveryPersonId ?? null },
      });

      if (deliveryPersonId) {
        const person = await tx.deliveryPerson.findUniqueOrThrow({
          where: { id: deliveryPersonId },
        });
        await tx.deliveryPersonHistory.create({
          data: {
            deliveryPersonId,
            operacao: "VINCULO_PEDIDO",
            descricao: `Vinculado ao pedido #${order.numero}`,
            usuarioId,
          },
        });
        await tx.orderHistory.create({
          data: {
            orderId,
            status: order.status,
            descricao: `Entregador atribuído: ${person.name}`,
            usuarioId,
          },
        });
      } else if (order.deliveryPersonId) {
        await tx.orderHistory.create({
          data: {
            orderId,
            status: order.status,
            descricao: "Entregador removido do pedido",
            usuarioId,
          },
        });
      }
    });

    return { success: true };
  }

  async handleOrderStatusChange(
    orderId: string,
    status: OrderStatus,
    tx: Prisma.TransactionClient,
  ) {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order?.deliveryPersonId) return;

    if (status === OrderStatus.SAIU_PARA_ENTREGA) {
      await tx.deliveryPerson.update({
        where: { id: order.deliveryPersonId },
        data: { status: DeliveryPersonStatus.EM_ENTREGA },
      });
      await tx.deliveryPersonHistory.create({
        data: {
          deliveryPersonId: order.deliveryPersonId,
          operacao: "EM_ROTA",
          descricao: `Saiu para entrega do pedido #${order.numero}`,
        },
      });
      this.invalidateCache();
      return;
    }

    if (status === OrderStatus.ENTREGUE || status === OrderStatus.CANCELADO) {
      await this.releaseIfIdle(order.deliveryPersonId, tx);
    }
  }

  private async releaseIfIdle(personId: string, tx: Prisma.TransactionClient) {
    const activeDeliveries = await tx.order.count({
      where: {
        deliveryPersonId: personId,
        status: OrderStatus.SAIU_PARA_ENTREGA,
      },
    });

    if (activeDeliveries === 0) {
      await tx.deliveryPerson.update({
        where: { id: personId },
        data: { status: DeliveryPersonStatus.DISPONIVEL },
      });
      this.invalidateCache();
    }
  }

  private async getStats(personId: string) {
    const [deliveredOrders, cancelledOrders, lastDelivery] = await Promise.all([
      this.prisma.order.count({
        where: { deliveryPersonId: personId, status: OrderStatus.ENTREGUE },
      }),
      this.prisma.order.count({
        where: { deliveryPersonId: personId, status: OrderStatus.CANCELADO },
      }),
      this.prisma.order.findFirst({
        where: { deliveryPersonId: personId, status: OrderStatus.ENTREGUE },
        orderBy: { entregueEm: "desc" },
        select: { entregueEm: true },
      }),
    ]);

    return {
      totalDeliveries: deliveredOrders,
      deliveredOrders,
      cancelledOrders,
      lastDeliveryAt: lastDelivery?.entregueEm ?? null,
    };
  }

  private buildWhere(query: ListDeliveryPersonsQueryDto): Prisma.DeliveryPersonWhereInput {
    const where: Prisma.DeliveryPersonWhereInput = { deletedAt: null };
    if (query.status) where.status = query.status;

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { phone: { contains: term, mode: "insensitive" } },
        { cpf: { contains: term, mode: "insensitive" } },
      ];
    }

    return where;
  }

  private async ensureExists(id: string) {
    const person = await this.repository.findById(id);
    if (!person) {
      throw new NotFoundException("Entregador não encontrado");
    }
    return person;
  }

  private resolvePhone(phone: string) {
    const normalized = normalizePhone(phone);
    if (!isValidPhone(normalized)) {
      throw new BadRequestException("Telefone inválido");
    }
    return normalized;
  }

  private async ensureCpfAvailable(cpf: string | null, ignoreId?: string) {
    if (!cpf) return;

    const existing = await this.prisma.deliveryPerson.findFirst({
      where: {
        cpf,
        deletedAt: null,
        ...(ignoreId ? { id: { not: ignoreId } } : {}),
      },
    });

    if (existing) {
      throw new ConflictException("Já existe um entregador com este CPF");
    }
  }

  private invalidateCache() {
    this.availableCache = null;
    this.availableCacheExpiresAt = 0;
  }
}
