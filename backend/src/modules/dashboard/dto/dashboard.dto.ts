import { IsDateString, IsIn, IsOptional } from "class-validator";
import { AdminDashboardPeriodPreset } from "../dashboard.utils";

export class DashboardQueryDto {
  @IsOptional()
  @IsIn([
    "HOJE",
    "ONTEM",
    "ULTIMOS_7_DIAS",
    "ULTIMOS_30_DIAS",
    "ESTE_MES",
    "MES_ANTERIOR",
    "PERSONALIZADO",
  ])
  preset?: AdminDashboardPeriodPreset;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;
}
