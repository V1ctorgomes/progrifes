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
import { PayableOriginType, PayableStatus } from "@prisma/client";

export class ListAccountsPayableQueryDto {
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
    "PAGO",
    "PARCIALMENTE_PAGO",
    "VENCIDO",
    "CANCELADO",
    "ESTORNADO",
  ])
  status?: PayableStatus;

  @IsOptional()
  @IsString()
  supplierId?: string;

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

export class CreateAccountPayableDto {
  @IsUUID()
  supplierId!: string;

  @IsIn([
    "RECEBIMENTO_MERCADORIAS",
    "COMPRA_MANUAL",
    "DESPESA_MANUAL",
    "FORNECEDOR",
    "AJUSTE_FINANCEIRO",
    "OUTRAS_OBRIGACOES",
  ])
  originType!: PayableOriginType;

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
  numeroNota?: string;

  @IsOptional()
  @IsString()
  referenciaExterna?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class PayAccountPayableDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  valor!: number;

  @IsUUID()
  paymentMethodId!: string;

  @ValidateIf((dto: PayAccountPayableDto) => !dto.cashboxId)
  @IsUUID()
  financialAccountId?: string;

  @ValidateIf((dto: PayAccountPayableDto) => !dto.financialAccountId)
  @IsUUID()
  cashboxId?: string;

  @IsOptional()
  @IsDateString()
  pagoEm?: string;
}

export class CancelAccountPayableDto {
  @IsString()
  @MinLength(3)
  motivo!: string;
}

export class ReverseAccountPayableDto {
  @IsUUID()
  paymentId!: string;

  @IsOptional()
  @IsString()
  motivo?: string;
}
