import { Module, forwardRef } from "@nestjs/common";
import { PurchaseOrderHistoryService } from "./purchase-order-history.service";
import { PurchaseOrdersController } from "./purchase-orders.controller";
import { PurchaseOrdersRepository } from "./purchase-orders.repository";
import { PurchaseOrdersService } from "./purchase-orders.service";
import { GoodsReceiptsModule } from "../goods-receipts/goods-receipts.module";

@Module({
  imports: [forwardRef(() => GoodsReceiptsModule)],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService, PurchaseOrdersRepository, PurchaseOrderHistoryService],
  exports: [PurchaseOrdersService, PurchaseOrderHistoryService],
})
export class PurchaseOrdersModule {}
