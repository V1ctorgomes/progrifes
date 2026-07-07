import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthUser } from "../../common/interfaces/jwt-payload.interface";
import {
  CancelExpenseDto,
  CreateExpenseAttachmentDto,
  CreateExpenseDto,
  ListExpensesQueryDto,
  PayExpenseDto,
  ReverseExpenseDto,
  UpdateExpenseDto,
} from "./dto/expenses.dto";
import { ExpensesService } from "./expenses.service";

@Controller("expenses")
export class ExpensesController {
  constructor(private readonly service: ExpensesService) {}

  @Get("dashboard")
  getDashboard() {
    return this.service.getDashboard();
  }

  @Get()
  findAll(@Query() query: ListExpensesQueryDto) {
    return this.service.findAll(query);
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.service.findById(id);
  }

  @Post()
  create(@Body() dto: CreateExpenseDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateExpenseDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Patch(":id/pay")
  pay(
    @Param("id") id: string,
    @Body() dto: PayExpenseDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.pay(id, dto, user.id);
  }

  @Patch(":id/cancel")
  cancel(
    @Param("id") id: string,
    @Body() dto: CancelExpenseDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.cancel(id, dto, user.id);
  }

  @Patch(":id/reverse")
  reverse(
    @Param("id") id: string,
    @Body() dto: ReverseExpenseDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.reverse(id, dto, user.id);
  }

  @Post(":id/attachments")
  addAttachment(
    @Param("id") id: string,
    @Body() dto: CreateExpenseAttachmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.addAttachment(id, dto, user.id);
  }
}
