import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  FinancialOriginType,
  FinancialTransactionStatus,
  FinancialTransactionType,
  PayableOriginType,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { CashClosingService } from "../cash-flow/cash-closing.service";
import { CashFlowSyncService } from "../cash-flow/cash-flow-sync.service";
import { FinancialAuditService } from "../financial/financial-audit.service";
import { FinancialRepository } from "../financial/financial.repository";
import { FinancialTransactionRepository } from "../financial/financial-transaction.repository";
import {
  AccountsPayableHistoryService,
  computePayableStatus,
} from "./accounts-payable-history.service";
import { decimal } from "./accounts-payable.mapper";
import { AccountsPayableRepository } from "./accounts-payable.repository";
import {
  CancelAccountPayableDto,
  PayAccountPayableDto,
  ReverseAccountPayableDto,
} from "./dto/accounts-payable.dto";

@Injectable()
export class PayableSettlementService {
  constructor(
    private readonly repository: AccountsPayableRepository,
    private readonly historyService: AccountsPayableHistoryService,
    private readonly financialRepository: FinancialRepository,
    private readonly transactionRepository: FinancialTransactionRepository,
    private readonly auditService: FinancialAuditService,
    private readonly cashFlowSyncService: CashFlowSyncService,
    private readonly cashClosingService: CashClosingService,
    private readonly prisma: PrismaService,
  ) {}

  async createFromGoodsReceipt(
    input: {
      supplierId: string;
      purchaseOrderId: string;
      goodsReceiptId?: string | null;
      goodsReceiptNumero: number;
      purchaseOrderNumero: number;
      valor: Prisma.Decimal;
      usuarioId?: string | null;
      vencimento?: Date | null;
      observacoes: string;
      atCompletion: boolean;
    },
    tx: Prisma.TransactionClient,
  ) {
    if (input.goodsReceiptId) {
      const existing = await this.repository.findByGoodsReceiptId(
        input.goodsReceiptId,
        tx,
      );
      if (existing) return existing;
    }

    const [category, chartAccount, costCenter, paymentMethod] = await Promise.all([
      this.financialRepository.findCategoryByCodigo("COMPRA", tx),
      this.financialRepository.findChartAccountByCodigo("DESPESAS_COMPRAS", tx),
      this.financialRepository.findPrincipalCostCenter(tx),
      this.financialRepository.findPaymentMethodByCodigo("PIX", tx),
    ]);

    if (!category || !chartAccount || !paymentMethod) {
      throw new BadRequestException("Estrutura financeira base não configurada");
    }

    const now = new Date();
    const competencia = now;
    const vencimento =
      input.vencimento ?? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const ocFormatado = `OC-${String(input.purchaseOrderNumero).padStart(6, "0")}`;
    const recFormatado = `REC-${String(input.goodsReceiptNumero).padStart(6, "0")}`;

    const account = await this.repository.create(
      {
        supplier: { connect: { id: input.supplierId } },
        originType: input.goodsReceiptId
          ? PayableOriginType.RECEBIMENTO_MERCADORIAS
          : PayableOriginType.FORNECEDOR,
        originId: input.goodsReceiptId ?? input.purchaseOrderId,
        purchaseOrder: { connect: { id: input.purchaseOrderId } },
        goodsReceipt: input.goodsReceiptId
          ? { connect: { id: input.goodsReceiptId } }
          : undefined,
        category: { connect: { id: category.id } },
        chartAccount: { connect: { id: chartAccount.id } },
        costCenter: costCenter ? { connect: { id: costCenter.id } } : undefined,
        paymentMethod: { connect: { id: paymentMethod.id } },
        documento: input.atCompletion ? ocFormatado : `${recFormatado} (${ocFormatado})`,
        valorOriginal: input.valor,
        valorPago: 0,
        saldo: input.valor,
        competencia,
        vencimento,
        status: "PENDENTE",
        observacoes: input.observacoes,
        usuario: input.usuarioId
          ? { connect: { id: input.usuarioId } }
          : undefined,
      },
      tx,
    );

    await this.historyService.record(
      {
        accountPayableId: account.id,
        operacao: "CRIACAO",
        descricao: input.goodsReceiptId
          ? "Conta a pagar criada a partir do recebimento"
          : "Conta a pagar criada na conclusão da ordem de compra",
        usuarioId: input.usuarioId,
        valorNovo: input.valor,
      },
      tx,
    );

    return account;
  }

  async pay(id: string, dto: PayAccountPayableDto, usuarioId?: string) {
    if (!dto.financialAccountId && !dto.cashboxId) {
      throw new BadRequestException(
        "Informe uma conta bancária ou um caixa para o pagamento",
      );
    }

    const account = await this.repository.findById(id);
    if (!account) throw new NotFoundException("Conta a pagar não encontrada");

    if (["CANCELADO", "PAGO", "ESTORNADO"].includes(account.status)) {
      throw new BadRequestException("Não é possível pagar esta conta a pagar");
    }

    const saldoAtual = decimal(account.saldo);
    if (dto.valor > saldoAtual) {
      throw new BadRequestException(
        "Valor do pagamento não pode ser superior ao saldo",
      );
    }

    const pagoEm = dto.pagoEm ? new Date(dto.pagoEm) : new Date();

    return this.prisma.$transaction(async (tx) => {
      if (dto.cashboxId) {
        await this.cashClosingService.assertCashboxOpenForMovement(
          dto.cashboxId,
          tx,
        );
      }

      const transaction = await this.transactionRepository.create(
        {
          tipo: FinancialTransactionType.DESPESA,
          origem: FinancialOriginType.COMPRA,
          origemReferenciaId: account.originId ?? account.id,
          category: { connect: { id: account.categoryId } },
          chartAccount: { connect: { id: account.chartAccountId } },
          costCenter: account.costCenterId
            ? { connect: { id: account.costCenterId } }
            : undefined,
          bankAccount: dto.financialAccountId
            ? { connect: { id: dto.financialAccountId } }
            : undefined,
          cashbox: dto.cashboxId
            ? { connect: { id: dto.cashboxId } }
            : undefined,
          paymentMethod: { connect: { id: dto.paymentMethodId } },
          valor: dto.valor,
          data: pagoEm,
          competencia: account.competencia,
          vencimento: account.vencimento,
          pagamento: pagoEm,
          status: FinancialTransactionStatus.PAGO,
          observacoes: `Pagamento da conta ${account.numero}`,
          usuario: usuarioId ? { connect: { id: usuarioId } } : undefined,
        },
        tx,
      );

      await this.auditService.recordCreation(
        transaction.id,
        new Prisma.Decimal(dto.valor),
        { usuarioId, origem: "accounts_payable" },
        tx,
      );

      await this.cashFlowSyncService.recordFromTransaction(
        {
          transaction,
          usuarioId,
          descricao: `Pagamento da conta ${account.numero}`,
        },
        tx,
      );

      await this.repository.createPayment(
        {
          accountPayable: { connect: { id: account.id } },
          financialTransaction: { connect: { id: transaction.id } },
          valor: dto.valor,
          paymentMethod: { connect: { id: dto.paymentMethodId } },
          financialAccount: dto.financialAccountId
            ? { connect: { id: dto.financialAccountId } }
            : undefined,
          cashbox: dto.cashboxId
            ? { connect: { id: dto.cashboxId } }
            : undefined,
          pagoEm,
          usuario: usuarioId ? { connect: { id: usuarioId } } : undefined,
        },
        tx,
      );

      const valorPago = decimal(account.valorPago) + dto.valor;
      const saldo = decimal(account.valorOriginal) - valorPago;
      const status = computePayableStatus(saldo, valorPago, account.vencimento);

      const updated = await this.repository.update(
        account.id,
        { valorPago, saldo, status },
        tx,
      );

      await this.historyService.record(
        {
          accountPayableId: account.id,
          operacao: "PAGAMENTO",
          descricao: `Pagamento registrado: R$ ${dto.valor.toFixed(2)}`,
          usuarioId,
          valorAnterior: account.saldo,
          valorNovo: saldo,
        },
        tx,
      );

      return updated;
    });
  }

  async reverse(id: string, dto: ReverseAccountPayableDto, usuarioId?: string) {
    const account = await this.repository.findById(id);
    if (!account) throw new NotFoundException("Conta a pagar não encontrada");

    const payment = await this.repository.findPaymentById(dto.paymentId);
    if (!payment || payment.accountPayableId !== id) {
      throw new NotFoundException("Pagamento não encontrado");
    }

    if (payment.estornado) {
      throw new BadRequestException("Pagamento já estornado");
    }

    return this.prisma.$transaction(async (tx) => {
      if (payment.cashboxId) {
        await this.cashClosingService.assertCashboxOpenForMovement(
          payment.cashboxId,
          tx,
        );
      }

      const reversal = await this.transactionRepository.create(
        {
          tipo: FinancialTransactionType.RECEITA,
          origem: FinancialOriginType.AJUSTE,
          origemReferenciaId: payment.id,
          category: { connect: { id: account.categoryId } },
          chartAccount: { connect: { id: account.chartAccountId } },
          costCenter: account.costCenterId
            ? { connect: { id: account.costCenterId } }
            : undefined,
          bankAccount: payment.financialAccountId
            ? { connect: { id: payment.financialAccountId } }
            : undefined,
          cashbox: payment.cashboxId
            ? { connect: { id: payment.cashboxId } }
            : undefined,
          paymentMethod: { connect: { id: payment.paymentMethodId } },
          valor: payment.valor,
          data: new Date(),
          competencia: account.competencia,
          pagamento: new Date(),
          status: FinancialTransactionStatus.RECEBIDO,
          observacoes:
            dto.motivo?.trim() ||
            `Estorno do pagamento da conta ${account.numero}`,
          usuario: usuarioId ? { connect: { id: usuarioId } } : undefined,
        },
        tx,
      );

      await this.auditService.recordCreation(
        reversal.id,
        payment.valor,
        { usuarioId, origem: "accounts_payable_reversal" },
        tx,
      );

      await this.cashFlowSyncService.recordFromTransaction(
        {
          transaction: reversal,
          usuarioId,
          descricao:
            dto.motivo?.trim() ||
            `Estorno do pagamento da conta ${account.numero}`,
        },
        tx,
      );

      await this.repository.updatePayment(
        payment.id,
        {
          estornado: true,
          estornoTransaction: { connect: { id: reversal.id } },
        },
        tx,
      );

      const valorPago = decimal(account.valorPago) - decimal(payment.valor);
      const saldo = decimal(account.valorOriginal) - valorPago;
      const status = computePayableStatus(saldo, valorPago, account.vencimento);

      const updated = await this.repository.update(
        account.id,
        { valorPago, saldo, status },
        tx,
      );

      await this.historyService.record(
        {
          accountPayableId: account.id,
          operacao: "ESTORNO",
          descricao:
            dto.motivo?.trim() ||
            `Estorno de pagamento: R$ ${decimal(payment.valor).toFixed(2)}`,
          usuarioId,
          valorAnterior: account.saldo,
          valorNovo: saldo,
        },
        tx,
      );

      return updated;
    });
  }

  async cancel(id: string, dto: CancelAccountPayableDto, usuarioId?: string) {
    const account = await this.repository.findById(id);
    if (!account) throw new NotFoundException("Conta a pagar não encontrada");

    if (account.status === "CANCELADO") {
      throw new BadRequestException("Conta já cancelada");
    }

    if (decimal(account.valorPago) > 0) {
      throw new BadRequestException(
        "Não é possível cancelar conta com pagamentos registrados",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await this.repository.update(
        account.id,
        { status: "CANCELADO", saldo: 0 },
        tx,
      );

      await this.historyService.record(
        {
          accountPayableId: account.id,
          operacao: "CANCELAMENTO",
          descricao: dto.motivo.trim(),
          usuarioId,
          valorAnterior: account.saldo,
          valorNovo: 0,
        },
        tx,
      );

      return updated;
    });
  }
}
