import { Module } from "@nestjs/common";
import { CashFlowModule } from "../cash-flow/cash-flow.module";
import { FinancialModule } from "../financial/financial.module";
import { AccountsReceivableController } from "./accounts-receivable.controller";
import { AccountsReceivableHistoryService } from "./accounts-receivable-history.service";
import { AccountsReceivableRepository } from "./accounts-receivable.repository";
import { AccountsReceivableService } from "./accounts-receivable.service";
import { ReceivableSettlementService } from "./receivable-settlement.service";

@Module({
  imports: [FinancialModule, CashFlowModule],
  controllers: [AccountsReceivableController],
  providers: [
    AccountsReceivableRepository,
    AccountsReceivableHistoryService,
    ReceivableSettlementService,
    AccountsReceivableService,
  ],
  exports: [ReceivableSettlementService, AccountsReceivableService],
})
export class AccountsReceivableModule {}
