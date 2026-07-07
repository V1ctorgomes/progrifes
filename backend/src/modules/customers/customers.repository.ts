import { Injectable } from "@nestjs/common";
import { Customer, CustomerAddress, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

export type CustomerWithAddresses = Customer & { enderecos: CustomerAddress[] };

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(
    where: Prisma.CustomerWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.CustomerOrderByWithRelationInput = { createdAt: "desc" },
  ) {
    return this.prisma.customer.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        enderecos: { orderBy: [{ principal: "desc" }, { createdAt: "asc" }] },
        _count: { select: { pedidos: true } },
      },
    });
  }

  count(where: Prisma.CustomerWhereInput) {
    return this.prisma.customer.count({ where });
  }

  findById(id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
      include: {
        enderecos: { orderBy: [{ principal: "desc" }, { createdAt: "asc" }] },
        _count: { select: { pedidos: true } },
      },
    });
  }

  findByPhone(telefone: string) {
    return this.prisma.customer.findUnique({
      where: { telefone },
      include: {
        enderecos: { orderBy: [{ principal: "desc" }, { createdAt: "asc" }] },
        _count: { select: { pedidos: true } },
      },
    });
  }

  create(data: Prisma.CustomerCreateInput) {
    return this.prisma.customer.create({
      data,
      include: {
        enderecos: { orderBy: [{ principal: "desc" }, { createdAt: "asc" }] },
        _count: { select: { pedidos: true } },
      },
    });
  }

  update(id: string, data: Prisma.CustomerUpdateInput) {
    return this.prisma.customer.update({
      where: { id },
      data,
      include: {
        enderecos: { orderBy: [{ principal: "desc" }, { createdAt: "asc" }] },
        _count: { select: { pedidos: true } },
      },
    });
  }

  countOrders(customerId: string) {
    return this.prisma.order.count({ where: { customerId } });
  }

  createAddress(data: Prisma.CustomerAddressCreateInput) {
    return this.prisma.customerAddress.create({ data });
  }

  updateAddress(id: string, data: Prisma.CustomerAddressUpdateInput) {
    return this.prisma.customerAddress.update({ where: { id }, data });
  }

  deleteAddress(id: string) {
    return this.prisma.customerAddress.delete({ where: { id } });
  }

  findAddressById(id: string) {
    return this.prisma.customerAddress.findUnique({ where: { id } });
  }

  clearPrincipalAddresses(customerId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.customerAddress.updateMany({
      where: { customerId, principal: true },
      data: { principal: false },
    });
  }
}
