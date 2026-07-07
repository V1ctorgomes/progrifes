import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthUser } from "../../common/interfaces/jwt-payload.interface";
import { DeliveryTrackingService } from "./delivery-tracking.service";
import {
  AssignDeliveryPersonToDeliveryDto,
  ListDeliveriesQueryDto,
  UpdateDeliveryStatusDto,
} from "./dto/delivery-tracking.dto";

@Controller("deliveries")
export class DeliveryTrackingController {
  constructor(private readonly service: DeliveryTrackingService) {}

  @Get("dashboard")
  getDashboard() {
    return this.service.getDashboard();
  }

  @Get()
  findAll(@Query() query: ListDeliveriesQueryDto) {
    return this.service.findAll(query);
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.service.findById(id);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateDeliveryStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.updateStatus(id, dto, user.id);
  }

  @Patch(":id/assign-delivery-person")
  assignDeliveryPerson(
    @Param("id") id: string,
    @Body() dto: AssignDeliveryPersonToDeliveryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.assignDeliveryPerson(id, dto, user.id);
  }
}
