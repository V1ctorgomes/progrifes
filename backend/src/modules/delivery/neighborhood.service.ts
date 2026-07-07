import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import {
  CreateNeighborhoodDto,
  ListNeighborhoodsQueryDto,
  UpdateNeighborhoodDto,
} from "./dto/neighborhood.dto";
import { NeighborhoodRepository } from "./neighborhood.repository";
import { decimal, mapNeighborhood, normalizeLocationText } from "./neighborhood.utils";

const NEIGHBORHOOD_NOT_FOUND_MESSAGE =
  "No momento não realizamos entregas para este bairro.";

@Injectable()
export class NeighborhoodService {
  private activeCache: ReturnType<typeof mapNeighborhood>[] | null = null;
  private activeCacheExpiresAt = 0;
  private readonly cacheTtlMs = 60_000;

  constructor(
    private readonly repository: NeighborhoodRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(query: ListNeighborhoodsQueryDto) {
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
      data: items.map((item) => mapNeighborhood(item)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const neighborhood = await this.repository.findById(id);
    if (!neighborhood) {
      throw new NotFoundException("Bairro não encontrado");
    }
    return mapNeighborhood(neighborhood);
  }

  async getActiveList() {
    const now = Date.now();
    if (this.activeCache && now < this.activeCacheExpiresAt) {
      return this.activeCache;
    }

    const items = await this.repository.findActive();
    const mapped = items.map((item) => mapNeighborhood(item));
    this.activeCache = mapped;
    this.activeCacheExpiresAt = now + this.cacheTtlMs;
    return mapped;
  }

  async lookup(bairro: string, cidade: string, estado: string) {
    const neighborhood = await this.findMatchingNeighborhood(bairro, cidade, estado);
    if (!neighborhood) {
      return {
        found: false as const,
        message: NEIGHBORHOOD_NOT_FOUND_MESSAGE,
      };
    }

    return {
      found: true as const,
      neighborhood: mapNeighborhood(neighborhood),
    };
  }

  async resolveForOrder(bairro: string, cidade: string, estado: string) {
    const neighborhood = await this.findMatchingNeighborhood(bairro, cidade, estado);
    if (!neighborhood) {
      throw new BadRequestException(NEIGHBORHOOD_NOT_FOUND_MESSAGE);
    }
    return neighborhood;
  }

  async create(dto: CreateNeighborhoodDto, usuarioId?: string) {
    await this.ensureUnique(dto.name, dto.city, dto.state);

    const neighborhood = await this.prisma.$transaction(async (tx) => {
      const created = await tx.deliveryNeighborhood.create({
        data: {
          name: dto.name.trim(),
          city: dto.city.trim(),
          state: dto.state.trim().toUpperCase(),
          deliveryFee: dto.deliveryFee,
          averageDeliveryTime: dto.averageDeliveryTime,
          isActive: dto.isActive ?? true,
          notes: dto.notes?.trim() || null,
        },
      });

      await tx.deliveryNeighborhoodHistory.create({
        data: {
          neighborhoodId: created.id,
          operacao: "CRIACAO",
          descricao: `Bairro ${created.name} cadastrado`,
          usuarioId,
        },
      });

      return created;
    });

    this.invalidateCache();
    return mapNeighborhood(neighborhood);
  }

  async update(id: string, dto: UpdateNeighborhoodDto, usuarioId?: string) {
    const current = await this.ensureExists(id);

    const name = dto.name?.trim() ?? current.name;
    const city = dto.city?.trim() ?? current.city;
    const state = (dto.state?.trim() ?? current.state).toUpperCase();

    if (name !== current.name || city !== current.city || state !== current.state) {
      await this.ensureUnique(name, city, state, id);
    }

    const neighborhood = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.deliveryNeighborhood.update({
        where: { id },
        data: {
          name,
          city,
          state,
          deliveryFee: dto.deliveryFee,
          averageDeliveryTime: dto.averageDeliveryTime,
          isActive: dto.isActive,
          notes: dto.notes === undefined ? undefined : dto.notes?.trim() || null,
        },
      });

      await tx.deliveryNeighborhoodHistory.create({
        data: {
          neighborhoodId: id,
          operacao: "ATUALIZACAO",
          descricao: `Bairro ${updated.name} atualizado`,
          usuarioId,
        },
      });

      return updated;
    });

    this.invalidateCache();
    return mapNeighborhood(neighborhood);
  }

  async updateStatus(id: string, isActive: boolean, usuarioId?: string) {
    await this.ensureExists(id);

    const neighborhood = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.deliveryNeighborhood.update({
        where: { id },
        data: { isActive },
      });

      await tx.deliveryNeighborhoodHistory.create({
        data: {
          neighborhoodId: id,
          operacao: isActive ? "ATIVACAO" : "DESATIVACAO",
          descricao: `Bairro ${updated.name} ${isActive ? "ativado" : "desativado"}`,
          usuarioId,
        },
      });

      return updated;
    });

    this.invalidateCache();
    return mapNeighborhood(neighborhood);
  }

  async remove(id: string, usuarioId?: string) {
    const current = await this.ensureExists(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.deliveryNeighborhood.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false },
      });

      await tx.deliveryNeighborhoodHistory.create({
        data: {
          neighborhoodId: id,
          operacao: "EXCLUSAO",
          descricao: `Bairro ${current.name} excluído logicamente`,
          usuarioId,
        },
      });
    });

    this.invalidateCache();
    return { success: true };
  }

  async duplicate(id: string, usuarioId?: string) {
    const current = await this.ensureExists(id);
    const copyName = `${current.name} (Cópia)`;
    await this.ensureUnique(copyName, current.city, current.state);

    const neighborhood = await this.prisma.$transaction(async (tx) => {
      const created = await tx.deliveryNeighborhood.create({
        data: {
          name: copyName,
          city: current.city,
          state: current.state,
          deliveryFee: current.deliveryFee,
          averageDeliveryTime: current.averageDeliveryTime,
          isActive: false,
          notes: current.notes,
        },
      });

      await tx.deliveryNeighborhoodHistory.create({
        data: {
          neighborhoodId: created.id,
          operacao: "DUPLICACAO",
          descricao: `Bairro duplicado a partir de ${current.name}`,
          usuarioId,
        },
      });

      return created;
    });

    this.invalidateCache();
    return mapNeighborhood(neighborhood);
  }

  private async findMatchingNeighborhood(bairro: string, cidade: string, estado: string) {
    const normalizedBairro = normalizeLocationText(bairro);
    const normalizedCidade = normalizeLocationText(cidade);
    const normalizedEstado = normalizeLocationText(estado);

    const neighborhoods = await this.repository.findActive();
    return (
      neighborhoods.find(
        (item) =>
          normalizeLocationText(item.name) === normalizedBairro &&
          normalizeLocationText(item.city) === normalizedCidade &&
          normalizeLocationText(item.state) === normalizedEstado,
      ) ?? null
    );
  }

  private buildWhere(query: ListNeighborhoodsQueryDto): Prisma.DeliveryNeighborhoodWhereInput {
    const where: Prisma.DeliveryNeighborhoodWhereInput = { deletedAt: null };

    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.city?.trim()) {
      where.city = { contains: query.city.trim(), mode: "insensitive" };
    }
    if (query.state?.trim()) {
      where.state = { contains: query.state.trim(), mode: "insensitive" };
    }
    if (query.averageDeliveryTime !== undefined) {
      where.averageDeliveryTime = query.averageDeliveryTime;
    }
    if (query.feeMin !== undefined || query.feeMax !== undefined) {
      where.deliveryFee = {};
      if (query.feeMin !== undefined) where.deliveryFee.gte = query.feeMin;
      if (query.feeMax !== undefined) where.deliveryFee.lte = query.feeMax;
    }
    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { city: { contains: term, mode: "insensitive" } },
        { state: { contains: term, mode: "insensitive" } },
        { notes: { contains: term, mode: "insensitive" } },
      ];
    }

    return where;
  }

  private buildOrderBy(
    sort?: ListNeighborhoodsQueryDto["sort"],
  ): Prisma.DeliveryNeighborhoodOrderByWithRelationInput {
    switch (sort) {
      case "fee":
        return { deliveryFee: "asc" };
      case "time":
        return { averageDeliveryTime: "asc" };
      case "city":
        return { city: "asc" };
      case "status":
        return { isActive: "desc" };
      case "recent":
        return { createdAt: "desc" };
      case "name":
      default:
        return { name: "asc" };
    }
  }

  private async ensureExists(id: string) {
    const neighborhood = await this.repository.findById(id);
    if (!neighborhood) {
      throw new NotFoundException("Bairro não encontrado");
    }
    return neighborhood;
  }

  private async ensureUnique(name: string, city: string, state: string, ignoreId?: string) {
    const neighborhoods = await this.repository.findAllNonDeleted();
    const normalizedName = normalizeLocationText(name);
    const normalizedCity = normalizeLocationText(city);
    const normalizedState = normalizeLocationText(state);

    const duplicate = neighborhoods.find(
      (item) =>
        item.id !== ignoreId &&
        normalizeLocationText(item.name) === normalizedName &&
        normalizeLocationText(item.city) === normalizedCity &&
        normalizeLocationText(item.state) === normalizedState,
    );

    if (duplicate) {
      throw new ConflictException("Já existe um bairro cadastrado para esta cidade");
    }
  }

  private invalidateCache() {
    this.activeCache = null;
    this.activeCacheExpiresAt = 0;
  }
}
