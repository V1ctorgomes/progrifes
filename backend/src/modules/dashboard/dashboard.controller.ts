import { Controller, Get, Query } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthUser } from "../../common/interfaces/jwt-payload.interface";
import { DashboardQueryDto } from "./dto/dashboard.dto";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  getDashboard(@Query() query: DashboardQueryDto, @CurrentUser() user: AuthUser) {
    return this.service.getFullDashboard(query, user);
  }

  @Get("cards")
  getCards(@Query() query: DashboardQueryDto, @CurrentUser() user: AuthUser) {
    return this.service.getCards(query, user);
  }

  @Get("charts")
  getCharts(@Query() query: DashboardQueryDto, @CurrentUser() user: AuthUser) {
    return this.service.getCharts(query, user);
  }

  @Get("recent-orders")
  getRecentOrders(@CurrentUser() user: AuthUser) {
    return this.service.getRecentOrders(user);
  }

  @Get("activities")
  getActivities(@CurrentUser() user: AuthUser) {
    return this.service.getActivities(user);
  }
}
