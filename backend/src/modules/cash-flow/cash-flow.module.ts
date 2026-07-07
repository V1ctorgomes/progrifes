import { Module } from "@nestjs/common";
import { FinancialModule } from "../financial/financial.module";
import { CashClosingService } from "./cash-closing.service";
import { CashFlowController } from "./cash-flow.controller";
import { CashFlowRepository } from "./cash-flow.repository";
import { CashFlowService } from "./cash-flow.service";
import { CashFlowSyncService } from "./cash-flow-sync.service";
import { TransferService } from "./transfer.service";

@Module({
  imports: [FinancialModule],
  controllers: [CashFlowController],
  providers: [
    CashFlowRepository,
    CashFlowSyncService,
    CashFlowService,
    TransferService,
    CashClosingService,
  ],
  exports: [CashFlowSyncService, CashClosingService],
})
export class CashFlowModule {}
