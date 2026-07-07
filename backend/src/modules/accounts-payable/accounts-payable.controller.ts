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
import { AccountsPayableService } from "./accounts-payable.service";
import {
  CancelAccountPayableDto,
  CreateAccountPayableDto,
  ListAccountsPayableQueryDto,
  PayAccountPayableDto,
  ReverseAccountPayableDto,
} from "./dto/accounts-payable.dto";

@Controller("accounts-payable")
export class AccountsPayableController {
  constructor(private readonly service: AccountsPayableService) {}

  @Get("dashboard")
  getDashboard() {
    return this.service.getDashboard();
  }

  @Get()
  findAll(@Query() query: ListAccountsPayableQueryDto) {
    return this.service.findAll(query);
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.service.findById(id);
  }

  @Post()
  create(@Body() dto: CreateAccountPayableDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  @Patch(":id/pay")
  pay(
    @Param("id") id: string,
    @Body() dto: PayAccountPayableDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.pay(id, dto, user.id);
  }

  @Patch(":id/cancel")
  cancel(
    @Param("id") id: string,
    @Body() dto: CancelAccountPayableDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.cancel(id, dto, user.id);
  }

  @Patch(":id/reverse")
  reverse(
    @Param("id") id: string,
    @Body() dto: ReverseAccountPayableDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.reverse(id, dto, user.id);
  }
}
