import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthUser } from "../../common/interfaces/jwt-payload.interface";
import { DeliveryPersonService } from "./delivery-person.service";
import {
  CreateDeliveryPersonDto,
  ListDeliveryPersonsQueryDto,
  UpdateDeliveryPersonDto,
  UpdateDeliveryPersonStatusDto,
} from "./dto/delivery-person.dto";

@Controller("delivery-persons")
export class DeliveryPersonController {
  constructor(private readonly service: DeliveryPersonService) {}

  @Get("dashboard")
  getDashboard() {
    return this.service.getDashboard();
  }

  @Get("available")
  getAvailable() {
    return this.service.getAvailableList();
  }

  @Get()
  findAll(@Query() query: ListDeliveryPersonsQueryDto) {
    return this.service.findAll(query);
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.service.findById(id);
  }

  @Post()
  create(@Body() dto: CreateDeliveryPersonDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateDeliveryPersonDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateDeliveryPersonStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.updateStatus(id, dto.status, user.id);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(id, user.id);
  }
}
