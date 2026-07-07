import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InventoryAdjustmentType, InventoryAuditStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { RecountAuditDto, UpdateAuditCountsDto } from "./dto/inventory-audit.dto";

@Injectable()
export class InventoryCountService {
  constructor(private readonly prisma: PrismaService) {}

  async updateCounts(auditId: string, dto: UpdateAuditCountsDto) {
    const audit = await this.prisma.inventoryAudit.findUnique({ where: { id: auditId } });
    if (!audit) throw new NotFoundException("Inventário não encontrado");
    this.ensureEditable(audit.status);

    if (audit.status !== InventoryAuditStatus.EM_ANDAMENTO) {
      throw new BadRequestException("A contagem só pode ser registrada com inventário em andamento");
    }

    for (const item of dto.items) {
      if (item.quantidadeFisica < 0) {
        throw new BadRequestException("Quantidade física não pode ser negativa");
      }

      const auditItem = await this.prisma.inventoryAuditItem.findFirst({
        where: { id: item.itemId, auditId },
      });
      if (!auditItem) {
        throw new NotFoundException(`Item ${item.itemId} não pertence a este inventário`);
      }

      const diferenca = item.quantidadeFisica - auditItem.quantidadeSistema;
      const tipoAjuste = this.resolveAdjustmentType(diferenca);

      await this.prisma.inventoryAuditItem.update({
        where: { id: item.itemId },
        data: {
          quantidadeFisica: item.quantidadeFisica,
          diferenca,
          tipoAjuste,
          contado: true,
        },
      });
    }

    return { message: "Contagem registrada com sucesso" };
  }

  async recount(auditId: string, dto: RecountAuditDto) {
    const audit = await this.prisma.inventoryAudit.findUnique({ where: { id: auditId } });
    if (!audit) throw new NotFoundException("Inventário não encontrado");
    this.ensureEditable(audit.status);

    const where: Prisma.InventoryAuditItemWhereInput = { auditId };
    if (dto.itemIds?.length) {
      where.id = { in: dto.itemIds };
    }

    await this.prisma.inventoryAuditItem.updateMany({
      where,
      data: {
        quantidadeFisica: null,
        diferenca: null,
        tipoAjuste: null,
        contado: false,
      },
    });

    return {
      message: dto.itemIds?.length
        ? "Itens liberados para recontagem"
        : "Inventário liberado para recontagem completa",
    };
  }

  computeSummary(
    itens: Array<{
      contado: boolean;
      diferenca: number | null;
      quantidadeFisica: number | null;
      quantidadeSistema: number;
    }>,
  ) {
    const conferidos = itens.filter((item) => item.contado).length;
    const divergencias = itens.filter((item) => item.contado && item.diferenca !== 0).length;
    const totalAjustado = itens.reduce(
      (sum, item) => sum + (item.diferenca ? Math.abs(item.diferenca) : 0),
      0,
    );

    return {
      totalItens: itens.length,
      itensConferidos: conferidos,
      itensPendentes: itens.length - conferidos,
      divergencias,
      totalAjustado,
      contagemCompleta: conferidos === itens.length && itens.length > 0,
    };
  }

  private resolveAdjustmentType(diferenca: number): InventoryAdjustmentType {
    if (diferenca > 0) return InventoryAdjustmentType.ENTRADA;
    if (diferenca < 0) return InventoryAdjustmentType.SAIDA;
    return InventoryAdjustmentType.NENHUM;
  }

  private ensureEditable(status: InventoryAuditStatus) {
    if (status === InventoryAuditStatus.FINALIZADO) {
      throw new BadRequestException("Inventário finalizado não pode ser alterado");
    }
    if (status === InventoryAuditStatus.CANCELADO) {
      throw new BadRequestException("Inventário cancelado não pode ser alterado");
    }
  }
}
