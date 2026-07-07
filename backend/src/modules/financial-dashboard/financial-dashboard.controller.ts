import { Controller, Get, Query } from "@nestjs/common";
import {
  FinancialDashboardQueryDto,
  FinancialDashboardSummaryQueryDto,
} from "./dto/financial-dashboard.dto";
import { FinancialDashboardService } from "./financial-dashboard.service";

@Controller("dashboard/financial")
export class FinancialDashboardController {
  constructor(private readonly service: FinancialDashboardService) {}

  @Get()
  getDashboard(@Query() query: FinancialDashboardQueryDto) {
    return this.service.getFullDashboard(query);
  }

  @Get("cards")
  getCards(@Query() query: FinancialDashboardQueryDto) {
    return this.service.getCards(query);
  }

  @Get("charts")
  getCharts(@Query() query: FinancialDashboardQueryDto) {
    return this.service.getCharts(query);
  }

  @Get("alerts")
  getAlerts() {
    return this.service.getAlerts();
  }

  @Get("summary")
  getSummary(@Query() query: FinancialDashboardSummaryQueryDto) {
    return this.service.getSummary(query);
  }
}
