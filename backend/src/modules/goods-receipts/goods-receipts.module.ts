import { Module, forwardRef } from "@nestjs/common";
import { InventoryModule } from "../inventory/inventory.module";
import { PurchaseOrdersModule } from "../purchase-orders/purchase-orders.module";
import { AccountsPayableService } from "./accounts-payable.service";
import { ErpSettingsService } from "./erp-settings.service";
import { GoodsReceiptsController } from "./goods-receipts.controller";
import { GoodsReceiptsRepository } from "./goods-receipts.repository";
import { GoodsReceiptsService } from "./goods-receipts.service";

@Module({
  imports: [InventoryModule, forwardRef(() => PurchaseOrdersModule)],
  controllers: [GoodsReceiptsController],
  providers: [
    GoodsReceiptsService,
    GoodsReceiptsRepository,
    AccountsPayableService,
    ErpSettingsService,
  ],
  exports: [GoodsReceiptsService, ErpSettingsService],
})
export class GoodsReceiptsModule {}
