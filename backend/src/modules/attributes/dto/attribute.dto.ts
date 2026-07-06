import { Type } from "class-transformer";
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

export class AttributeValueDto {
  @IsString()
  @IsNotEmpty()
  valor!: string;
}

export class CreateAttributeDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeValueDto)
  valores?: AttributeValueDto[];
}

export class UpdateAttributeDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  tipo?: string;
}

export class AddAttributeValueDto {
  @IsString()
  @IsNotEmpty()
  valor!: string;
}
