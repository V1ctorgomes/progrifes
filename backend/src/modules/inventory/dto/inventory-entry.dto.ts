import { InventoryEntryType } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";

export class CreateInventoryEntryDto {
  @IsUUID()
  variantId!: string;

  @IsEnum(InventoryEntryType)
  tipo!: InventoryEntryType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantidade!: number;

  @IsOptional()
  @IsDateString()
  dataEntrada?: string;

  @IsOptional()
  @Type(() => Number)
  valorUnitario?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  documento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  notaFiscal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  fornecedor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacoes?: string;
}

export class ListInventoryEntriesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(InventoryEntryType)
  tipo?: InventoryEntryType;

  @IsOptional()
  @IsUUID()
  produtoId?: string;

  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @IsOptional()
  @IsString()
  fornecedor?: string;

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
