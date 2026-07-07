import { Module } from "@nestjs/common";
import { InventoryController } from "./inventory.controller";
import { InventoryAdjustmentService } from "./inventory-adjustment.service";
import { InventoryAuditRepository } from "./inventory-audit.repository";
import { InventoryAuditService } from "./inventory-audit.service";
import { InventoryCountService } from "./inventory-count.service";
import { InventoryEntryRepository } from "./inventory-entry.repository";
import { InventoryEntryService } from "./inventory-entry.service";
import { InventoryMovementHistoryService } from "./inventory-movement-history.service";
import { InventoryMovementRepository } from "./inventory-movement.repository";
import { InventoryMovementService } from "./inventory-movement.service";
import { InventoryOutputService } from "./inventory-output.service";
import { InventoryRepository } from "./inventory.repository";
import { InventoryService } from "./inventory.service";

@Module({
  controllers: [InventoryController],
  providers: [
    InventoryService,
    InventoryRepository,
    InventoryEntryService,
    InventoryEntryRepository,
    InventoryOutputService,
    InventoryMovementHistoryService,
    InventoryMovementRepository,
    InventoryMovementService,
    InventoryAuditService,
    InventoryAuditRepository,
    InventoryCountService,
    InventoryAdjustmentService,
  ],
  exports: [InventoryService, InventoryEntryService, InventoryOutputService, InventoryAuditService],
})
export class InventoryModule {}
