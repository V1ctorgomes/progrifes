import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { isValidCnpj, normalizeCnpj } from "../../common/utils/cnpj";
import { isValidPhone, normalizePhone } from "../../common/utils/phone";
import { PrismaService } from "../../database/prisma.service";
import {
  CreateSupplierDto,
  ListSuppliersQueryDto,
  SupplierAddressDto,
  SupplierContactDto,
  UpdateSupplierDto,
} from "./dto/supplier.dto";
import { SuppliersRepository, SupplierWithRelations } from "./suppliers.repository";

@Injectable()
export class SuppliersService {
  constructor(
    private readonly repository: SuppliersRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(query: ListSuppliersQueryDto) {
    const where = this.buildWhere(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.repository.findMany(where, skip, limit),
      this.repository.count(where),
    ]);

    return {
      data: items.map((supplier) => this.toListResponse(supplier)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const supplier = await this.repository.findById(id);
    if (!supplier) {
      throw new NotFoundException("Fornecedor não encontrado");
    }
    return this.toDetailResponse(supplier);
  }

  async create(dto: CreateSupplierDto) {
    const cnpj = this.resolveCnpj(dto.cnpj);
    await this.ensureCnpjAvailable(cnpj);
    const telefone = this.resolvePhone(dto.telefone);

    const supplier = await this.prisma.$transaction(async (tx) => {
      const created = await tx.supplier.create({
        data: {
          razaoSocial: dto.razaoSocial.trim(),
          nomeFantasia: dto.nomeFantasia.trim(),
          cnpj,
          inscricaoEstadual: dto.inscricaoEstadual?.trim() || null,
          telefone,
          email: dto.email?.trim() || null,
          website: dto.website?.trim() || null,
          contatoPrincipal: dto.contatoPrincipal?.trim() || null,
          observacoes: dto.observacoes?.trim() || null,
          ativo: dto.ativo ?? true,
        },
      });

      if (dto.endereco) {
        await tx.supplierAddress.create({
          data: this.mapAddressCreate(created.id, dto.endereco),
        });
      }

      if (dto.contatos?.length) {
        await tx.supplierContact.createMany({
          data: dto.contatos.map((contact) => this.mapContactCreate(created.id, contact)),
        });
      }

      return tx.supplier.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          endereco: true,
          contatos: { orderBy: { createdAt: "asc" } },
        },
      });
    });

    return this.toDetailResponse(supplier);
  }

  async update(id: string, dto: UpdateSupplierDto) {
    const current = await this.ensureExists(id);

    let cnpj = current.cnpj;
    if (dto.cnpj !== undefined) {
      cnpj = this.resolveCnpj(dto.cnpj);
      if (cnpj !== current.cnpj) {
        await this.ensureCnpjAvailable(cnpj, id);
      }
    }

    const telefone =
      dto.telefone !== undefined ? this.resolvePhone(dto.telefone) : current.telefone;

    const supplier = await this.prisma.$transaction(async (tx) => {
      await tx.supplier.update({
        where: { id },
        data: {
          razaoSocial: dto.razaoSocial?.trim(),
          nomeFantasia: dto.nomeFantasia?.trim(),
          cnpj,
          inscricaoEstadual:
            dto.inscricaoEstadual === undefined
              ? undefined
              : dto.inscricaoEstadual?.trim() || null,
          telefone,
          email: dto.email === undefined ? undefined : dto.email?.trim() || null,
          website: dto.website === undefined ? undefined : dto.website?.trim() || null,
          contatoPrincipal:
            dto.contatoPrincipal === undefined
              ? undefined
              : dto.contatoPrincipal?.trim() || null,
          observacoes:
            dto.observacoes === undefined ? undefined : dto.observacoes?.trim() || null,
          ativo: dto.ativo,
        },
      });

      if (dto.endereco) {
        await tx.supplierAddress.upsert({
          where: { supplierId: id },
          create: this.mapAddressCreate(id, dto.endereco),
          update: this.mapAddressUpdate(dto.endereco),
        });
      }

      if (dto.contatos !== undefined) {
        await this.syncContacts(tx, id, dto.contatos);
      }

      return tx.supplier.findUniqueOrThrow({
        where: { id },
        include: {
          endereco: true,
          contatos: { orderBy: { createdAt: "asc" } },
        },
      });
    });

    return this.toDetailResponse(supplier);
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.repository.softDelete(id);
    return { message: "Fornecedor removido com sucesso" };
  }

  async deactivate(id: string) {
    await this.ensureExists(id);
    const supplier = await this.repository.update(id, { ativo: false });
    return this.toDetailResponse(supplier);
  }

  async activate(id: string) {
    await this.ensureExists(id);
    const supplier = await this.repository.update(id, { ativo: true });
    return this.toDetailResponse(supplier);
  }

  private buildWhere(query: ListSuppliersQueryDto): Prisma.SupplierWhereInput {
    const where: Prisma.SupplierWhereInput = { deletedAt: null };

    if (query.ativo !== undefined) {
      where.ativo = query.ativo;
    }

    if (query.cidade) {
      where.endereco = {
        is: { cidade: { contains: query.cidade.trim(), mode: "insensitive" } },
      };
    }

    if (query.estado) {
      where.endereco = {
        ...(where.endereco as Prisma.SupplierAddressNullableScalarRelationFilter | undefined),
        is: {
          ...((where.endereco as Prisma.SupplierAddressNullableScalarRelationFilter)?.is ?? {}),
          estado: { equals: query.estado.trim().toUpperCase(), mode: "insensitive" },
        },
      };
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      const cnpjDigits = normalizeCnpj(term);
      const phoneDigits = normalizePhone(term);

      where.OR = [
        { razaoSocial: { contains: term, mode: "insensitive" } },
        { nomeFantasia: { contains: term, mode: "insensitive" } },
        { telefone: { contains: phoneDigits } },
      ];

      if (cnpjDigits.length >= 4) {
        where.OR.push({ cnpj: { contains: cnpjDigits } });
      }
    }

    return where;
  }

  private async ensureExists(id: string) {
    const supplier = await this.repository.findById(id);
    if (!supplier) {
      throw new NotFoundException("Fornecedor não encontrado");
    }
    return supplier;
  }

  private async ensureCnpjAvailable(cnpj: string, excludeId?: string) {
    const existing = await this.repository.findByCnpj(cnpj);
    if (existing && existing.id !== excludeId) {
      throw new ConflictException("CNPJ já cadastrado para outro fornecedor");
    }
  }

  private resolveCnpj(cnpj: string) {
    const normalized = normalizeCnpj(cnpj);
    if (!isValidCnpj(normalized)) {
      throw new BadRequestException("CNPJ inválido");
    }
    return normalized;
  }

  private resolvePhone(phone: string) {
    const normalized = normalizePhone(phone);
    if (!isValidPhone(normalized)) {
      throw new BadRequestException("Telefone inválido");
    }
    return normalized;
  }

  private mapAddressCreate(supplierId: string, address: SupplierAddressDto) {
    return {
      supplierId,
      cep: address.cep.trim(),
      rua: address.rua.trim(),
      numero: address.numero.trim(),
      complemento: address.complemento?.trim() || null,
      bairro: address.bairro.trim(),
      cidade: address.cidade.trim(),
      estado: address.estado.trim().toUpperCase(),
    };
  }

  private mapAddressUpdate(address: SupplierAddressDto) {
    return {
      cep: address.cep.trim(),
      rua: address.rua.trim(),
      numero: address.numero.trim(),
      complemento: address.complemento?.trim() || null,
      bairro: address.bairro.trim(),
      cidade: address.cidade.trim(),
      estado: address.estado.trim().toUpperCase(),
    };
  }

  private mapContactCreate(supplierId: string, contact: SupplierContactDto) {
    return {
      supplierId,
      nome: contact.nome.trim(),
      cargo: contact.cargo?.trim() || null,
      telefone: contact.telefone ? normalizePhone(contact.telefone) : null,
      whatsapp: contact.whatsapp ? normalizePhone(contact.whatsapp) : null,
      email: contact.email?.trim() || null,
    };
  }

  private async syncContacts(
    tx: Prisma.TransactionClient,
    supplierId: string,
    contacts: SupplierContactDto[],
  ) {
    const existing = await tx.supplierContact.findMany({ where: { supplierId } });
    const incomingIds = new Set(contacts.filter((c) => c.id).map((c) => c.id));

    const toDelete = existing.filter((contact) => !incomingIds.has(contact.id));
    if (toDelete.length) {
      await tx.supplierContact.deleteMany({
        where: { id: { in: toDelete.map((contact) => contact.id) } },
      });
    }

    for (const contact of contacts) {
      const data = this.mapContactCreate(supplierId, contact);
      if (contact.id) {
        await tx.supplierContact.update({
          where: { id: contact.id },
          data: {
            nome: data.nome,
            cargo: data.cargo,
            telefone: data.telefone,
            whatsapp: data.whatsapp,
            email: data.email,
          },
        });
      } else {
        await tx.supplierContact.create({ data });
      }
    }
  }

  private toListResponse(supplier: SupplierWithRelations) {
    return {
      id: supplier.id,
      razaoSocial: supplier.razaoSocial,
      nomeFantasia: supplier.nomeFantasia,
      cnpj: supplier.cnpj,
      telefone: supplier.telefone,
      email: supplier.email,
      ativo: supplier.ativo,
      cidade: supplier.endereco?.cidade ?? null,
      estado: supplier.endereco?.estado ?? null,
      createdAt: supplier.createdAt.toISOString(),
      updatedAt: supplier.updatedAt.toISOString(),
    };
  }

  private toDetailResponse(supplier: SupplierWithRelations) {
    return {
      ...this.toListResponse(supplier),
      inscricaoEstadual: supplier.inscricaoEstadual,
      website: supplier.website,
      contatoPrincipal: supplier.contatoPrincipal,
      observacoes: supplier.observacoes,
      endereco: supplier.endereco
        ? {
            id: supplier.endereco.id,
            cep: supplier.endereco.cep,
            rua: supplier.endereco.rua,
            numero: supplier.endereco.numero,
            complemento: supplier.endereco.complemento,
            bairro: supplier.endereco.bairro,
            cidade: supplier.endereco.cidade,
            estado: supplier.endereco.estado,
            createdAt: supplier.endereco.createdAt.toISOString(),
            updatedAt: supplier.endereco.updatedAt.toISOString(),
          }
        : null,
      contatos: supplier.contatos.map((contact) => ({
        id: contact.id,
        nome: contact.nome,
        cargo: contact.cargo,
        telefone: contact.telefone,
        whatsapp: contact.whatsapp,
        email: contact.email,
        createdAt: contact.createdAt.toISOString(),
        updatedAt: contact.updatedAt.toISOString(),
      })),
    };
  }
}
