import { Module } from "@nestjs/common";
import { FinancialAuditService } from "./financial-audit.service";
import { FinancialBalanceService } from "./financial-balance.service";
import { FinancialController } from "./financial.controller";
import { FinancialIntegrationService } from "./financial-integration.service";
import { FinancialRepository } from "./financial.repository";
import { FinancialService } from "./financial.service";
import { FinancialTransactionRepository } from "./financial-transaction.repository";
import { FinancialTransactionService } from "./financial-transaction.service";

@Module({
  controllers: [FinancialController],
  providers: [
    FinancialRepository,
    FinancialTransactionRepository,
    FinancialBalanceService,
    FinancialAuditService,
    FinancialIntegrationService,
    FinancialTransactionService,
    FinancialService,
  ],
  exports: [
    FinancialIntegrationService,
    FinancialAuditService,
    FinancialTransactionRepository,
    FinancialRepository,
    FinancialBalanceService,
  ],
})
export class FinancialModule {}
