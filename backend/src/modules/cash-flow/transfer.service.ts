import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  CashFlowType,
  FinancialOriginType,
  FinancialTransactionStatus,
  FinancialTransactionType,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { FinancialAuditService } from "../financial/financial-audit.service";
import { FinancialRepository } from "../financial/financial.repository";
import { FinancialTransactionRepository } from "../financial/financial-transaction.repository";
import { CashClosingService } from "./cash-closing.service";
import { CashFlowRepository } from "./cash-flow.repository";
import { CashFlowSyncService } from "./cash-flow-sync.service";
import {
  CreateCashAdjustmentDto,
  CreateCashTransferDto,
} from "./dto/cash-flow.dto";

@Injectable()
export class TransferService {
  constructor(
    private readonly repository: CashFlowRepository,
    private readonly syncService: CashFlowSyncService,
    private readonly closingService: CashClosingService,
    private readonly financialRepository: FinancialRepository,
    private readonly transactionRepository: FinancialTransactionRepository,
    private readonly auditService: FinancialAuditService,
    private readonly prisma: PrismaService,
  ) {}

  private validateEndpoints(dto: CreateCashTransferDto) {
    const fromAccount = Boolean(dto.fromFinancialAccountId);
    const fromCashbox = Boolean(dto.fromCashboxId);
    const toAccount = Boolean(dto.toFinancialAccountId);
    const toCashbox = Boolean(dto.toCashboxId);

    if (fromAccount === fromCashbox || toAccount === toCashbox) {
      throw new BadRequestException(
        "Informe exatamente uma origem e um destino (conta ou caixa)",
      );
    }

    const sameSource =
      dto.fromFinancialAccountId &&
      dto.fromFinancialAccountId === dto.toFinancialAccountId;
    const sameCashbox =
      dto.fromCashboxId && dto.fromCashboxId === dto.toCashboxId;

    if (sameSource || sameCashbox) {
      throw new BadRequestException(
        "Origem e destino devem ser contas ou caixas diferentes",
      );
    }
  }

  async transfer(dto: CreateCashTransferDto, usuarioId?: string) {
    this.validateEndpoints(dto);

    const paymentMethod = await this.financialRepository
      .findPaymentMethods()
      .then((items) => items.find((item) => item.id === dto.paymentMethodId));

    if (!paymentMethod) {
      throw new NotFoundException("Forma de pagamento não encontrada");
    }

    const [category, chartAccount, costCenter] = await Promise.all([
      this.financialRepository.findCategoryByCodigo("OUTROS"),
      this.financialRepository.findChartAccountByCodigo("DESPESAS_OUTROS"),
      this.financialRepository.findPrincipalCostCenter(),
    ]);

    if (!category || !chartAccount) {
      throw new BadRequestException("Estrutura financeira base não configurada");
    }

    const data = dto.data ? new Date(dto.data) : new Date();
    const descricao =
      dto.descricao?.trim() || `Transferência de R$ ${dto.valor.toFixed(2)}`;

    return this.prisma.$transaction(async (tx) => {
      if (dto.fromCashboxId) {
        await this.closingService.assertCashboxOpenForMovement(
          dto.fromCashboxId,
          tx,
        );
      }
      if (dto.toCashboxId) {
        await this.closingService.assertCashboxOpenForMovement(
          dto.toCashboxId,
          tx,
        );
      }

      const outTransaction = await this.transactionRepository.create(
        {
          tipo: FinancialTransactionType.TRANSFERENCIA,
          origem: FinancialOriginType.TRANSFERENCIA,
          category: { connect: { id: category.id } },
          chartAccount: { connect: { id: chartAccount.id } },
          costCenter: costCenter ? { connect: { id: costCenter.id } } : undefined,
          bankAccount: dto.fromFinancialAccountId
            ? { connect: { id: dto.fromFinancialAccountId } }
            : undefined,
          cashbox: dto.fromCashboxId
            ? { connect: { id: dto.fromCashboxId } }
            : undefined,
          paymentMethod: { connect: { id: dto.paymentMethodId } },
          valor: dto.valor,
          data,
          competencia: data,
          pagamento: data,
          status: FinancialTransactionStatus.PAGO,
          observacoes: `${descricao} (saída)`,
          usuario: usuarioId ? { connect: { id: usuarioId } } : undefined,
        },
        tx,
      );

      const inTransaction = await this.transactionRepository.create(
        {
          tipo: FinancialTransactionType.TRANSFERENCIA,
          origem: FinancialOriginType.TRANSFERENCIA,
          category: { connect: { id: category.id } },
          chartAccount: { connect: { id: chartAccount.id } },
          costCenter: costCenter ? { connect: { id: costCenter.id } } : undefined,
          bankAccount: dto.toFinancialAccountId
            ? { connect: { id: dto.toFinancialAccountId } }
            : undefined,
          cashbox: dto.toCashboxId
            ? { connect: { id: dto.toCashboxId } }
            : undefined,
          paymentMethod: { connect: { id: dto.paymentMethodId } },
          valor: dto.valor,
          data,
          competencia: data,
          pagamento: data,
          status: FinancialTransactionStatus.RECEBIDO,
          observacoes: `${descricao} (entrada)`,
          usuario: usuarioId ? { connect: { id: usuarioId } } : undefined,
        },
        tx,
      );

      await this.auditService.recordCreation(
        outTransaction.id,
        new Prisma.Decimal(dto.valor),
        { usuarioId, origem: "cash_flow_transfer_out" },
        tx,
      );
      await this.auditService.recordCreation(
        inTransaction.id,
        new Prisma.Decimal(dto.valor),
        { usuarioId, origem: "cash_flow_transfer_in" },
        tx,
      );

      const transfer = await this.repository.createTransfer(
        {
          fromFinancialAccount: dto.fromFinancialAccountId
            ? { connect: { id: dto.fromFinancialAccountId } }
            : undefined,
          fromCashbox: dto.fromCashboxId
            ? { connect: { id: dto.fromCashboxId } }
            : undefined,
          toFinancialAccount: dto.toFinancialAccountId
            ? { connect: { id: dto.toFinancialAccountId } }
            : undefined,
          toCashbox: dto.toCashboxId
            ? { connect: { id: dto.toCashboxId } }
            : undefined,
          valor: dto.valor,
          outTransaction: { connect: { id: outTransaction.id } },
          inTransaction: { connect: { id: inTransaction.id } },
          usuario: usuarioId ? { connect: { id: usuarioId } } : undefined,
        },
        tx,
      );

      await this.syncService.recordFromTransaction(
        {
          transaction: outTransaction,
          usuarioId,
          tipo: CashFlowType.SAIDA,
          transferId: transfer.id,
          descricao: `${descricao} (saída)`,
        },
        tx,
      );

      await this.syncService.recordFromTransaction(
        {
          transaction: inTransaction,
          usuarioId,
          tipo: CashFlowType.ENTRADA,
          transferId: transfer.id,
          descricao: `${descricao} (entrada)`,
        },
        tx,
      );

      return {
        id: transfer.id,
        numero: transfer.numero,
        numeroFormatado: `TRF-${String(transfer.numero).padStart(6, "0")}`,
        valor: dto.valor,
        descricao,
        createdAt: transfer.createdAt.toISOString(),
      };
    });
  }

  async adjust(dto: CreateCashAdjustmentDto, usuarioId?: string) {
    if (!dto.financialAccountId && !dto.cashboxId) {
      throw new BadRequestException(
        "Informe uma conta bancária ou um caixa para o ajuste",
      );
    }

    const paymentMethod = await this.financialRepository
      .findPaymentMethods()
      .then((items) => items.find((item) => item.id === dto.paymentMethodId));

    if (!paymentMethod) {
      throw new NotFoundException("Forma de pagamento não encontrada");
    }

    const isPositive = dto.tipo === "AJUSTE_POSITIVO";
    const [category, chartAccount, costCenter] = await Promise.all([
      this.financialRepository.findCategoryByCodigo("OUTROS"),
      this.financialRepository.findChartAccountByCodigo(
        isPositive ? "VENDAS" : "DESPESAS_OUTROS",
      ),
      this.financialRepository.findPrincipalCostCenter(),
    ]);

    if (!category || !chartAccount) {
      throw new BadRequestException("Estrutura financeira base não configurada");
    }

    const data = dto.data ? new Date(dto.data) : new Date();
    const descricao =
      dto.descricao?.trim() ||
      `${dto.tipo === "AJUSTE_POSITIVO" ? "Ajuste positivo" : "Ajuste negativo"}: ${dto.motivo.trim()}`;

    return this.prisma.$transaction(async (tx) => {
      if (dto.cashboxId) {
        await this.closingService.assertCashboxOpenForMovement(dto.cashboxId, tx);
      }

      const transaction = await this.transactionRepository.create(
        {
          tipo: isPositive
            ? FinancialTransactionType.AJUSTE
            : FinancialTransactionType.DESPESA,
          origem: FinancialOriginType.AJUSTE,
          category: { connect: { id: category.id } },
          chartAccount: { connect: { id: chartAccount.id } },
          costCenter: costCenter ? { connect: { id: costCenter.id } } : undefined,
          bankAccount: dto.financialAccountId
            ? { connect: { id: dto.financialAccountId } }
            : undefined,
          cashbox: dto.cashboxId
            ? { connect: { id: dto.cashboxId } }
            : undefined,
          paymentMethod: { connect: { id: dto.paymentMethodId } },
          valor: dto.valor,
          data,
          competencia: data,
          pagamento: data,
          status: isPositive
            ? FinancialTransactionStatus.RECEBIDO
            : FinancialTransactionStatus.PAGO,
          observacoes: `${descricao} — Motivo: ${dto.motivo.trim()}`,
          usuario: usuarioId ? { connect: { id: usuarioId } } : undefined,
        },
        tx,
      );

      await this.auditService.recordCreation(
        transaction.id,
        new Prisma.Decimal(dto.valor),
        { usuarioId, origem: "cash_flow_adjustment" },
        tx,
      );

      const entry = await this.syncService.recordFromTransaction(
        {
          transaction,
          usuarioId,
          tipo: isPositive
            ? CashFlowType.AJUSTE_POSITIVO
            : CashFlowType.AJUSTE_NEGATIVO,
          descricao,
        },
        tx,
      );

      return {
        transactionId: transaction.id,
        cashFlowEntryId: entry?.id ?? null,
        tipo: dto.tipo,
        valor: dto.valor,
        descricao,
        motivo: dto.motivo.trim(),
      };
    });
  }
}
