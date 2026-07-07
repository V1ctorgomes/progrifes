import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import {
  FinancialOriginType,
  FinancialTransactionStatus,
  FinancialTransactionType,
} from "@prisma/client";

export class ListFinancialTransactionsQueryDto {
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
  tipo?: FinancialTransactionType;

  @IsOptional()
  @IsString()
  status?: FinancialTransactionStatus;

  @IsOptional()
  @IsString()
  origem?: FinancialOriginType;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  bankAccountId?: string;

  @IsOptional()
  @IsString()
  cashboxId?: string;

  @IsOptional()
  @IsString()
  dataInicio?: string;

  @IsOptional()
  @IsString()
  dataFim?: string;
}
