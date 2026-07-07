import { Injectable } from "@nestjs/common";
import { Prisma, PayableStatus } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class AccountsPayableService {
  constructor(private readonly prisma: PrismaService) {}

  getNextNumero(tx: Prisma.TransactionClient) {
    return tx.accountPayable
      .aggregate({ _max: { numero: true } })
      .then((result) => (result._max.numero ?? 0) + 1);
  }

  create(
    data: {
      supplierId: string;
      purchaseOrderId: string;
      goodsReceiptId?: string | null;
      descricao: string;
      valor: Prisma.Decimal;
      usuarioId?: string | null;
      vencimento?: Date | null;
    },
    tx: Prisma.TransactionClient,
  ) {
    return this.getNextNumero(tx).then((numero) =>
      tx.accountPayable.create({
        data: {
          numero,
          supplierId: data.supplierId,
          purchaseOrderId: data.purchaseOrderId,
          goodsReceiptId: data.goodsReceiptId ?? null,
          descricao: data.descricao,
          valor: data.valor,
          status: PayableStatus.PENDENTE,
          vencimento: data.vencimento ?? null,
          usuarioId: data.usuarioId ?? null,
        },
      }),
    );
  }

  formatNumero(numero: number) {
    return `CP-${String(numero).padStart(6, "0")}`;
  }
}
