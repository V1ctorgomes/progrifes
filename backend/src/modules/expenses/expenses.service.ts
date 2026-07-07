import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ExpenseStatus, Prisma } from "@prisma/client";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { PrismaService } from "../../database/prisma.service";
import { PayableSettlementService } from "../accounts-payable/payable-settlement.service";
import { computePayableStatus } from "../accounts-payable/accounts-payable-history.service";
import {
  CancelExpenseDto,
  CreateExpenseAttachmentDto,
  CreateExpenseDto,
  ListExpensesQueryDto,
  PayExpenseDto,
  ReverseExpenseDto,
  UpdateExpenseDto,
} from "./dto/expenses.dto";
import { ExpenseHistoryService } from "./expense-history.service";
import {
  ExpenseInstallmentService,
  ExpenseRecurrenceService,
} from "./expense-installment.service";
import { ExpensePayableService } from "./expense-payable.service";
import {
  decimal,
  mapExpenseDetail,
  mapExpenseListItem,
} from "./expenses.mapper";
import { ExpensesRepository } from "./expenses.repository";

const UPLOAD_DIR = join(process.cwd(), "uploads", "expenses");

@Injectable()
export class ExpensesService {
  constructor(
    private readonly repository: ExpensesRepository,
    private readonly historyService: ExpenseHistoryService,
    private readonly installmentService: ExpenseInstallmentService,
    private readonly recurrenceService: ExpenseRecurrenceService,
    private readonly payableService: ExpensePayableService,
    private readonly settlementService: PayableSettlementService,
    private readonly prisma: PrismaService,
  ) {}

  private async markOverdue() {
    await this.repository.markOverdue();
    await this.prisma.accountPayable.updateMany({
      where: {
        deletedAt: null,
        status: { in: ["PENDENTE", "PARCIALMENTE_PAGO"] },
        vencimento: { lt: new Date() },
        despesa: { isNot: null },
      },
      data: { status: "VENCIDO" },
    });
  }

  async getDashboard() {
    await this.markOverdue();

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const baseWhere: Prisma.ExpenseWhereInput = { deletedAt: null };
    const openStatuses: ExpenseStatus[] = [
      "PENDENTE",
      "PARCIALMENTE_PAGO",
      "VENCIDO",
    ];

    const [
      despesasDia,
      despesasMes,
      pendentes,
      vencidas,
      fixas,
      variaveis,
      byCategory,
      byCostCenter,
      categories,
      costCenters,
    ] = await Promise.all([
      this.repository.aggregateValor({
        ...baseWhere,
        createdAt: { gte: startOfDay, lte: endOfDay },
      }),
      this.repository.aggregateValor({
        ...baseWhere,
        createdAt: { gte: startOfMonth, lte: endOfDay },
      }),
      this.repository.aggregateValor({
        ...baseWhere,
        status: { in: ["PENDENTE", "PARCIALMENTE_PAGO"] },
      }),
      this.repository.aggregateValor({
        ...baseWhere,
        status: "VENCIDO",
      }),
      this.repository.aggregateValor({
        ...baseWhere,
        recorrente: true,
      }),
      this.repository.aggregateValor({
        ...baseWhere,
        variavel: true,
      }),
      this.repository.groupByCategory(baseWhere),
      this.repository.groupByCostCenter(baseWhere),
      this.prisma.financialCategory.findMany({
        where: { deletedAt: null },
        select: { id: true, nome: true },
      }),
      this.prisma.financialCostCenter.findMany({
        where: { deletedAt: null },
        select: { id: true, nome: true },
      }),
    ]);

    const categoryMap = new Map(categories.map((c) => [c.id, c.nome]));
    const costCenterMap = new Map(costCenters.map((c) => [c.id, c.nome]));

    return {
      despesasDia: decimal(despesasDia._sum.valor),
      despesasMes: decimal(despesasMes._sum.valor),
      despesasPendentes: {
        quantidade: pendentes._count,
        valor: decimal(pendentes._sum.valor),
      },
      despesasVencidas: {
        quantidade: vencidas._count,
        valor: decimal(vencidas._sum.valor),
      },
      despesasFixas: decimal(fixas._sum.valor),
      despesasVariaveis: decimal(variaveis._sum.valor),
      despesasPorCategoria: byCategory.map((item) => ({
        categoryId: item.categoryId,
        categoryNome: categoryMap.get(item.categoryId) ?? "Categoria",
        total: decimal(item._sum.valor),
        quantidade: item._count,
      })),
      despesasPorCentroCusto: byCostCenter.map((item) => ({
        costCenterId: item.costCenterId,
        costCenterNome: costCenterMap.get(item.costCenterId) ?? "Centro",
        total: decimal(item._sum.valor),
        quantidade: item._count,
      })),
    };
  }

  private buildWhere(query: ListExpensesQueryDto): Prisma.ExpenseWhereInput {
    return {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.supplierId ? { supplierId: query.supplierId } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.costCenterId ? { costCenterId: query.costCenterId } : {}),
      ...(query.financialAccountId
        ? { financialAccountId: query.financialAccountId }
        : {}),
      ...(query.paymentMethodId
        ? { paymentMethodId: query.paymentMethodId }
        : {}),
      ...(query.recorrente !== undefined ? { recorrente: query.recorrente } : {}),
      ...(query.variavel !== undefined ? { variavel: query.variavel } : {}),
      ...(query.dataInicio || query.dataFim
        ? {
            vencimento: {
              ...(query.dataInicio ? { gte: new Date(query.dataInicio) } : {}),
              ...(query.dataFim ? { lte: new Date(query.dataFim) } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { descricao: { contains: query.search, mode: "insensitive" } },
              { documento: { contains: query.search, mode: "insensitive" } },
              { observacoes: { contains: query.search, mode: "insensitive" } },
              {
                supplier: {
                  nomeFantasia: { contains: query.search, mode: "insensitive" },
                },
              },
              {
                supplier: {
                  razaoSocial: { contains: query.search, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    };
  }

  async findAll(query: ListExpensesQueryDto) {
    await this.markOverdue();

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildWhere(query);

    const [items, total, dashboard] = await Promise.all([
      this.repository.findMany(where, (page - 1) * limit, limit),
      this.repository.count(where),
      this.getDashboard(),
    ]);

    return {
      data: items.map(mapExpenseListItem),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
      dashboard,
    };
  }

  async findById(id: string) {
    await this.markOverdue();
    const expense = await this.repository.findById(id);
    if (!expense) throw new NotFoundException("Despesa não encontrada");
    return mapExpenseDetail(expense);
  }

  async create(dto: CreateExpenseDto, usuarioId?: string) {
    if (dto.recorrente && !dto.frequencia) {
      throw new BadRequestException(
        "Informe a frequência para despesas recorrentes",
      );
    }

    const expense = await this.prisma.$transaction(async (tx) => {
      if (dto.quantidadeParcelas && dto.quantidadeParcelas > 1) {
        return this.installmentService.createPlan(dto, usuarioId, tx);
      }
      return this.payableService.createSingle(dto, usuarioId, tx);
    });

    const full = await this.repository.findById(expense.id);
    if (!full) throw new NotFoundException("Despesa não encontrada");
    return mapExpenseDetail(full);
  }

  async update(id: string, dto: UpdateExpenseDto, usuarioId?: string) {
    const expense = await this.repository.findById(id);
    if (!expense) throw new NotFoundException("Despesa não encontrada");

    if (!["PENDENTE", "VENCIDO"].includes(expense.status)) {
      throw new BadRequestException(
        "Somente despesas pendentes podem ser editadas",
      );
    }

    if (decimal(expense.accountPayable.valorPago) > 0) {
      throw new BadRequestException(
        "Não é possível editar despesa com pagamentos registrados",
      );
    }

    const valor = dto.valor ?? decimal(expense.valor);
    const vencimento = dto.vencimento
      ? new Date(dto.vencimento)
      : expense.vencimento;
    const competencia = dto.competencia
      ? new Date(dto.competencia)
      : expense.competencia;
    const status = computePayableStatus(valor, 0, vencimento);

    await this.prisma.$transaction(async (tx) => {
      await tx.accountPayable.update({
        where: { id: expense.accountPayableId },
        data: {
          ...(dto.supplierId !== undefined ? { supplierId: dto.supplierId } : {}),
          categoryId: dto.categoryId ?? expense.categoryId,
          chartAccountId: dto.chartAccountId ?? expense.chartAccountId,
          costCenterId: dto.costCenterId ?? expense.costCenterId,
          paymentMethodId: dto.paymentMethodId ?? expense.paymentMethodId ?? undefined,
          financialAccountId:
            dto.financialAccountId ?? expense.financialAccountId,
          documento:
            dto.documento !== undefined
              ? dto.documento.trim() || null
              : expense.documento,
          valorOriginal: valor,
          saldo: valor,
          competencia,
          vencimento,
          status,
          observacoes:
            dto.observacoes !== undefined
              ? dto.observacoes.trim() || null
              : expense.observacoes,
        },
      });

      await this.repository.update(
        id,
        {
          supplier: dto.supplierId
            ? { connect: { id: dto.supplierId } }
            : dto.supplierId === null
              ? { disconnect: true }
              : undefined,
          category: dto.categoryId
            ? { connect: { id: dto.categoryId } }
            : undefined,
          chartAccount: dto.chartAccountId
            ? { connect: { id: dto.chartAccountId } }
            : undefined,
          costCenter: dto.costCenterId
            ? { connect: { id: dto.costCenterId } }
            : undefined,
          paymentMethod: dto.paymentMethodId
            ? { connect: { id: dto.paymentMethodId } }
            : undefined,
          financialAccount: dto.financialAccountId
            ? { connect: { id: dto.financialAccountId } }
            : undefined,
          descricao: dto.descricao?.trim(),
          documento:
            dto.documento !== undefined
              ? dto.documento.trim() || null
              : undefined,
          valor,
          competencia,
          vencimento,
          status: status as ExpenseStatus,
          observacoes:
            dto.observacoes !== undefined
              ? dto.observacoes.trim() || null
              : undefined,
        },
        tx,
      );

      await this.historyService.record(
        {
          expenseId: id,
          operacao: "ALTERACAO",
          descricao: "Despesa atualizada",
          usuarioId,
          valorAnterior: expense.valor,
          valorNovo: valor,
        },
        tx,
      );
    });

    return this.findById(id);
  }

  async pay(id: string, dto: PayExpenseDto, usuarioId?: string) {
    const expense = await this.repository.findById(id);
    if (!expense) throw new NotFoundException("Despesa não encontrada");

    await this.settlementService.pay(
      expense.accountPayableId,
      dto,
      usuarioId,
    );

    await this.payableService.syncStatusFromPayable(expense.accountPayableId);

    if (
      expense.recorrente &&
      expense.frequencia &&
      !expense.recorrenciaOrigemId
    ) {
      const payable = await this.prisma.accountPayable.findUnique({
        where: { id: expense.accountPayableId },
      });
      if (payable?.status === "PAGO") {
        await this.prisma.$transaction(async (tx) => {
          await this.recurrenceService.generateNextOccurrence(
            expense,
            usuarioId,
            tx,
          );
        });
      }
    }

    const updated = await this.repository.findById(id);
    if (!updated) throw new NotFoundException("Despesa não encontrada");

    await this.historyService.record({
      expenseId: id,
      operacao: "PAGAMENTO",
      descricao: `Pagamento registrado: R$ ${dto.valor.toFixed(2)}`,
      usuarioId,
      valorNovo: dto.valor,
    });

    return mapExpenseDetail(updated);
  }

  async cancel(id: string, dto: CancelExpenseDto, usuarioId?: string) {
    const expense = await this.repository.findById(id);
    if (!expense) throw new NotFoundException("Despesa não encontrada");

    await this.settlementService.cancel(
      expense.accountPayableId,
      dto,
      usuarioId,
    );
    await this.payableService.syncStatusFromPayable(expense.accountPayableId);

    await this.historyService.record({
      expenseId: id,
      operacao: "CANCELAMENTO",
      descricao: dto.motivo.trim(),
      usuarioId,
    });

    return this.findById(id);
  }

  async reverse(id: string, dto: ReverseExpenseDto, usuarioId?: string) {
    const expense = await this.repository.findById(id);
    if (!expense) throw new NotFoundException("Despesa não encontrada");

    await this.settlementService.reverse(
      expense.accountPayableId,
      dto,
      usuarioId,
    );
    await this.payableService.syncStatusFromPayable(expense.accountPayableId);

    await this.historyService.record({
      expenseId: id,
      operacao: "ESTORNO",
      descricao: dto.motivo?.trim() || "Estorno de pagamento",
      usuarioId,
    });

    return this.findById(id);
  }

  async addAttachment(
    id: string,
    dto: CreateExpenseAttachmentDto,
    usuarioId?: string,
  ) {
    const expense = await this.repository.findById(id);
    if (!expense) throw new NotFoundException("Despesa não encontrada");

    const buffer = Buffer.from(dto.conteudoBase64, "base64");
    const safeName = dto.nome.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${randomUUID()}-${safeName}`;
    const dir = join(UPLOAD_DIR, id);
    await mkdir(dir, { recursive: true });
    const filePath = join(dir, fileName);
    await writeFile(filePath, buffer);

    const relativePath = join("expenses", id, fileName).replace(/\\/g, "/");

    const attachment = await this.prisma.$transaction(async (tx) => {
      const created = await this.repository.createAttachment(
        {
          expense: { connect: { id } },
          nome: dto.nome,
          arquivo: relativePath,
          tipo: dto.tipo,
          usuario: usuarioId ? { connect: { id: usuarioId } } : undefined,
        },
        tx,
      );

      await this.historyService.record(
        {
          expenseId: id,
          operacao: "ANEXO",
          descricao: `Anexo adicionado: ${dto.nome}`,
          usuarioId,
        },
        tx,
      );

      return created;
    });

    return {
      id: attachment.id,
      nome: attachment.nome,
      arquivo: attachment.arquivo,
      tipo: attachment.tipo,
      createdAt: attachment.createdAt.toISOString(),
    };
  }
}
