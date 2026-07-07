import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";
import { OrderStatus, PaymentMethod } from "@prisma/client";

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

export class ListOrdersQueryDto {
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
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentMethod)
  formaPagamento?: PaymentMethod;

  @IsOptional()
  @IsString()
  bairro?: string;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valorMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valorMax?: number;

  @IsOptional()
  @IsIn(["recent", "oldest", "total_desc", "total_asc", "status"])
  sort?: "recent" | "oldest" | "total_desc" | "total_asc" | "status";
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}

export class CancelOrderDto {
  @IsString()
  @IsNotEmpty()
  motivo!: string;
}
