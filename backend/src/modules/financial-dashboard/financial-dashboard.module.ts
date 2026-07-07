import { Module } from "@nestjs/common";
import { FinancialModule } from "../financial/financial.module";
import { FinancialChartsService } from "./financial-charts.service";
import { FinancialDashboardController } from "./financial-dashboard.controller";
import { FinancialDashboardService } from "./financial-dashboard.service";
import { FinancialIndicatorsService } from "./financial-indicators.service";

@Module({
  imports: [FinancialModule],
  controllers: [FinancialDashboardController],
  providers: [
    FinancialDashboardService,
    FinancialIndicatorsService,
    FinancialChartsService,
  ],
})
export class FinancialDashboardModule {}
