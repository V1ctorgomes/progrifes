import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { AuthUser } from "../../common/interfaces/jwt-payload.interface";
import {
  CancelOrderDto,
  CreateOrderDto,
  ListOrdersQueryDto,
  UpdateOrderStatusDto,
} from "./dto/order.dto";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get("admin/dashboard")
  getDashboard() {
    return this.ordersService.getDashboard();
  }

  @Get("admin/statuses")
  getStatuses() {
    return this.ordersService.getStatusDefinitions();
  }

  @Get("admin/all")
  findAllAdmin(@Query() query: ListOrdersQueryDto) {
    return this.ordersService.findAllAdmin(query);
  }

  @Public()
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Public()
  @Get("number/:number")
  findByNumero(@Param("number", ParseIntPipe) number: number) {
    return this.ordersService.findByNumero(number);
  }

  @Get(":id/history")
  getHistory(@Param("id") id: string) {
    return this.ordersService.getHistory(id);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.updateStatus(id, dto, user.id);
  }

  @Patch(":id/cancel")
  cancel(
    @Param("id") id: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.cancel(id, dto, user.id);
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.ordersService.findById(id);
  }
}
