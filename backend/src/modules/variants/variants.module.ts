import { Module, forwardRef } from "@nestjs/common";
import { AttributesModule } from "../attributes/attributes.module";
import { InventoryModule } from "../inventory/inventory.module";
import { ProductsModule } from "../products/products.module";
import { VariantsController } from "./variants.controller";
import { VariantsRepository } from "./variants.repository";
import { VariantsService } from "./variants.service";

@Module({
  imports: [forwardRef(() => ProductsModule), AttributesModule, InventoryModule],
  controllers: [VariantsController],
  providers: [VariantsService, VariantsRepository],
  exports: [VariantsService, VariantsRepository],
})
export class VariantsModule {}
