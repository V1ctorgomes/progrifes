import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Customer, CustomerAddress, Prisma } from "@prisma/client";
import { isValidPhone, normalizePhone } from "../../common/utils/phone";
import { PrismaService } from "../../database/prisma.service";
import {
  CreateCustomerAddressDto,
  CreateCustomerDto,
  ListCustomersQueryDto,
  UpdateCustomerAddressDto,
  UpdateCustomerDto,
  UpsertCustomerFromCheckoutDto,
} from "./dto/customer.dto";
import { CustomersRepository, CustomerWithAddresses } from "./customers.repository";

type CustomerWithMeta = CustomerWithAddresses & { _count: { pedidos: number } };

@Injectable()
export class CustomersService {
  constructor(
    private readonly repository: CustomersRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(query: ListCustomersQueryDto) {
    const where = this.buildWhere(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.repository.findMany(where, skip, limit),
      this.repository.count(where),
    ]);

    return {
      data: items.map((customer) => this.toListResponse(customer)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const customer = await this.repository.findById(id);
    if (!customer) {
      throw new NotFoundException("Cliente não encontrado");
    }
    return this.toDetailResponse(customer);
  }

  async findByPhone(phone: string) {
    const telefone = this.resolvePhone(phone);
    const customer = await this.repository.findByPhone(telefone);
    if (!customer) {
      throw new NotFoundException("Cliente não encontrado");
    }
    return this.toDetailResponse(customer);
  }

  async create(dto: CreateCustomerDto) {
    const telefone = this.resolvePhone(dto.telefone);
    await this.ensurePhoneAvailable(telefone);

    const enderecos = dto.enderecos ?? [];
    this.validateAddresses(enderecos);

    const customer = await this.prisma.$transaction(async (tx) => {
      const created = await tx.customer.create({
        data: {
          nome: dto.nome.trim(),
          telefone,
          email: dto.email?.trim() || null,
          cpf: this.normalizeCpf(dto.cpf),
          dataNascimento: dto.dataNascimento ? new Date(dto.dataNascimento) : null,
          observacoes: dto.observacoes?.trim() || null,
          ativo: dto.ativo ?? true,
        },
      });

      if (enderecos.length > 0) {
        await this.syncAddresses(created.id, enderecos, tx);
      }

      return this.repository.findById(created.id);
    });

    return this.toDetailResponse(customer!);
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const current = await this.ensureExists(id);

    let telefone = current.telefone;
    if (dto.telefone) {
      telefone = this.resolvePhone(dto.telefone);
      if (telefone !== current.telefone) {
        await this.ensurePhoneAvailable(telefone, id);
      }
    }

    if (dto.enderecos) {
      this.validateAddresses(dto.enderecos);
    }

    const customer = await this.prisma.$transaction(async (tx) => {
      await tx.customer.update({
        where: { id },
        data: {
          nome: dto.nome?.trim(),
          telefone,
          email: dto.email === undefined ? undefined : dto.email?.trim() || null,
          cpf: dto.cpf === undefined ? undefined : this.normalizeCpf(dto.cpf),
          dataNascimento:
            dto.dataNascimento === undefined
              ? undefined
              : dto.dataNascimento
                ? new Date(dto.dataNascimento)
                : null,
          observacoes:
            dto.observacoes === undefined ? undefined : dto.observacoes?.trim() || null,
          ativo: dto.ativo,
        },
      });

      if (dto.enderecos) {
        await this.syncAddresses(id, dto.enderecos, tx);
      }

      return this.repository.findById(id);
    });

    return this.toDetailResponse(customer!);
  }

  async remove(id: string) {
    const customer = await this.ensureExists(id);
    const orderCount = await this.repository.countOrders(id);

    if (orderCount > 0) {
      throw new BadRequestException(
        "Cliente possui pedidos vinculados e não pode ser excluído",
      );
    }

    await this.prisma.customer.delete({ where: { id: customer.id } });
    return { message: "Cliente removido com sucesso" };
  }

  async deactivate(id: string) {
    await this.ensureExists(id);
    const customer = await this.repository.update(id, { ativo: false });
    return this.toDetailResponse(customer);
  }

  async activate(id: string) {
    await this.ensureExists(id);
    const customer = await this.repository.update(id, { ativo: true });
    return this.toDetailResponse(customer);
  }

  async addAddress(customerId: string, dto: CreateCustomerAddressDto) {
    await this.ensureExists(customerId);

    const address = await this.prisma.$transaction(async (tx) => {
      if (dto.principal) {
        await this.repository.clearPrincipalAddresses(customerId, tx);
      }

      const hasPrincipal = await tx.customerAddress.count({
        where: { customerId, principal: true },
      });

      return tx.customerAddress.create({
        data: {
          customerId,
          cep: dto.cep.trim(),
          rua: dto.rua.trim(),
          numero: dto.numero.trim(),
          complemento: dto.complemento?.trim() || null,
          bairro: dto.bairro.trim(),
          cidade: dto.cidade.trim(),
          estado: dto.estado.trim().toUpperCase(),
          referencia: dto.referencia?.trim() || null,
          principal: dto.principal ?? hasPrincipal === 0,
        },
      });
    });

    return this.toAddressResponse(address);
  }

  async updateAddress(customerId: string, addressId: string, dto: UpdateCustomerAddressDto) {
    await this.ensureExists(customerId);
    const current = await this.ensureAddressBelongsToCustomer(customerId, addressId);

    const address = await this.prisma.$transaction(async (tx) => {
      if (dto.principal) {
        await this.repository.clearPrincipalAddresses(customerId, tx);
      }

      return tx.customerAddress.update({
        where: { id: current.id },
        data: {
          cep: dto.cep.trim(),
          rua: dto.rua.trim(),
          numero: dto.numero.trim(),
          complemento: dto.complemento?.trim() || null,
          bairro: dto.bairro.trim(),
          cidade: dto.cidade.trim(),
          estado: dto.estado.trim().toUpperCase(),
          referencia: dto.referencia?.trim() || null,
          principal: dto.principal ?? current.principal,
        },
      });
    });

    return this.toAddressResponse(address);
  }

  async removeAddress(customerId: string, addressId: string) {
    await this.ensureExists(customerId);
    const current = await this.ensureAddressBelongsToCustomer(customerId, addressId);

    const totalAddresses = await this.prisma.customerAddress.count({
      where: { customerId },
    });

    if (totalAddresses <= 1) {
      throw new BadRequestException("O cliente deve possuir ao menos um endereço");
    }

    await this.repository.deleteAddress(current.id);

    if (current.principal) {
      const next = await this.prisma.customerAddress.findFirst({
        where: { customerId },
        orderBy: { createdAt: "asc" },
      });
      if (next) {
        await this.repository.updateAddress(next.id, { principal: true });
      }
    }

    return { message: "Endereço removido com sucesso" };
  }

  async setPrincipalAddress(customerId: string, addressId: string) {
    await this.ensureExists(customerId);
    await this.ensureAddressBelongsToCustomer(customerId, addressId);

    await this.prisma.$transaction(async (tx) => {
      await this.repository.clearPrincipalAddresses(customerId, tx);
      await tx.customerAddress.update({
        where: { id: addressId },
        data: { principal: true },
      });
    });

    return this.findById(customerId);
  }

  async upsertFromCheckout(dto: UpsertCustomerFromCheckoutDto, tx: Prisma.TransactionClient) {
    const telefone = this.resolvePhone(dto.telefone);
    const existing = await tx.customer.findUnique({
      where: { telefone },
      include: { enderecos: true },
    });

    const addressData = {
      cep: dto.cep.trim(),
      rua: dto.rua.trim(),
      numero: dto.numero.trim(),
      complemento: dto.complemento?.trim() || null,
      bairro: dto.bairro.trim(),
      cidade: dto.cidade.trim(),
      estado: dto.estado.trim().toUpperCase(),
      referencia: dto.referencia?.trim() || null,
    };

    if (!existing) {
      const created = await tx.customer.create({
        data: {
          nome: dto.nome.trim(),
          telefone,
          email: dto.email?.trim() || null,
          enderecos: {
            create: { ...addressData, principal: true },
          },
        },
      });
      return created;
    }

    const updated = await tx.customer.update({
      where: { id: existing.id },
      data: {
        nome: dto.nome.trim(),
        email: dto.email?.trim() || existing.email,
      },
    });

    const matchingAddress = existing.enderecos.find(
      (address) =>
        address.cep === addressData.cep &&
        address.rua === addressData.rua &&
        address.numero === addressData.numero &&
        address.bairro === addressData.bairro,
    );

    if (matchingAddress) {
      await tx.customerAddress.update({
        where: { id: matchingAddress.id },
        data: {
          complemento: addressData.complemento,
          cidade: addressData.cidade,
          estado: addressData.estado,
          referencia: addressData.referencia,
        },
      });
    } else {
      await tx.customerAddress.updateMany({
        where: { customerId: existing.id, principal: true },
        data: { principal: false },
      });
      await tx.customerAddress.create({
        data: {
          customerId: existing.id,
          ...addressData,
          principal: true,
        },
      });
    }

    return updated;
  }

  private buildWhere(query: ListCustomersQueryDto): Prisma.CustomerWhereInput {
    const where: Prisma.CustomerWhereInput = {};

    if (query.search) {
      const search = query.search.trim();
      const phone = normalizePhone(search);
      where.OR = [
        { nome: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { cpf: { contains: search, mode: "insensitive" } },
        ...(phone ? [{ telefone: { contains: phone } }] : []),
      ];
    }

    if (query.ativo !== undefined) {
      where.ativo = query.ativo;
    }

    if (query.cidade || query.bairro) {
      where.enderecos = {
        some: {
          ...(query.cidade
            ? { cidade: { contains: query.cidade, mode: "insensitive" } }
            : {}),
          ...(query.bairro
            ? { bairro: { contains: query.bairro, mode: "insensitive" } }
            : {}),
        },
      };
    }

    return where;
  }

  private async syncAddresses(
    customerId: string,
    addresses: Array<{
      id?: string;
      cep: string;
      rua: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cidade: string;
      estado: string;
      referencia?: string;
      principal?: boolean;
    }>,
    tx: Prisma.TransactionClient,
  ) {
    const existing = await tx.customerAddress.findMany({ where: { customerId } });
    const incomingIds = addresses.filter((address) => address.id).map((address) => address.id!);
    const toDelete = existing.filter((address) => !incomingIds.includes(address.id));
    const remaining = existing.length - toDelete.length + addresses.filter((a) => !a.id).length;

    if (remaining < 1) {
      throw new BadRequestException("O cliente deve possuir ao menos um endereço");
    }

    for (const address of toDelete) {
      await tx.customerAddress.delete({ where: { id: address.id } });
    }

    const saved: Array<{ id: string; principal: boolean }> = [];

    for (const address of addresses) {
      const payload = {
        cep: address.cep.trim(),
        rua: address.rua.trim(),
        numero: address.numero.trim(),
        complemento: address.complemento?.trim() || null,
        bairro: address.bairro.trim(),
        cidade: address.cidade.trim(),
        estado: address.estado.trim().toUpperCase(),
        referencia: address.referencia?.trim() || null,
        principal: false,
      };

      if (address.id) {
        await tx.customerAddress.update({ where: { id: address.id }, data: payload });
        saved.push({ id: address.id, principal: Boolean(address.principal) });
      } else {
        const created = await tx.customerAddress.create({
          data: { customerId, ...payload },
        });
        saved.push({ id: created.id, principal: Boolean(address.principal) });
      }
    }

    let principalId = saved.find((item) => item.principal)?.id ?? saved[0]?.id;
    if (principalId) {
      await tx.customerAddress.updateMany({
        where: { customerId },
        data: { principal: false },
      });
      await tx.customerAddress.update({
        where: { id: principalId },
        data: { principal: true },
      });
    }
  }

  private validateAddresses(
    addresses: Array<{ principal?: boolean }>,
  ) {
    if (addresses.length === 0) return;

    const principalCount = addresses.filter((address) => address.principal).length;
    if (principalCount > 1) {
      throw new BadRequestException("Apenas um endereço pode ser principal");
    }
  }

  private resolvePhone(phone: string) {
    const telefone = normalizePhone(phone);
    if (!isValidPhone(telefone)) {
      throw new BadRequestException("Telefone inválido");
    }
    return telefone;
  }

  private normalizeCpf(cpf?: string | null) {
    if (!cpf) return null;
    const digits = cpf.replace(/\D/g, "");
    return digits || null;
  }

  private async ensurePhoneAvailable(telefone: string, ignoreId?: string) {
    const existing = await this.repository.findByPhone(telefone);
    if (existing && existing.id !== ignoreId) {
      throw new BadRequestException("Já existe um cliente com este telefone");
    }
  }

  private async ensureExists(id: string) {
    const customer = await this.repository.findById(id);
    if (!customer) {
      throw new NotFoundException("Cliente não encontrado");
    }
    return customer;
  }

  private async ensureAddressBelongsToCustomer(customerId: string, addressId: string) {
    const address = await this.repository.findAddressById(addressId);
    if (!address || address.customerId !== customerId) {
      throw new NotFoundException("Endereço não encontrado");
    }
    return address;
  }

  private toListResponse(customer: CustomerWithMeta) {
    const principal = customer.enderecos.find((address) => address.principal);
    return {
      id: customer.id,
      nome: customer.nome,
      telefone: customer.telefone,
      email: customer.email,
      cpf: customer.cpf,
      ativo: customer.ativo,
      cidade: principal?.cidade ?? customer.enderecos[0]?.cidade ?? null,
      bairro: principal?.bairro ?? customer.enderecos[0]?.bairro ?? null,
      pedidosCount: customer._count.pedidos,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  private toDetailResponse(customer: CustomerWithMeta) {
    return {
      ...this.toListResponse(customer),
      dataNascimento: customer.dataNascimento,
      observacoes: customer.observacoes,
      enderecos: customer.enderecos.map((address) => this.toAddressResponse(address)),
    };
  }

  private toAddressResponse(address: CustomerAddress) {
    return {
      id: address.id,
      cep: address.cep,
      rua: address.rua,
      numero: address.numero,
      complemento: address.complemento,
      bairro: address.bairro,
      cidade: address.cidade,
      estado: address.estado,
      referencia: address.referencia,
      principal: address.principal,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }
}
