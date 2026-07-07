import { IsDateString, IsIn, IsOptional } from "class-validator";
import { DashboardPeriodPreset } from "../financial-dashboard.utils";

export class FinancialDashboardQueryDto {
  @IsOptional()
  @IsIn([
    "HOJE",
    "ULTIMOS_7_DIAS",
    "ULTIMOS_30_DIAS",
    "ESTE_MES",
    "ESTE_ANO",
    "PERSONALIZADO",
  ])
  preset?: DashboardPeriodPreset;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;
}

export class FinancialDashboardSummaryQueryDto extends FinancialDashboardQueryDto {
  @IsOptional()
  @IsIn(["DIA", "SEMANA", "MES", "ANO"])
  comparativo?: "DIA" | "SEMANA" | "MES" | "ANO";
}
