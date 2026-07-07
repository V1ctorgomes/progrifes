import { Injectable } from "@nestjs/common";
import { Prisma, ReceivableStatus } from "@prisma/client";
import { AccountsReceivableRepository } from "./accounts-receivable.repository";

@Injectable()
export class AccountsReceivableHistoryService {
  constructor(private readonly repository: AccountsReceivableRepository) {}

  record(
    data: {
      accountReceivableId: string;
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
        accountReceivable: { connect: { id: data.accountReceivableId } },
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

export function computeReceivableStatus(
  saldo: number,
  valorRecebido: number,
  vencimento: Date,
  cancelled = false,
): ReceivableStatus {
  if (cancelled) return "CANCELADO";
  if (saldo <= 0 && valorRecebido > 0) return "RECEBIDO";
  if (valorRecebido > 0 && saldo > 0) return "PARCIALMENTE_RECEBIDO";
  if (vencimento < new Date() && saldo > 0) return "VENCIDO";
  return "PENDENTE";
}
