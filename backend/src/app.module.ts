import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "./database/database.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { AuthModule } from "./modules/auth/auth.module";
import { AdminModule } from "./modules/admin/admin.module";
import { BannersModule } from "./modules/banners/banners.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { ProductsModule } from "./modules/products/products.module";
import { AttributesModule } from "./modules/attributes/attributes.module";
import { VariantsModule } from "./modules/variants/variants.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { CustomersModule } from "./modules/customers/customers.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { SuppliersModule } from "./modules/suppliers/suppliers.module";
import { PurchaseOrdersModule } from "./modules/purchase-orders/purchase-orders.module";
import { GoodsReceiptsModule } from "./modules/goods-receipts/goods-receipts.module";
import { FinancialModule } from "./modules/financial/financial.module";
import { AccountsReceivableModule } from "./modules/accounts-receivable/accounts-receivable.module";
import { AccountsPayableModule } from "./modules/accounts-payable/accounts-payable.module";
import { CashFlowModule } from "./modules/cash-flow/cash-flow.module";
import { ExpensesModule } from "./modules/expenses/expenses.module";
import { FinancialDashboardModule } from "./modules/financial-dashboard/financial-dashboard.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { DeliveryModule } from "./modules/delivery/delivery.module";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 20,
      },
    ]),
    DatabaseModule,
    AuthModule,
    AdminModule,
    BannersModule,
    CategoriesModule,
    ProductsModule,
    AttributesModule,
    VariantsModule,
    CustomersModule,
    InventoryModule,
    OrdersModule,
    SuppliersModule,
    PurchaseOrdersModule,
    GoodsReceiptsModule,
    FinancialModule,
    AccountsReceivableModule,
    AccountsPayableModule,
    CashFlowModule,
    ExpensesModule,
    FinancialDashboardModule,
    DashboardModule,
    DeliveryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
