import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  @IsNotEmpty()
  descricao!: string;

  @IsString()
  @IsNotEmpty()
  imagem!: string;

  @IsString()
  @IsNotEmpty()
  banner!: string;

  @IsOptional()
  @IsUUID()
  categoriaPaiId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  imagem?: string;

  @IsOptional()
  @IsString()
  banner?: string;

  @IsOptional()
  @IsUUID()
  categoriaPaiId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class ReorderCategoriesDto {
  @IsArray()
  @IsString({ each: true })
  ids!: string[];
}
