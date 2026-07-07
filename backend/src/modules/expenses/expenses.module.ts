import { Module } from "@nestjs/common";
import { AccountsPayableModule } from "../accounts-payable/accounts-payable.module";
import { FinancialModule } from "../financial/financial.module";
import { ExpenseHistoryService } from "./expense-history.service";
import {
  ExpenseInstallmentService,
  ExpenseRecurrenceService,
} from "./expense-installment.service";
import { ExpensePayableService } from "./expense-payable.service";
import { ExpensesController } from "./expenses.controller";
import { ExpensesRepository } from "./expenses.repository";
import { ExpensesService } from "./expenses.service";

@Module({
  imports: [FinancialModule, AccountsPayableModule],
  controllers: [ExpensesController],
  providers: [
    ExpensesRepository,
    ExpenseHistoryService,
    ExpensePayableService,
    ExpenseInstallmentService,
    ExpenseRecurrenceService,
    ExpensesService,
  ],
  exports: [ExpensesService],
})
export class ExpensesModule {}
