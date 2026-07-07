import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PayableStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import {
  AccountsPayableHistoryService,
  computePayableStatus,
} from "./accounts-payable-history.service";
import { mapPayableDetail, mapPayableListItem } from "./accounts-payable.mapper";
import { AccountsPayableRepository } from "./accounts-payable.repository";
import {
  CreateAccountPayableDto,
  ListAccountsPayableQueryDto,
} from "./dto/accounts-payable.dto";
import { PayableSettlementService } from "./payable-settlement.service";

@Injectable()
export class AccountsPayableService {
  constructor(
    private readonly repository: AccountsPayableRepository,
    private readonly historyService: AccountsPayableHistoryService,
    private readonly settlementService: PayableSettlementService,
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

    const openStatuses: PayableStatus[] = [
      "PENDENTE",
      "PARCIALMENTE_PAGO",
      "VENCIDO",
    ];

    const [
      totalAberto,
      vencidas,
      pendentes,
      pagoHoje,
      pagoMes,
      paymentsMes,
      bySupplier,
      suppliers,
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
        status: { in: ["PENDENTE", "PARCIALMENTE_PAGO"] },
      }),
      this.repository.aggregatePayments({
        estornado: false,
        pagoEm: { gte: startOfDay, lte: endOfDay },
      }),
      this.repository.aggregatePayments({
        estornado: false,
        pagoEm: { gte: startOfMonth, lte: endOfMonth },
      }),
      this.prisma.accountPayablePayment.findMany({
        where: {
          estornado: false,
          pagoEm: { gte: startOfMonth, lte: endOfMonth },
        },
        include: {
          accountPayable: { include: { category: true } },
        },
      }),
      this.repository.groupBySupplier({
        deletedAt: null,
        status: { in: openStatuses },
      }),
      this.prisma.supplier.findMany({
        where: { deletedAt: null },
        select: { id: true, nomeFantasia: true },
      }),
    ]);

    const supplierMap = new Map(suppliers.map((s) => [s.id, s.nomeFantasia]));
    const despesasPorCategoria = paymentsMes.reduce<
      Record<string, { categoriaId: string; categoriaNome: string; total: number }>
    >((acc, payment) => {
      const key = payment.accountPayable.categoryId;
      const current = acc[key] ?? {
        categoriaId: payment.accountPayable.categoryId,
        categoriaNome: payment.accountPayable.category.nome,
        total: 0,
      };
      current.total += Number(payment.valor);
      acc[key] = current;
      return acc;
    }, {});

    return {
      totalAPagar: Number(totalAberto._sum.saldo ?? 0),
      pagamentosHoje: Number(pagoHoje._sum.valor ?? 0),
      pagamentosMes: Number(pagoMes._sum.valor ?? 0),
      contasVencidas: {
        quantidade: vencidas._count,
        valor: Number(vencidas._sum.saldo ?? 0),
      },
      contasPendentes: pendentes,
      despesasPorCategoria: Object.values(despesasPorCategoria),
      obrigacoesPorFornecedor: bySupplier.map((item) => ({
        supplierId: item.supplierId,
        supplierNome: item.supplierId
          ? supplierMap.get(item.supplierId) ?? "Fornecedor"
          : "Sem fornecedor",
        quantidade: item._count,
        valor: Number(item._sum.saldo ?? 0),
      })),
    };
  }

  async findAll(query: ListAccountsPayableQueryDto) {
    await this.markOverdue();

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AccountPayableWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.supplierId ? { supplierId: query.supplierId } : {}),
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
              { numeroNota: { contains: query.search, mode: "insensitive" } },
              { observacoes: { contains: query.search, mode: "insensitive" } },
              { referenciaExterna: { contains: query.search, mode: "insensitive" } },
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
              ...(Number.isFinite(Number(query.search))
                ? [
                    { valorOriginal: Number(query.search) },
                    { saldo: Number(query.search) },
                  ]
                : []),
              ...(query.search.match(/^\d+$/)
                ? [{ purchaseOrder: { numero: Number(query.search) } }]
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
      data: items.map(mapPayableListItem),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
      dashboard,
    };
  }

  async findById(id: string) {
    await this.markOverdue();
    const account = await this.repository.findById(id);
    if (!account) throw new NotFoundException("Conta a pagar não encontrada");
    return mapPayableDetail(account);
  }

  async create(dto: CreateAccountPayableDto, usuarioId?: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, deletedAt: null },
    });
    if (!supplier) throw new NotFoundException("Fornecedor não encontrado");

    const competencia = new Date(dto.competencia);
    const vencimento = new Date(dto.vencimento);

    const account = await this.prisma.$transaction(async (tx) => {
      const created = await this.repository.create(
        {
          supplier: { connect: { id: dto.supplierId } },
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
          numeroNota: dto.numeroNota?.trim() || null,
          referenciaExterna: dto.referenciaExterna?.trim() || null,
          valorOriginal: dto.valor,
          valorPago: 0,
          saldo: dto.valor,
          competencia,
          vencimento,
          status: computePayableStatus(dto.valor, 0, vencimento),
          observacoes: dto.observacoes?.trim() || null,
          usuario: usuarioId ? { connect: { id: usuarioId } } : undefined,
        },
        tx,
      );

      await this.historyService.record(
        {
          accountPayableId: created.id,
          operacao: "CRIACAO",
          descricao: "Conta a pagar criada manualmente",
          usuarioId,
          valorNovo: dto.valor,
        },
        tx,
      );

      return created;
    });

    return mapPayableDetail(account);
  }

  pay(id: string, dto: Parameters<PayableSettlementService["pay"]>[1], usuarioId?: string) {
    return this.settlementService.pay(id, dto, usuarioId).then(mapPayableDetail);
  }

  cancel(id: string, dto: Parameters<PayableSettlementService["cancel"]>[1], usuarioId?: string) {
    return this.settlementService.cancel(id, dto, usuarioId).then(mapPayableDetail);
  }

  reverse(id: string, dto: Parameters<PayableSettlementService["reverse"]>[1], usuarioId?: string) {
    return this.settlementService.reverse(id, dto, usuarioId).then(mapPayableDetail);
  }
}
