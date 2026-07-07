import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
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
import {
  ExpenseRecurrenceFrequency,
  ExpenseStatus,
} from "@prisma/client";

export class ListExpensesQueryDto {
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
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @IsOptional()
  @IsUUID()
  financialAccountId?: string;

  @IsOptional()
  @IsUUID()
  paymentMethodId?: string;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  recorrente?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  variavel?: boolean;
}

export class CreateExpenseDto {
  @IsString()
  @MinLength(3)
  descricao!: string;

  @IsUUID()
  categoryId!: string;

  @IsUUID()
  chartAccountId!: string;

  @IsUUID()
  costCenterId!: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsUUID()
  financialAccountId?: string;

  @IsOptional()
  @IsUUID()
  paymentMethodId?: string;

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
  observacoes?: string;

  @IsOptional()
  @IsBoolean()
  recorrente?: boolean;

  @ValidateIf((dto: CreateExpenseDto) => Boolean(dto.recorrente))
  @IsEnum(ExpenseRecurrenceFrequency)
  frequencia?: ExpenseRecurrenceFrequency;

  @IsOptional()
  @IsBoolean()
  variavel?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(60)
  quantidadeParcelas?: number;
}

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  descricao?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  chartAccountId?: string;

  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsUUID()
  financialAccountId?: string;

  @IsOptional()
  @IsUUID()
  paymentMethodId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  valor?: number;

  @IsOptional()
  @IsDateString()
  competencia?: string;

  @IsOptional()
  @IsDateString()
  vencimento?: string;

  @IsOptional()
  @IsString()
  documento?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class PayExpenseDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  valor!: number;

  @IsUUID()
  paymentMethodId!: string;

  @ValidateIf((dto: PayExpenseDto) => !dto.cashboxId)
  @IsUUID()
  financialAccountId?: string;

  @ValidateIf((dto: PayExpenseDto) => !dto.financialAccountId)
  @IsUUID()
  cashboxId?: string;

  @IsOptional()
  @IsDateString()
  pagoEm?: string;
}

export class CancelExpenseDto {
  @IsString()
  @MinLength(3)
  motivo!: string;
}

export class ReverseExpenseDto {
  @IsUUID()
  paymentId!: string;

  @IsOptional()
  @IsString()
  motivo?: string;
}

export class CreateExpenseAttachmentDto {
  @IsString()
  @MinLength(1)
  nome!: string;

  @IsString()
  @MinLength(1)
  tipo!: string;

  @IsString()
  @MinLength(1)
  conteudoBase64!: string;
}
