import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";
import { InventoryOutputType, MANUAL_OUTPUT_TYPES } from "../inventory-output.types";

export class CreateInventoryOutputDto {
  @IsUUID()
  variantId!: string;

  @IsIn(MANUAL_OUTPUT_TYPES)
  tipo!: InventoryOutputType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantidade!: number;

  @IsString()
  @MaxLength(200)
  motivo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  documento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacoes?: string;
}

export class ListInventoryOutputsQueryDto {
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
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsUUID()
  produtoId?: string;

  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @IsOptional()
  @IsUUID()
  usuarioId?: string;

  @IsOptional()
  @IsString()
  dataInicio?: string;

  @IsOptional()
  @IsString()
  dataFim?: string;
}
