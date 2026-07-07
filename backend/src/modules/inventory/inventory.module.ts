import { Module } from "@nestjs/common";
import { InventoryController } from "./inventory.controller";
import { InventoryEntryRepository } from "./inventory-entry.repository";
import { InventoryEntryService } from "./inventory-entry.service";
import { InventoryMovementService } from "./inventory-movement.service";
import { InventoryRepository } from "./inventory.repository";
import { InventoryService } from "./inventory.service";

@Module({
  controllers: [InventoryController],
  providers: [
    InventoryService,
    InventoryRepository,
    InventoryEntryService,
    InventoryEntryRepository,
    InventoryMovementService,
  ],
  exports: [InventoryService, InventoryEntryService],
})
export class InventoryModule {}
