import { Type } from "class-transformer";
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from "class-validator";
import { ReceivableOriginType, ReceivableStatus } from "@prisma/client";

export class ListAccountsReceivableQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn([
    "PENDENTE",
    "RECEBIDO",
    "PARCIALMENTE_RECEBIDO",
    "VENCIDO",
    "CANCELADO",
    "ESTORNADO",
  ])
  status?: ReceivableStatus;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @IsOptional()
  @IsString()
  financialAccountId?: string;

  @IsOptional()
  @IsString()
  costCenterId?: string;

  @IsOptional()
  @IsString()
  dataInicio?: string;

  @IsOptional()
  @IsString()
  dataFim?: string;
}

export class CreateAccountReceivableDto {
  @IsUUID()
  customerId!: string;

  @IsIn([
    "PEDIDO",
    "VENDA_MANUAL",
    "LANCAMENTO_MANUAL",
    "AJUSTE_FINANCEIRO",
    "OUTRAS_RECEITAS",
  ])
  originType!: ReceivableOriginType;

  @IsOptional()
  @IsString()
  originId?: string;

  @IsUUID()
  categoryId!: string;

  @IsUUID()
  chartAccountId!: string;

  @IsUUID()
  paymentMethodId!: string;

  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @IsOptional()
  @IsUUID()
  financialAccountId?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  valor!: number;

  @IsDateString()
  competencia!: string;

  @IsDateString()
  vencimento!: string;

  @IsOptional()
  @IsString()
  documento?: string;

  @IsOptional()
  @IsString()
  referenciaExterna?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class ReceiveAccountReceivableDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  valor!: number;

  @IsUUID()
  paymentMethodId!: string;

  @ValidateIf((dto: ReceiveAccountReceivableDto) => !dto.cashboxId)
  @IsUUID()
  financialAccountId?: string;

  @ValidateIf((dto: ReceiveAccountReceivableDto) => !dto.financialAccountId)
  @IsUUID()
  cashboxId?: string;

  @IsOptional()
  @IsDateString()
  recebidoEm?: string;
}

export class CancelAccountReceivableDto {
  @IsString()
  @MinLength(3)
  motivo!: string;
}

export class ReverseAccountReceivableDto {
  @IsUUID()
  receiptId!: string;

  @IsOptional()
  @IsString()
  motivo?: string;
}
