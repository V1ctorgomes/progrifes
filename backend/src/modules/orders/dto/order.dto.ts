import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";
import { PaymentMethod } from "@prisma/client";

export class CreateOrderItemDto {
  @IsUUID()
  varianteId!: string;

  @IsInt()
  @Min(1)
  quantidade!: number;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  clienteNome!: string;

  @IsString()
  @IsNotEmpty()
  clienteTelefone!: string;

  @IsOptional()
  @IsEmail()
  clienteEmail?: string;

  @IsString()
  @IsNotEmpty()
  cep!: string;

  @IsString()
  @IsNotEmpty()
  rua!: string;

  @IsString()
  @IsNotEmpty()
  numeroEndereco!: string;

  @IsString()
  @IsNotEmpty()
  bairro!: string;

  @IsString()
  @IsNotEmpty()
  cidade!: string;

  @IsString()
  @IsNotEmpty()
  estado!: string;

  @IsOptional()
  @IsString()
  complemento?: string;

  @IsOptional()
  @IsString()
  referencia?: string;

  @IsEnum(PaymentMethod)
  formaPagamento!: PaymentMethod;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  trocoPara?: number;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  itens!: CreateOrderItemDto[];
}
