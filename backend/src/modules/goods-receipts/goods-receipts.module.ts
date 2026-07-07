import { Module, forwardRef } from "@nestjs/common";
import { AccountsPayableModule } from "../accounts-payable/accounts-payable.module";
import { FinancialModule } from "../financial/financial.module";
import { InventoryModule } from "../inventory/inventory.module";
import { PurchaseOrdersModule } from "../purchase-orders/purchase-orders.module";
import { ErpSettingsService } from "./erp-settings.service";
import { GoodsReceiptsController } from "./goods-receipts.controller";
import { GoodsReceiptsRepository } from "./goods-receipts.repository";
import { GoodsReceiptsService } from "./goods-receipts.service";
import { PayableSettlementService } from "../accounts-payable/payable-settlement.service";

@Module({
  imports: [
    InventoryModule,
    forwardRef(() => PurchaseOrdersModule),
    FinancialModule,
    AccountsPayableModule,
  ],
  controllers: [GoodsReceiptsController],
  providers: [
    GoodsReceiptsService,
    GoodsReceiptsRepository,
    ErpSettingsService,
  ],
  exports: [GoodsReceiptsService, ErpSettingsService],
})
export class GoodsReceiptsModule {}
