import { Module } from "@nestjs/common";
import { CustomersModule } from "../customers/customers.module";
import { InventoryModule } from "../inventory/inventory.module";
import { OrdersController } from "./orders.controller";
import { OrderHistoryService } from "./order-history.service";
import { OrdersRepository } from "./orders.repository";
import { OrdersService } from "./orders.service";

@Module({
  imports: [CustomersModule, InventoryModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository, OrderHistoryService],
  exports: [OrdersService, OrdersRepository, OrderHistoryService],
})
export class OrdersModule {}
