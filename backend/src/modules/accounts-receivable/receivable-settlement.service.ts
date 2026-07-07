import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  FinancialOriginType,
  FinancialTransactionStatus,
  FinancialTransactionType,
  PaymentMethod,
  Prisma,
  ReceivableOriginType,
} from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { CashClosingService } from "../cash-flow/cash-closing.service";
import { CashFlowSyncService } from "../cash-flow/cash-flow-sync.service";
import { FinancialAuditService } from "../financial/financial-audit.service";
import { FinancialRepository } from "../financial/financial.repository";
import { FinancialTransactionRepository } from "../financial/financial-transaction.repository";
import {
  AccountsReceivableHistoryService,
  computeReceivableStatus,
} from "./accounts-receivable-history.service";
import { decimal } from "./accounts-receivable.mapper";
import { AccountsReceivableRepository } from "./accounts-receivable.repository";
import {
  CancelAccountReceivableDto,
  ReceiveAccountReceivableDto,
  ReverseAccountReceivableDto,
} from "./dto/accounts-receivable.dto";

const ORDER_PAYMENT_METHOD_MAP: Record<PaymentMethod, string> = {
  PIX: "PIX",
  DINHEIRO: "DINHEIRO",
  CARTAO_ENTREGA: "CARTAO_CREDITO",
};

@Injectable()
export class ReceivableSettlementService {
  constructor(
    private readonly repository: AccountsReceivableRepository,
    private readonly historyService: AccountsReceivableHistoryService,
    private readonly financialRepository: FinancialRepository,
    private readonly transactionRepository: FinancialTransactionRepository,
    private readonly auditService: FinancialAuditService,
    private readonly cashFlowSyncService: CashFlowSyncService,
    private readonly cashClosingService: CashClosingService,
    private readonly prisma: PrismaService,
  ) {}

  mapOrderPaymentMethod(formaPagamento: PaymentMethod) {
    return ORDER_PAYMENT_METHOD_MAP[formaPagamento];
  }

  async createFromOrder(
    order: {
      id: string;
      numero: number;
      customerId: string | null;
      total: Prisma.Decimal;
      formaPagamento: PaymentMethod;
      createdAt: Date;
    },
    usuarioId: string | null | undefined,
    tx: Prisma.TransactionClient,
  ) {
    if (!order.customerId) return null;

    const existing = await this.repository.findByOrderId(order.id, tx);
    if (existing) return existing;

    const [category, chartAccount, costCenter, paymentMethod] = await Promise.all([
      this.financialRepository.findCategoryByCodigo("VENDA", tx),
      this.financialRepository.findChartAccountByCodigo("RECEITAS_VENDAS", tx),
      this.financialRepository.findPrincipalCostCenter(tx),
      this.financialRepository.findPaymentMethodByCodigo(
        this.mapOrderPaymentMethod(order.formaPagamento),
        tx,
      ),
    ]);

    if (!category || !chartAccount || !paymentMethod) {
      throw new BadRequestException("Estrutura financeira base não configurada");
    }

    const competencia = order.createdAt;
    const vencimento = new Date(order.createdAt);
    vencimento.setDate(vencimento.getDate() + 7);

    const valorOriginal = order.total;
    const account = await this.repository.create(
      {
        customer: { connect: { id: order.customerId } },
        originType: ReceivableOriginType.PEDIDO,
        originId: order.id,
        order: { connect: { id: order.id } },
        category: { connect: { id: category.id } },
        chartAccount: { connect: { id: chartAccount.id } },
        costCenter: costCenter
          ? { connect: { id: costCenter.id } }
          : undefined,
        paymentMethod: { connect: { id: paymentMethod.id } },
        documento: `PED-${String(order.numero).padStart(6, "0")}`,
        valorOriginal,
        valorRecebido: 0,
        saldo: valorOriginal,
        competencia,
        vencimento,
        status: "PENDENTE",
        observacoes: `Conta a receber gerada automaticamente do pedido PED-${String(order.numero).padStart(6, "0")}`,
        usuario: usuarioId ? { connect: { id: usuarioId } } : undefined,
      },
      tx,
    );

    await this.historyService.record(
      {
        accountReceivableId: account.id,
        operacao: "CRIACAO",
        descricao: "Conta a receber criada a partir do pedido",
        usuarioId,
        valorNovo: valorOriginal,
      },
      tx,
    );

    return account;
  }

  async cancelFromOrder(
    orderId: string,
    motivo: string,
    usuarioId: string | null | undefined,
    tx: Prisma.TransactionClient,
  ) {
    const account = await this.repository.findByOrderId(orderId, tx);
    if (!account || account.status === "CANCELADO") return null;

    if (decimal(account.valorRecebido) > 0) {
      throw new BadRequestException(
        "Não é possível cancelar conta a receber com recebimentos registrados",
      );
    }

    return this.repository.update(
      account.id,
      { status: "CANCELADO", saldo: 0 },
      tx,
    ).then(async (updated) => {
      await this.historyService.record(
        {
          accountReceivableId: account.id,
          operacao: "CANCELAMENTO",
          descricao: `Conta cancelada por cancelamento do pedido: ${motivo}`,
          usuarioId,
          valorAnterior: account.saldo,
          valorNovo: 0,
        },
        tx,
      );
      return updated;
    });
  }

  async receive(
    id: string,
    dto: ReceiveAccountReceivableDto,
    usuarioId?: string,
  ) {
    if (!dto.financialAccountId && !dto.cashboxId) {
      throw new BadRequestException(
        "Informe uma conta bancária ou um caixa para o recebimento",
      );
    }

    const account = await this.repository.findById(id);
    if (!account) throw new NotFoundException("Conta a receber não encontrada");

    if (["CANCELADO", "RECEBIDO", "ESTORNADO"].includes(account.status)) {
      throw new BadRequestException(
        "Não é possível receber esta conta a receber",
      );
    }

    const saldoAtual = decimal(account.saldo);
    if (dto.valor > saldoAtual) {
      throw new BadRequestException(
        "Valor do recebimento não pode ser superior ao saldo",
      );
    }

    const recebidoEm = dto.recebidoEm ? new Date(dto.recebidoEm) : new Date();

    return this.prisma.$transaction(async (tx) => {
      if (dto.cashboxId) {
        await this.cashClosingService.assertCashboxOpenForMovement(
          dto.cashboxId,
          tx,
        );
      }

      const transaction = await this.transactionRepository.create(
        {
          tipo: FinancialTransactionType.RECEITA,
          origem:
            account.originType === ReceivableOriginType.PEDIDO
              ? FinancialOriginType.PEDIDO
              : FinancialOriginType.CLIENTE,
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
          data: recebidoEm,
          competencia: account.competencia,
          vencimento: account.vencimento,
          pagamento: recebidoEm,
          status: FinancialTransactionStatus.RECEBIDO,
          observacoes: `Recebimento da conta ${account.numero}`,
          usuario: usuarioId ? { connect: { id: usuarioId } } : undefined,
        },
        tx,
      );

      await this.auditService.recordCreation(
        transaction.id,
        new Prisma.Decimal(dto.valor),
        { usuarioId, origem: "accounts_receivable" },
        tx,
      );

      await this.cashFlowSyncService.recordFromTransaction(
        {
          transaction,
          usuarioId,
          descricao: `Recebimento da conta ${account.numero}`,
        },
        tx,
      );

      await this.repository.createReceipt(
        {
          accountReceivable: { connect: { id: account.id } },
          financialTransaction: { connect: { id: transaction.id } },
          valor: dto.valor,
          paymentMethod: { connect: { id: dto.paymentMethodId } },
          financialAccount: dto.financialAccountId
            ? { connect: { id: dto.financialAccountId } }
            : undefined,
          cashbox: dto.cashboxId
            ? { connect: { id: dto.cashboxId } }
            : undefined,
          recebidoEm,
          usuario: usuarioId ? { connect: { id: usuarioId } } : undefined,
        },
        tx,
      );

      const valorRecebido = decimal(account.valorRecebido) + dto.valor;
      const saldo = decimal(account.valorOriginal) - valorRecebido;
      const status = computeReceivableStatus(
        saldo,
        valorRecebido,
        account.vencimento,
      );

      const updated = await this.repository.update(
        account.id,
        {
          valorRecebido,
          saldo,
          status,
        },
        tx,
      );

      await this.historyService.record(
        {
          accountReceivableId: account.id,
          operacao: "RECEBIMENTO",
          descricao: `Recebimento registrado: R$ ${dto.valor.toFixed(2)}`,
          usuarioId,
          valorAnterior: account.saldo,
          valorNovo: saldo,
        },
        tx,
      );

      return updated;
    });
  }

  async reverse(
    id: string,
    dto: ReverseAccountReceivableDto,
    usuarioId?: string,
  ) {
    const account = await this.repository.findById(id);
    if (!account) throw new NotFoundException("Conta a receber não encontrada");

    const receipt = await this.repository.findReceiptById(dto.receiptId);
    if (!receipt || receipt.accountReceivableId !== id) {
      throw new NotFoundException("Recebimento não encontrado");
    }

    if (receipt.estornado) {
      throw new BadRequestException("Recebimento já estornado");
    }

    return this.prisma.$transaction(async (tx) => {
      if (receipt.cashboxId) {
        await this.cashClosingService.assertCashboxOpenForMovement(
          receipt.cashboxId,
          tx,
        );
      }

      const reversal = await this.transactionRepository.create(
        {
          tipo: FinancialTransactionType.DESPESA,
          origem: FinancialOriginType.AJUSTE,
          origemReferenciaId: receipt.id,
          category: { connect: { id: account.categoryId } },
          chartAccount: { connect: { id: account.chartAccountId } },
          costCenter: account.costCenterId
            ? { connect: { id: account.costCenterId } }
            : undefined,
          bankAccount: receipt.financialAccountId
            ? { connect: { id: receipt.financialAccountId } }
            : undefined,
          cashbox: receipt.cashboxId
            ? { connect: { id: receipt.cashboxId } }
            : undefined,
          paymentMethod: { connect: { id: receipt.paymentMethodId } },
          valor: receipt.valor,
          data: new Date(),
          competencia: account.competencia,
          pagamento: new Date(),
          status: FinancialTransactionStatus.PAGO,
          observacoes:
            dto.motivo?.trim() ||
            `Estorno do recebimento da conta ${account.numero}`,
          usuario: usuarioId ? { connect: { id: usuarioId } } : undefined,
        },
        tx,
      );

      await this.auditService.recordCreation(
        reversal.id,
        receipt.valor,
        { usuarioId, origem: "accounts_receivable_reversal" },
        tx,
      );

      await this.cashFlowSyncService.recordFromTransaction(
        {
          transaction: reversal,
          usuarioId,
          descricao:
            dto.motivo?.trim() ||
            `Estorno do recebimento da conta ${account.numero}`,
        },
        tx,
      );

      await this.repository.updateReceipt(
        receipt.id,
        {
          estornado: true,
          estornoTransaction: { connect: { id: reversal.id } },
        },
        tx,
      );

      const valorRecebido = decimal(account.valorRecebido) - decimal(receipt.valor);
      const saldo = decimal(account.valorOriginal) - valorRecebido;
      const status =
        valorRecebido <= 0
          ? computeReceivableStatus(saldo, valorRecebido, account.vencimento)
          : computeReceivableStatus(saldo, valorRecebido, account.vencimento);

      const updated = await this.repository.update(
        account.id,
        {
          valorRecebido,
          saldo,
          status,
        },
        tx,
      );

      await this.historyService.record(
        {
          accountReceivableId: account.id,
          operacao: "ESTORNO",
          descricao:
            dto.motivo?.trim() ||
            `Estorno de recebimento: R$ ${decimal(receipt.valor).toFixed(2)}`,
          usuarioId,
          valorAnterior: account.saldo,
          valorNovo: saldo,
        },
        tx,
      );

      return updated;
    });
  }

  async cancel(id: string, dto: CancelAccountReceivableDto, usuarioId?: string) {
    const account = await this.repository.findById(id);
    if (!account) throw new NotFoundException("Conta a receber não encontrada");

    if (account.status === "CANCELADO") {
      throw new BadRequestException("Conta já cancelada");
    }

    if (decimal(account.valorRecebido) > 0) {
      throw new BadRequestException(
        "Não é possível cancelar conta com recebimentos registrados",
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
          accountReceivableId: account.id,
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
