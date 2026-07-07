import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrderHistoryService } from "./order-history.service";
import { OrdersRepository } from "./orders.repository";
import { OrdersService } from "./orders.service";

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository, OrderHistoryService],
  exports: [OrdersService, OrdersRepository, OrderHistoryService],
})
export class OrdersModule {}
