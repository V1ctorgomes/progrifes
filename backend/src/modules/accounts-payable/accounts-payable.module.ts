import { Module } from "@nestjs/common";
import { CashFlowModule } from "../cash-flow/cash-flow.module";
import { FinancialModule } from "../financial/financial.module";
import { AccountsPayableController } from "./accounts-payable.controller";
import { AccountsPayableHistoryService } from "./accounts-payable-history.service";
import { AccountsPayableRepository } from "./accounts-payable.repository";
import { AccountsPayableService } from "./accounts-payable.service";
import { PayableSettlementService } from "./payable-settlement.service";

@Module({
  imports: [FinancialModule, CashFlowModule],
  controllers: [AccountsPayableController],
  providers: [
    AccountsPayableRepository,
    AccountsPayableHistoryService,
    PayableSettlementService,
    AccountsPayableService,
  ],
  exports: [
    PayableSettlementService,
    AccountsPayableService,
    AccountsPayableRepository,
    AccountsPayableHistoryService,
  ],
})
export class AccountsPayableModule {}
