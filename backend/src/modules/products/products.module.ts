import { Module, forwardRef } from "@nestjs/common";
import { CategoriesModule } from "../categories/categories.module";
import { VariantsModule } from "../variants/variants.module";
import { ProductsController } from "./products.controller";
import { ProductsRepository } from "./products.repository";
import { ProductsService } from "./products.service";

@Module({
  imports: [CategoriesModule, forwardRef(() => VariantsModule)],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository],
  exports: [ProductsService, ProductsRepository],
})
export class ProductsModule {}
