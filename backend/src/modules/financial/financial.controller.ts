import { Controller, Get, Query } from "@nestjs/common";
import { ListFinancialTransactionsQueryDto } from "./dto/financial.dto";
import { FinancialService } from "./financial.service";
import { FinancialTransactionService } from "./financial-transaction.service";

@Controller("financial")
export class FinancialController {
  constructor(
    private readonly financialService: FinancialService,
    private readonly transactionService: FinancialTransactionService,
  ) {}

  @Get()
  getOverview() {
    return this.financialService.getOverview();
  }

  @Get("transactions")
  getTransactions(@Query() query: ListFinancialTransactionsQueryDto) {
    return this.transactionService.findAll(query);
  }

  @Get("accounts")
  getAccounts() {
    return this.financialService.getAccounts();
  }

  @Get("categories")
  getCategories() {
    return this.financialService.getCategories();
  }

  @Get("payment-methods")
  getPaymentMethods() {
    return this.financialService.getPaymentMethods();
  }

  @Get("cashboxes")
  getCashboxes() {
    return this.financialService.getCashboxes();
  }
}
