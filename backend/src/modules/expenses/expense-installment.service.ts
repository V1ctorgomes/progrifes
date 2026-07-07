import { Injectable } from "@nestjs/common";
import { ExpenseRecurrenceFrequency, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import {
  addMonths,
  addRecurrenceInterval,
  splitInstallments,
} from "./expense-recurrence.utils";
import { CreateExpenseDto } from "./dto/expenses.dto";
import { ExpenseHistoryService } from "./expense-history.service";
import { ExpensesRepository } from "./expenses.repository";
import { ExpenseWithRelations } from "./expenses.mapper";
import { ExpensePayableService } from "./expense-payable.service";

@Injectable()
export class ExpenseInstallmentService {
  constructor(
    private readonly repository: ExpensesRepository,
    private readonly historyService: ExpenseHistoryService,
    private readonly payableService: ExpensePayableService,
  ) {}

  async createPlan(
    dto: CreateExpenseDto,
    usuarioId: string | undefined,
    tx: Prisma.TransactionClient,
  ) {
    const quantidade = dto.quantidadeParcelas ?? 1;
    if (quantidade <= 1) {
      return this.payableService.createSingle(dto, usuarioId, tx);
    }

    const grupoId = randomUUID();
    const valores = splitInstallments(dto.valor, quantidade);
    const firstVencimento = new Date(dto.vencimento);
    const created: ExpenseWithRelations[] = [];

    for (let index = 0; index < quantidade; index += 1) {
      const parcelaNumero = index + 1;
      const vencimento = addMonths(firstVencimento, index);
      const parcelaDto: CreateExpenseDto = {
        ...dto,
        valor: valores[index],
        vencimento: vencimento.toISOString().slice(0, 10),
        competencia: vencimento.toISOString().slice(0, 10),
        quantidadeParcelas: undefined,
        recorrente: false,
      };

      const expense = await this.payableService.createSingle(
        parcelaDto,
        usuarioId,
        tx,
        {
          grupoParcelasId: grupoId,
          parcelaNumero,
          totalParcelas: quantidade,
        },
      );

      await this.repository.createInstallment(
        {
          grupoId,
          expense: { connect: { id: expense.id } },
          numero: parcelaNumero,
          valor: valores[index],
          vencimento,
          status: expense.status,
        },
        tx,
      );

      await this.historyService.record(
        {
          expenseId: expense.id,
          operacao: "PARCELAMENTO",
          descricao: `Parcela ${parcelaNumero}/${quantidade} do plano de despesas`,
          usuarioId,
          valorNovo: valores[index],
        },
        tx,
      );

      created.push(expense);
    }

    return created[0];
  }
}

@Injectable()
export class ExpenseRecurrenceService {
  constructor(
    private readonly repository: ExpensesRepository,
    private readonly historyService: ExpenseHistoryService,
    private readonly payableService: ExpensePayableService,
  ) {}

  computeNextRecurrence(
    vencimento: Date,
    frequency: ExpenseRecurrenceFrequency,
  ) {
    return addRecurrenceInterval(vencimento, frequency);
  }

  async generateNextOccurrence(
    template: ExpenseWithRelations,
    usuarioId: string | undefined,
    tx: Prisma.TransactionClient,
  ) {
    if (!template.recorrente || !template.frequencia) return null;

    const originId = template.recorrenciaOrigemId ?? template.id;
    const nextVencimento = this.computeNextRecurrence(
      template.vencimento,
      template.frequencia,
    );

    const dto: CreateExpenseDto = {
      descricao: template.descricao,
      categoryId: template.categoryId,
      chartAccountId: template.chartAccountId,
      costCenterId: template.costCenterId,
      supplierId: template.supplierId ?? undefined,
      financialAccountId: template.financialAccountId ?? undefined,
      paymentMethodId: template.paymentMethodId ?? undefined,
      valor: Number(template.valor),
      competencia: nextVencimento.toISOString().slice(0, 10),
      vencimento: nextVencimento.toISOString().slice(0, 10),
      documento: template.documento ?? undefined,
      observacoes: template.observacoes ?? undefined,
      recorrente: true,
      frequencia: template.frequencia,
      variavel: template.variavel,
    };

    const expense = await this.payableService.createSingle(
      dto,
      usuarioId,
      tx,
      {
        recorrenciaOrigemId: originId,
        proximaRecorrencia: this.computeNextRecurrence(
          nextVencimento,
          template.frequencia,
        ),
      },
    );

    await this.historyService.record(
      {
        expenseId: expense.id,
        operacao: "RECORRENCIA",
        descricao: "Despesa recorrente gerada automaticamente",
        usuarioId,
        valorNovo: expense.valor,
      },
      tx,
    );

    await this.repository.update(
      originId,
      { proximaRecorrencia: expense.proximaRecorrencia },
      tx,
    );

    return expense;
  }

  async processDueRecurrences(
    prisma: { $transaction: <T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) => Promise<T> },
  ) {
    const due = await this.repository.findRecurringDue();
    if (!due.length) return;

    for (const template of due) {
      await prisma.$transaction(async (tx) => {
        await this.generateNextOccurrence(
          template,
          template.usuarioId ?? undefined,
          tx,
        );
      });
    }
  }
}
