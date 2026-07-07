import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CashClosingStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { FinancialRepository } from "../financial/financial.repository";
import { CashFlowRepository } from "./cash-flow.repository";
import { CloseCashboxDto, OpenCashboxDto } from "./dto/cash-flow.dto";
import { decimal, mapCashClosing } from "./cash-flow.mapper";

@Injectable()
export class CashClosingService {
  constructor(
    private readonly repository: CashFlowRepository,
    private readonly financialRepository: FinancialRepository,
    private readonly prisma: PrismaService,
  ) {}

  async assertCashboxOpenForMovement(
    cashboxId: string,
    tx: Prisma.TransactionClient,
  ) {
    const latest = await this.repository.findLatestClosing(cashboxId, tx);
    if (latest?.status === CashClosingStatus.FECHADO) {
      const open = await this.repository.findOpenClosing(cashboxId, tx);
      if (!open) {
        throw new BadRequestException(
          "Caixa fechado. Abra o caixa antes de registrar movimentações.",
        );
      }
    }
  }

  async open(dto: OpenCashboxDto, usuarioId?: string) {
    const cashbox = await this.financialRepository
      .findCashboxes()
      .then((items) => items.find((item) => item.id === dto.cashboxId));

    if (!cashbox) {
      throw new NotFoundException("Caixa não encontrado");
    }

    const openClosing = await this.repository.findOpenClosing(dto.cashboxId);
    if (openClosing) {
      throw new BadRequestException(
        "Já existe uma abertura de caixa em andamento",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const closing = await this.repository.createClosing(
        {
          cashbox: { connect: { id: dto.cashboxId } },
          saldoInicial: dto.saldoInicial,
          status: CashClosingStatus.ABERTO,
          observacoes: dto.observacoes?.trim() || null,
          usuario: usuarioId ? { connect: { id: usuarioId } } : undefined,
        },
        tx,
      );

      return mapCashClosing(closing);
    });
  }

  async close(dto: CloseCashboxDto, usuarioId?: string) {
    const openClosing = await this.repository.findOpenClosing(dto.cashboxId);
    if (!openClosing) {
      throw new BadRequestException("Não há caixa aberto para fechamento");
    }

    const lastEntry = await this.repository.findLastSaldo(this.prisma, {
      cashboxId: dto.cashboxId,
    });
    const saldoCalculado = lastEntry
      ? decimal(lastEntry.saldoApos)
      : decimal(openClosing.saldoInicial);
    const saldoFinal = dto.saldoFinal ?? saldoCalculado;

    return this.prisma.$transaction(async (tx) => {
      const closing = await this.repository.updateClosing(
        openClosing.id,
        {
          saldoFinal,
          status: CashClosingStatus.FECHADO,
          closedAt: new Date(),
          observacoes: dto.observacoes?.trim() || openClosing.observacoes,
          usuario: usuarioId ? { connect: { id: usuarioId } } : undefined,
        },
        tx,
      );

      return mapCashClosing(closing);
    });
  }

  listByCashbox(cashboxId: string) {
    return this.repository
      .listClosingsByCashbox(cashboxId)
      .then((items) => items.map(mapCashClosing));
  }
}
