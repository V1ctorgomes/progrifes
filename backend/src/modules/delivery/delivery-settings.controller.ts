import { Body, Controller, Get, Put } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { AuthUser } from "../../common/interfaces/jwt-payload.interface";
import { DeliverySettingsService } from "./delivery-settings.service";
import { UpdateDeliverySettingsDto } from "./dto/delivery-settings.dto";

@Controller("delivery")
export class DeliverySettingsController {
  constructor(private readonly service: DeliverySettingsService) {}

  @Public()
  @Get("settings")
  getSettings() {
    return this.service.getSettings();
  }

  @Put("settings")
  updateSettings(
    @Body() dto: UpdateDeliverySettingsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.updateSettings(dto, user.id);
  }
}
