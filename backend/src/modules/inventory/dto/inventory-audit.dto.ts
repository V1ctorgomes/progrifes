import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ArrayMinSize,
} from "class-validator";
import { InventoryAuditStatus, InventoryAuditType } from "@prisma/client";

export class CreateInventoryAuditDto {
  @IsString()
  @MaxLength(120)
  nome!: string;

  @IsEnum(InventoryAuditType)
  tipo!: InventoryAuditType;

  @IsOptional()
  @IsDateString()
  dataInventario?: string;

  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @IsOptional()
  @IsUUID()
  produtoId?: string;

  @IsOptional()
  @IsUUID()
  variantId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  @ArrayMinSize(1)
  variantIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacoes?: string;
}

export class ListInventoryAuditsQueryDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(InventoryAuditStatus)
  status?: InventoryAuditStatus;

  @IsOptional()
  @IsEnum(InventoryAuditType)
  tipo?: InventoryAuditType;

  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @IsOptional()
  @IsUUID()
  usuarioId?: string;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;
}

export class UpdateAuditCountsDto {
  @IsArray()
  @ArrayMinSize(1)
  items!: Array<{
    itemId: string;
    quantidadeFisica: number;
  }>;
}

export class RecountAuditDto {
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  itemIds?: string[];
}
