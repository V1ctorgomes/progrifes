import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, ReceivableStatus } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import {
  AccountsReceivableHistoryService,
  computeReceivableStatus,
} from "./accounts-receivable-history.service";
import {
  mapReceivableDetail,
  mapReceivableListItem,
} from "./accounts-receivable.mapper";
import { AccountsReceivableRepository } from "./accounts-receivable.repository";
import {
  CreateAccountReceivableDto,
  ListAccountsReceivableQueryDto,
} from "./dto/accounts-receivable.dto";
import { ReceivableSettlementService } from "./receivable-settlement.service";

@Injectable()
export class AccountsReceivableService {
  constructor(
    private readonly repository: AccountsReceivableRepository,
    private readonly historyService: AccountsReceivableHistoryService,
    private readonly settlementService: ReceivableSettlementService,
    private readonly prisma: PrismaService,
  ) {}

  async markOverdue() {
    await this.repository.markOverdue();
  }

  async getDashboard() {
    await this.markOverdue();

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const openStatuses: ReceivableStatus[] = [
      "PENDENTE",
      "PARCIALMENTE_RECEBIDO",
      "VENCIDO",
    ];

    const [
      totalAberto,
      vencidas,
      pendentes,
      recebidoHoje,
      recebidoMes,
      receiptsMes,
    ] = await Promise.all([
      this.repository.aggregateSaldo({
        deletedAt: null,
        status: { in: openStatuses },
      }),
      this.repository.aggregateSaldo({
        deletedAt: null,
        status: "VENCIDO",
      }),
      this.repository.count({
        deletedAt: null,
        status: { in: ["PENDENTE", "PARCIALMENTE_RECEBIDO"] },
      }),
      this.repository.aggregateReceipts({
        estornado: false,
        recebidoEm: { gte: startOfDay, lte: endOfDay },
      }),
      this.repository.aggregateReceipts({
        estornado: false,
        recebidoEm: { gte: startOfMonth, lte: endOfMonth },
      }),
      this.prisma.accountReceivableReceipt.findMany({
        where: {
          estornado: false,
          recebidoEm: { gte: startOfMonth, lte: endOfMonth },
        },
        include: {
          accountReceivable: {
            include: { category: true },
          },
        },
      }),
    ]);

    const receitasPorCategoria = receiptsMes.reduce<
      Record<string, { categoriaId: string; categoriaNome: string; total: number }>
    >((acc, receipt) => {
      const key = receipt.accountReceivable.categoryId;
      const current = acc[key] ?? {
        categoriaId: receipt.accountReceivable.categoryId,
        categoriaNome: receipt.accountReceivable.category.nome,
        total: 0,
      };
      current.total += Number(receipt.valor);
      acc[key] = current;
      return acc;
    }, {});

    return {
      totalAReceber: Number(totalAberto._sum.saldo ?? 0),
      recebidoHoje: Number(recebidoHoje._sum.valor ?? 0),
      recebidoMes: Number(recebidoMes._sum.valor ?? 0),
      contasVencidas: {
        quantidade: vencidas._count,
        valor: Number(vencidas._sum.saldo ?? 0),
      },
      recebimentosPendentes: pendentes,
      receitasPorCategoria: Object.values(receitasPorCategoria),
    };
  }

  async findAll(query: ListAccountsReceivableQueryDto) {
    await this.markOverdue();

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AccountReceivableWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.paymentMethodId ? { paymentMethodId: query.paymentMethodId } : {}),
      ...(query.financialAccountId
        ? { financialAccountId: query.financialAccountId }
        : {}),
      ...(query.costCenterId ? { costCenterId: query.costCenterId } : {}),
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
              { documento: { contains: query.search, mode: "insensitive" } },
              { observacoes: { contains: query.search, mode: "insensitive" } },
              { referenciaExterna: { contains: query.search, mode: "insensitive" } },
              {
                customer: {
                  nome: { contains: query.search, mode: "insensitive" },
                },
              },
              ...(Number.isFinite(Number(query.search))
                ? [
                    { valorOriginal: Number(query.search) },
                    { saldo: Number(query.search) },
                  ]
                : []),
              ...(query.search.match(/^\d+$/)
                ? [{ order: { numero: Number(query.search) } }]
                : []),
            ],
          }
        : {}),
    };

    const [items, total, dashboard] = await Promise.all([
      this.repository.findMany(where, skip, limit),
      this.repository.count(where),
      this.getDashboard(),
    ]);

    return {
      data: items.map(mapReceivableListItem),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
      dashboard,
    };
  }

  async findById(id: string) {
    await this.markOverdue();
    const account = await this.repository.findById(id);
    if (!account) throw new NotFoundException("Conta a receber não encontrada");
    return mapReceivableDetail(account);
  }

  async create(dto: CreateAccountReceivableDto, usuarioId?: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) throw new NotFoundException("Cliente não encontrado");

    const [category, chartAccount] = await Promise.all([
      this.prisma.financialCategory.findFirst({
        where: { id: dto.categoryId, deletedAt: null },
      }),
      this.prisma.financialChartAccount.findFirst({
        where: { id: dto.chartAccountId, deletedAt: null },
      }),
    ]);

    if (!category || !chartAccount) {
      throw new BadRequestException("Categoria ou plano de contas inválido");
    }

    const competencia = new Date(dto.competencia);
    const vencimento = new Date(dto.vencimento);

    const account = await this.prisma.$transaction(async (tx) => {
      const created = await this.repository.create(
        {
          customer: { connect: { id: dto.customerId } },
          originType: dto.originType,
          originId: dto.originId ?? null,
          category: { connect: { id: dto.categoryId } },
          chartAccount: { connect: { id: dto.chartAccountId } },
          costCenter: dto.costCenterId
            ? { connect: { id: dto.costCenterId } }
            : undefined,
          paymentMethod: { connect: { id: dto.paymentMethodId } },
          financialAccount: dto.financialAccountId
            ? { connect: { id: dto.financialAccountId } }
            : undefined,
          documento: dto.documento?.trim() || null,
          referenciaExterna: dto.referenciaExterna?.trim() || null,
          valorOriginal: dto.valor,
          valorRecebido: 0,
          saldo: dto.valor,
          competencia,
          vencimento,
          status: computeReceivableStatus(dto.valor, 0, vencimento),
          observacoes: dto.observacoes?.trim() || null,
          usuario: usuarioId ? { connect: { id: usuarioId } } : undefined,
        },
        tx,
      );

      await this.historyService.record(
        {
          accountReceivableId: created.id,
          operacao: "CRIACAO",
          descricao: "Conta a receber criada manualmente",
          usuarioId,
          valorNovo: dto.valor,
        },
        tx,
      );

      return created;
    });

    return mapReceivableDetail(account);
  }

  receive(id: string, dto: Parameters<ReceivableSettlementService["receive"]>[1], usuarioId?: string) {
    return this.settlementService.receive(id, dto, usuarioId).then(mapReceivableDetail);
  }

  cancel(id: string, dto: Parameters<ReceivableSettlementService["cancel"]>[1], usuarioId?: string) {
    return this.settlementService.cancel(id, dto, usuarioId).then(mapReceivableDetail);
  }

  reverse(id: string, dto: Parameters<ReceivableSettlementService["reverse"]>[1], usuarioId?: string) {
    return this.settlementService.reverse(id, dto, usuarioId).then(mapReceivableDetail);
  }
}
