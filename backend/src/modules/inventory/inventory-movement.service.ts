import { Injectable } from "@nestjs/common";
import { InventoryMovementType, Prisma } from "@prisma/client";
import { InventoryRepository } from "./inventory.repository";

export type RecordMovementInput = {
  variantId: string;
  tipo: InventoryMovementType;
  quantidade: number;
  descricao: string;
  origem?: string;
  saldoAnterior?: number;
  saldoAtual?: number;
  referenciaId?: string;
  orderId?: string;
  entryId?: string;
  auditId?: string;
  usuarioId?: string;
  motivo?: string;
  documento?: string;
  numero?: number;
};

@Injectable()
export class InventoryMovementService {
  constructor(private readonly repository: InventoryRepository) {}

  record(input: RecordMovementInput, tx: Prisma.TransactionClient) {
    return this.repository.createMovement(
      {
        numero: input.numero,
        variant: { connect: { id: input.variantId } },
        order: input.orderId ? { connect: { id: input.orderId } } : undefined,
        entry: input.entryId ? { connect: { id: input.entryId } } : undefined,
        audit: input.auditId ? { connect: { id: input.auditId } } : undefined,
        usuario: input.usuarioId ? { connect: { id: input.usuarioId } } : undefined,
        tipo: input.tipo,
        origem: input.origem,
        quantidade: input.quantidade,
        saldoAnterior: input.saldoAnterior,
        saldoAtual: input.saldoAtual,
        referenciaId: input.referenciaId,
        motivo: input.motivo,
        documento: input.documento,
        descricao: input.descricao,
      },
      tx,
    );
  }
}
