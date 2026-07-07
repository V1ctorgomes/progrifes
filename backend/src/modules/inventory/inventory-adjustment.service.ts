import { BadRequestException, Injectable } from "@nestjs/common";
import {
  InventoryAdjustmentType,
  InventoryAuditStatus,
  InventoryEntryType,
  InventoryMovementType,
  Prisma,
} from "@prisma/client";
import {
  computeDisponivel,
  computeInventoryStatus,
} from "./inventory-stock.config";
import { InventoryMovementService } from "./inventory-movement.service";
import { InventoryEntryRepository } from "./inventory-entry.repository";
import { InventoryMovementRepository } from "./inventory-movement.repository";

@Injectable()
export class InventoryAdjustmentService {
  constructor(
    private readonly movementService: InventoryMovementService,
    private readonly entryRepository: InventoryEntryRepository,
    private readonly movementRepository: InventoryMovementRepository,
  ) {}

  async applyAuditAdjustments(
    audit: {
      id: string;
      numero: number;
      itens: Array<{
        id: string;
        variantId: string;
        diferenca: number | null;
        tipoAjuste: InventoryAdjustmentType | null;
      }>;
    },
    usuarioId: string,
    tx: Prisma.TransactionClient,
  ) {
    const auditLabel = `INV-${String(audit.numero).padStart(5, "0")}`;

    for (const item of audit.itens) {
      if (!item.diferenca || item.diferenca === 0 || item.tipoAjuste === "NENHUM") {
        continue;
      }

      if (item.tipoAjuste === "ENTRADA") {
        await this.applyPositive(item.variantId, item.diferenca, audit.id, auditLabel, usuarioId, tx);
      } else if (item.tipoAjuste === "SAIDA") {
        await this.applyNegative(
          item.variantId,
          Math.abs(item.diferenca),
          audit.id,
          auditLabel,
          usuarioId,
          tx,
        );
      }
    }
  }

  private async applyPositive(
    variantId: string,
    quantidade: number,
    auditId: string,
    auditLabel: string,
    usuarioId: string,
    tx: Prisma.TransactionClient,
  ) {
    const variant = await tx.productVariant.findUnique({
      where: { id: variantId },
      include: { inventory: true },
    });
    if (!variant) return;

    let inventory = variant.inventory;
    if (!inventory) {
      inventory = await tx.inventory.create({
        data: {
          variant: { connect: { id: variantId } },
          quantidadeTotal: 0,
          quantidadeReservada: 0,
          quantidadeDisponivel: 0,
          estoqueMinimo: variant.estoqueMinimo,
          status: computeInventoryStatus(0, variant.estoqueMinimo),
        },
      });
    }

    const saldoAnterior = inventory.quantidadeTotal;
    const saldoAtual = saldoAnterior + quantidade;
    const quantidadeDisponivel = computeDisponivel(saldoAtual, inventory.quantidadeReservada);
    const status = computeInventoryStatus(quantidadeDisponivel, inventory.estoqueMinimo);

    await tx.inventory.update({
      where: { variantId },
      data: { quantidadeTotal: saldoAtual, quantidadeDisponivel, status },
    });
    await tx.productVariant.update({
      where: { id: variantId },
      data: { estoque: saldoAtual },
    });

    const entryNumero = await this.entryRepository.getNextNumero(tx);
    const entry = await this.entryRepository.create(
      {
        numero: entryNumero,
        variant: { connect: { id: variantId } },
        tipo: InventoryEntryType.AJUSTE_POSITIVO,
        quantidade,
        observacoes: `Ajuste automático do inventário ${auditLabel}`,
        usuario: { connect: { id: usuarioId } },
      },
      tx,
    );

    await this.movementService.record(
      {
        variantId,
        tipo: InventoryMovementType.ENTRADA,
        origem: "INVENTARIO",
        quantidade,
        saldoAnterior,
        saldoAtual,
        referenciaId: auditId,
        auditId,
        entryId: entry.id,
        usuarioId,
        motivo: `Ajuste positivo — inventário ${auditLabel}`,
        descricao: `Entrada gerada pelo inventário ${auditLabel}`,
      },
      tx,
    );
  }

  private async applyNegative(
    variantId: string,
    quantidade: number,
    auditId: string,
    auditLabel: string,
    usuarioId: string,
    tx: Prisma.TransactionClient,
  ) {
    const inventory = await tx.inventory.findUnique({ where: { variantId } });
    if (!inventory) {
      throw new BadRequestException(`Estoque não configurado para variante ${variantId}`);
    }

    const disponivel = computeDisponivel(inventory.quantidadeTotal, inventory.quantidadeReservada);
    if (quantidade > disponivel) {
      throw new BadRequestException(
        `Não é possível ajustar: estoque disponível insuficiente (${disponivel})`,
      );
    }

    const saldoAnterior = inventory.quantidadeTotal;
    const saldoAtual = saldoAnterior - quantidade;
    const quantidadeDisponivel = computeDisponivel(saldoAtual, inventory.quantidadeReservada);
    const status = computeInventoryStatus(quantidadeDisponivel, inventory.estoqueMinimo);

    await tx.inventory.update({
      where: { variantId },
      data: { quantidadeTotal: saldoAtual, quantidadeDisponivel, status },
    });
    await tx.productVariant.update({
      where: { id: variantId },
      data: { estoque: saldoAtual },
    });

    const numero = await this.movementRepository.getNextOutputNumero(tx);
    await this.movementService.record(
      {
        variantId,
        tipo: InventoryMovementType.SAIDA,
        origem: "INVENTARIO",
        quantidade,
        saldoAnterior,
        saldoAtual,
        referenciaId: auditId,
        auditId,
        usuarioId,
        numero,
        motivo: `Ajuste negativo — inventário ${auditLabel}`,
        descricao: `Saída gerada pelo inventário ${auditLabel}`,
      },
      tx,
    );
  }
}
