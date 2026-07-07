import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthUser } from "../../common/interfaces/jwt-payload.interface";
import { AccountsReceivableService } from "./accounts-receivable.service";
import {
  CancelAccountReceivableDto,
  CreateAccountReceivableDto,
  ListAccountsReceivableQueryDto,
  ReceiveAccountReceivableDto,
  ReverseAccountReceivableDto,
} from "./dto/accounts-receivable.dto";

@Controller("accounts-receivable")
export class AccountsReceivableController {
  constructor(private readonly service: AccountsReceivableService) {}

  @Get("dashboard")
  getDashboard() {
    return this.service.getDashboard();
  }

  @Get()
  findAll(@Query() query: ListAccountsReceivableQueryDto) {
    return this.service.findAll(query);
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.service.findById(id);
  }

  @Post()
  create(@Body() dto: CreateAccountReceivableDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  @Patch(":id/receive")
  receive(
    @Param("id") id: string,
    @Body() dto: ReceiveAccountReceivableDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.receive(id, dto, user.id);
  }

  @Patch(":id/cancel")
  cancel(
    @Param("id") id: string,
    @Body() dto: CancelAccountReceivableDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.cancel(id, dto, user.id);
  }

  @Patch(":id/reverse")
  reverse(
    @Param("id") id: string,
    @Body() dto: ReverseAccountReceivableDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.reverse(id, dto, user.id);
  }
}
