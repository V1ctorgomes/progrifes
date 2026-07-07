import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PayableOriginType, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { FinancialRepository } from "../financial/financial.repository";
import {
  AccountsPayableHistoryService,
  computePayableStatus,
} from "../accounts-payable/accounts-payable-history.service";
import { AccountsPayableRepository } from "../accounts-payable/accounts-payable.repository";
import { CreateExpenseDto } from "./dto/expenses.dto";
import { ExpenseHistoryService } from "./expense-history.service";
import { addRecurrenceInterval } from "./expense-recurrence.utils";
import { ExpensesRepository } from "./expenses.repository";
import { payableStatusToExpenseStatus } from "./expenses.mapper";

type CreateExtras = {
  grupoParcelasId?: string;
  parcelaNumero?: number;
  totalParcelas?: number;
  recorrenciaOrigemId?: string;
  proximaRecorrencia?: Date;
};

@Injectable()
export class ExpensePayableService {
  constructor(
    private readonly repository: ExpensesRepository,
    private readonly payableRepository: AccountsPayableRepository,
    private readonly payableHistoryService: AccountsPayableHistoryService,
    private readonly historyService: ExpenseHistoryService,
    private readonly financialRepository: FinancialRepository,
    private readonly prisma: PrismaService,
  ) {}

  private async resolvePaymentMethodId(paymentMethodId?: string) {
    if (paymentMethodId) return paymentMethodId;
    const method = await this.financialRepository.findPaymentMethodByCodigo("PIX");
    if (!method) {
      throw new BadRequestException("Forma de pagamento padrão não configurada");
    }
    return method.id;
  }

  async createSingle(
    dto: CreateExpenseDto,
    usuarioId: string | undefined,
    tx: Prisma.TransactionClient,
    extras?: CreateExtras,
  ) {
    if (dto.supplierId) {
      const supplier = await tx.supplier.findFirst({
        where: { id: dto.supplierId, deletedAt: null },
      });
      if (!supplier) throw new NotFoundException("Fornecedor não encontrado");
    }

    const competencia = new Date(dto.competencia);
    const vencimento = new Date(dto.vencimento);
    const paymentMethodId = await this.resolvePaymentMethodId(dto.paymentMethodId);
    const status = computePayableStatus(dto.valor, 0, vencimento);
    const recorrente = Boolean(dto.recorrente);
    const proximaRecorrencia =
      extras?.proximaRecorrencia ??
      (recorrente && dto.frequencia
        ? addRecurrenceInterval(vencimento, dto.frequencia)
        : null);

    const payable = await this.payableRepository.create(
      {
        supplier: dto.supplierId
          ? { connect: { id: dto.supplierId } }
          : undefined,
        originType: PayableOriginType.DESPESA_MANUAL,
        category: { connect: { id: dto.categoryId } },
        chartAccount: { connect: { id: dto.chartAccountId } },
        costCenter: { connect: { id: dto.costCenterId } },
        paymentMethod: { connect: { id: paymentMethodId } },
        financialAccount: dto.financialAccountId
          ? { connect: { id: dto.financialAccountId } }
          : undefined,
        documento: dto.documento?.trim() || null,
        valorOriginal: dto.valor,
        valorPago: 0,
        saldo: dto.valor,
        competencia,
        vencimento,
        status,
        observacoes: dto.observacoes?.trim() || null,
        usuario: usuarioId ? { connect: { id: usuarioId } } : undefined,
      },
      tx,
    );

    await this.payableHistoryService.record(
      {
        accountPayableId: payable.id,
        operacao: "CRIACAO",
        descricao: "Conta a pagar gerada a partir de despesa",
        usuarioId,
        valorNovo: dto.valor,
      },
      tx,
    );

    const expense = await this.repository.create(
      {
        supplier: dto.supplierId
          ? { connect: { id: dto.supplierId } }
          : undefined,
        category: { connect: { id: dto.categoryId } },
        chartAccount: { connect: { id: dto.chartAccountId } },
        costCenter: { connect: { id: dto.costCenterId } },
        financialAccount: dto.financialAccountId
          ? { connect: { id: dto.financialAccountId } }
          : undefined,
        paymentMethod: { connect: { id: paymentMethodId } },
        accountPayable: { connect: { id: payable.id } },
        descricao: dto.descricao.trim(),
        documento: dto.documento?.trim() || null,
        valor: dto.valor,
        competencia,
        vencimento,
        status: payableStatusToExpenseStatus(status),
        recorrente,
        frequencia: recorrente ? dto.frequencia : null,
        variavel: dto.variavel ?? !recorrente,
        grupoParcelasId: extras?.grupoParcelasId ?? null,
        parcelaNumero: extras?.parcelaNumero ?? null,
        totalParcelas: extras?.totalParcelas ?? null,
        recorrenciaOrigem: extras?.recorrenciaOrigemId
          ? { connect: { id: extras.recorrenciaOrigemId } }
          : undefined,
        proximaRecorrencia,
        observacoes: dto.observacoes?.trim() || null,
        usuario: usuarioId ? { connect: { id: usuarioId } } : undefined,
      },
      tx,
    );

    await tx.accountPayable.update({
      where: { id: payable.id },
      data: { originId: expense.id },
    });

    await this.historyService.record(
      {
        expenseId: expense.id,
        operacao: "CRIACAO",
        descricao: "Despesa cadastrada",
        usuarioId,
        valorNovo: dto.valor,
      },
      tx,
    );

    return expense;
  }

  async syncStatusFromPayable(
    accountPayableId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const run = async (transaction: Prisma.TransactionClient) => {
      const payable = await transaction.accountPayable.findUnique({
        where: { id: accountPayableId },
      });
      if (!payable) return null;

      const expense = await transaction.expense.findFirst({
        where: { accountPayableId, deletedAt: null },
      });
      if (!expense) return null;

      const status = payableStatusToExpenseStatus(payable.status);
      await transaction.expense.update({
        where: { id: expense.id },
        data: { status },
      });
      await transaction.expenseInstallment.updateMany({
        where: { expenseId: expense.id },
        data: { status },
      });
      return expense;
    };

    if (tx) return run(tx);
    return this.prisma.$transaction(run);
  }
}
