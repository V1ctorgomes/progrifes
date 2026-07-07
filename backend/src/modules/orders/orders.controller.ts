import { Body, Controller, Get, Param, ParseIntPipe, Post } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { CreateOrderDto } from "./dto/order.dto";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get("admin/all")
  findAllAdmin() {
    return this.ordersService.findAllAdmin();
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

  @Public()
  @Get(":id")
  findById(@Param("id") id: string) {
    return this.ordersService.findById(id);
  }
}
