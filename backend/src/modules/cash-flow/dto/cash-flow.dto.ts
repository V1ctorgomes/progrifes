import { CashFlowType } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from "class-validator";

export class ListCashFlowStatementQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(CashFlowType)
  tipo?: CashFlowType;

  @IsOptional()
  @IsUUID()
  financialAccountId?: string;

  @IsOptional()
  @IsUUID()
  cashboxId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  usuarioId?: string;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;
}

export class CreateCashTransferDto {
  @ValidateIf((dto: CreateCashTransferDto) => !dto.fromCashboxId)
  @IsUUID()
  fromFinancialAccountId?: string;

  @ValidateIf((dto: CreateCashTransferDto) => !dto.fromFinancialAccountId)
  @IsUUID()
  fromCashboxId?: string;

  @ValidateIf((dto: CreateCashTransferDto) => !dto.toCashboxId)
  @IsUUID()
  toFinancialAccountId?: string;

  @ValidateIf((dto: CreateCashTransferDto) => !dto.toFinancialAccountId)
  @IsUUID()
  toCashboxId?: string;

  @IsUUID()
  paymentMethodId!: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  valor!: number;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsDateString()
  data?: string;
}

export class CreateCashAdjustmentDto {
  @IsEnum(["AJUSTE_POSITIVO", "AJUSTE_NEGATIVO"])
  tipo!: "AJUSTE_POSITIVO" | "AJUSTE_NEGATIVO";

  @ValidateIf((dto: CreateCashAdjustmentDto) => !dto.cashboxId)
  @IsUUID()
  financialAccountId?: string;

  @ValidateIf((dto: CreateCashAdjustmentDto) => !dto.financialAccountId)
  @IsUUID()
  cashboxId?: string;

  @IsUUID()
  paymentMethodId!: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  valor!: number;

  @IsString()
  @IsNotEmpty()
  motivo!: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsDateString()
  data?: string;
}

export class OpenCashboxDto {
  @IsUUID()
  cashboxId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  saldoInicial!: number;

  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class CloseCashboxDto {
  @IsUUID()
  cashboxId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  saldoFinal?: number;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
