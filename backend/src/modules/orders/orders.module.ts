import { Module, forwardRef } from "@nestjs/common";
import { AccountsReceivableModule } from "../accounts-receivable/accounts-receivable.module";
import { CustomersModule } from "../customers/customers.module";
import { DeliveryModule } from "../delivery/delivery.module";
import { InventoryModule } from "../inventory/inventory.module";
import { OrdersController } from "./orders.controller";
import { OrderHistoryService } from "./order-history.service";
import { OrdersRepository } from "./orders.repository";
import { OrdersService } from "./orders.service";

@Module({
  imports: [
    CustomersModule,
    InventoryModule,
    AccountsReceivableModule,
    forwardRef(() => DeliveryModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository, OrderHistoryService],
  exports: [OrdersService, OrdersRepository, OrderHistoryService],
})
export class OrdersModule {}
