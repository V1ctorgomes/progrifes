import { Type, Transform } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";
import { InventoryStatus } from "@prisma/client";

export class ListInventoryQueryDto {
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
  @IsEnum(InventoryStatus)
  status?: InventoryStatus;

  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @IsOptional()
  @IsUUID()
  produtoId?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  })
  @IsBoolean()
  produtoAtivo?: boolean;

  @IsOptional()
  @IsIn([
    "disponivel_asc",
    "disponivel_desc",
    "total_asc",
    "total_desc",
    "nome",
    "categoria",
    "sku",
  ])
  sort?: "disponivel_asc" | "disponivel_desc" | "total_asc" | "total_desc" | "nome" | "categoria" | "sku";
}
