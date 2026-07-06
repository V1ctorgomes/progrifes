import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { Transform } from "class-transformer";
import { BannerType } from "@prisma/client";

export class CreateBannerDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsOptional()
  @IsString()
  subtitulo?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsString()
  @IsNotEmpty()
  imagemDesktop!: string;

  @IsOptional()
  @IsString()
  imagemMobile?: string;

  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value,
  )
  @IsEnum(BannerType)
  tipo!: BannerType;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsString()
  textoBotaoPrimario?: string;

  @IsOptional()
  @IsString()
  textoBotaoSecundario?: string;

  @IsOptional()
  @IsString()
  linkPrimario?: string;

  @IsOptional()
  @IsString()
  linkSecundario?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class UpdateBannerDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  subtitulo?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  imagemDesktop?: string;

  @IsOptional()
  @IsString()
  imagemMobile?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value,
  )
  @IsEnum(BannerType)
  tipo?: BannerType;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsString()
  textoBotaoPrimario?: string;

  @IsOptional()
  @IsString()
  textoBotaoSecundario?: string;

  @IsOptional()
  @IsString()
  linkPrimario?: string;

  @IsOptional()
  @IsString()
  linkSecundario?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class ReorderDto {
  @IsArray()
  @IsString({ each: true })
  ids!: string[];
}
