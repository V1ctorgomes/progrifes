import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthUser } from "../../common/interfaces/jwt-payload.interface";
import { CashClosingService } from "./cash-closing.service";
import { CashFlowService } from "./cash-flow.service";
import {
  CloseCashboxDto,
  CreateCashAdjustmentDto,
  CreateCashTransferDto,
  ListCashFlowStatementQueryDto,
  OpenCashboxDto,
} from "./dto/cash-flow.dto";
import { TransferService } from "./transfer.service";

@Controller("cash-flow")
export class CashFlowController {
  constructor(
    private readonly cashFlowService: CashFlowService,
    private readonly transferService: TransferService,
    private readonly closingService: CashClosingService,
  ) {}

  @Get()
  getDashboard() {
    return this.cashFlowService.getDashboard();
  }

  @Get("statement")
  getStatement(@Query() query: ListCashFlowStatementQueryDto) {
    return this.cashFlowService.getStatement(query);
  }

  @Post("transfer")
  transfer(
    @Body() dto: CreateCashTransferDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.transferService.transfer(dto, user.id);
  }

  @Post("adjustment")
  adjust(
    @Body() dto: CreateCashAdjustmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.transferService.adjust(dto, user.id);
  }

  @Post("open")
  open(@Body() dto: OpenCashboxDto, @CurrentUser() user: AuthUser) {
    return this.closingService.open(dto, user.id);
  }

  @Post("close")
  close(@Body() dto: CloseCashboxDto, @CurrentUser() user: AuthUser) {
    return this.closingService.close(dto, user.id);
  }
}
