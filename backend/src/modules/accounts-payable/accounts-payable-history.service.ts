import { Injectable } from "@nestjs/common";
import { PayableStatus, Prisma } from "@prisma/client";
import { AccountsPayableRepository } from "./accounts-payable.repository";

@Injectable()
export class AccountsPayableHistoryService {
  constructor(private readonly repository: AccountsPayableRepository) {}

  record(
    data: {
      accountPayableId: string;
      operacao: string;
      descricao: string;
      usuarioId?: string | null;
      valorAnterior?: Prisma.Decimal | number | null;
      valorNovo?: Prisma.Decimal | number | null;
    },
    tx: Prisma.TransactionClient,
  ) {
    return this.repository.createHistory(
      {
        accountPayable: { connect: { id: data.accountPayableId } },
        operacao: data.operacao,
        descricao: data.descricao,
        valorAnterior: data.valorAnterior ?? null,
        valorNovo: data.valorNovo ?? null,
        usuario: data.usuarioId
          ? { connect: { id: data.usuarioId } }
          : undefined,
      },
      tx,
    );
  }
}

export function computePayableStatus(
  saldo: number,
  valorPago: number,
  vencimento: Date,
  cancelled = false,
): PayableStatus {
  if (cancelled) return "CANCELADO";
  if (saldo <= 0 && valorPago > 0) return "PAGO";
  if (valorPago > 0 && saldo > 0) return "PARCIALMENTE_PAGO";
  if (vencimento < new Date() && saldo > 0) return "VENCIDO";
  return "PENDENTE";
}
