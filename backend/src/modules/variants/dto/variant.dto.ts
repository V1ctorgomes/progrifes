import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";

export class VariantImageDto {
  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;

  @IsOptional()
  @IsBoolean()
  principal?: boolean;
}

export class CreateVariantDto {
  @IsUUID()
  produtoId!: string;

  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsOptional()
  @IsString()
  codigoBarras?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  preco?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precoPromocional?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  custo?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  estoque?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  estoqueMinimo?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsArray()
  @IsUUID("4", { each: true })
  attributeValueIds!: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantImageDto)
  imagens?: VariantImageDto[];
}

export class UpdateVariantDto {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  codigoBarras?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  preco?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precoPromocional?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  custo?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  estoque?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  estoqueMinimo?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  attributeValueIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantImageDto)
  imagens?: VariantImageDto[];
}

export class ListVariantsQueryDto {
  @IsOptional()
  @IsUUID()
  produtoId?: string;

  @IsOptional()
  @IsString()
  search?: string;

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
  @Transform(({ value }) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  })
  @IsBoolean()
  ativo?: boolean;
}

export class GenerateVariantsDto {
  @IsUUID()
  produtoId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeGroupDto)
  grupos!: AttributeGroupDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  estoqueInicial?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  estoqueMinimo?: number;
}

export class AttributeGroupDto {
  @IsUUID()
  attributeId!: string;

  @IsArray()
  @IsUUID("4", { each: true })
  valueIds!: string[];
}

export class BulkUpdateVariantsDto {
  @IsArray()
  @IsUUID("4", { each: true })
  ids!: string[];

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  preco?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precoPromocional?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  custo?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  estoque?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  estoqueMinimo?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
