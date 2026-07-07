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
import { OrdersModule } from "./modules/orders/orders.module";

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
    OrdersModule,
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
