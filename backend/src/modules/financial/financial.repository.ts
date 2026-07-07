import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class FinancialRepository {
  constructor(private readonly prisma: PrismaService) {}

  findChartAccounts() {
    return this.prisma.financialChartAccount.findMany({
      where: { deletedAt: null },
      orderBy: [{ tipo: "asc" }, { nome: "asc" }],
    });
  }

  findCategories() {
    return this.prisma.financialCategory.findMany({
      where: { deletedAt: null },
      orderBy: { nome: "asc" },
    });
  }

  findCostCenters() {
    return this.prisma.financialCostCenter.findMany({
      where: { deletedAt: null },
      orderBy: [{ principal: "desc" }, { nome: "asc" }],
    });
  }

  findBankAccounts() {
    return this.prisma.financialAccount.findMany({
      where: { deletedAt: null },
      orderBy: { nome: "asc" },
    });
  }

  findCashboxes() {
    return this.prisma.financialCashbox.findMany({
      where: { deletedAt: null },
      orderBy: { nome: "asc" },
    });
  }

  findPaymentMethods() {
    return this.prisma.financialPaymentMethod.findMany({
      where: { deletedAt: null },
      orderBy: { nome: "asc" },
    });
  }

  findCategoryByCodigo(codigo: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.financialCategory.findFirst({
      where: { codigo, deletedAt: null },
    });
  }

  findChartAccountByCodigo(codigo: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.financialChartAccount.findFirst({
      where: { codigo, deletedAt: null },
    });
  }

  findPrincipalCostCenter(tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.financialCostCenter.findFirst({
      where: { principal: true, deletedAt: null, ativo: true },
    });
  }

  findPaymentMethodByCodigo(codigo: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.financialPaymentMethod.findFirst({
      where: { codigo, deletedAt: null, ativo: true },
    });
  }

  findCashboxByCodigo(codigo: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.financialCashbox.findFirst({
      where: { codigo, deletedAt: null, ativo: true },
    });
  }

  countActiveMasterData() {
    return Promise.all([
      this.prisma.financialAccount.count({ where: { deletedAt: null } }),
      this.prisma.financialCashbox.count({ where: { deletedAt: null } }),
      this.prisma.financialCategory.count({ where: { deletedAt: null } }),
      this.prisma.financialPaymentMethod.count({ where: { deletedAt: null } }),
      this.prisma.financialTransaction.count({ where: { deletedAt: null } }),
    ]);
  }
}
