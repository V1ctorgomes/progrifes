import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthUser } from "../../common/interfaces/jwt-payload.interface";
import { CustomerCrmService } from "./customer-crm.service";
import { CustomerHistoryService } from "./customer-history.service";
import { CustomerStatisticsService } from "./customer-statistics.service";
import {
  AssignCustomerTagDto,
  CreateCustomerAddressDto,
  CreateCustomerDto,
  CreateCustomerNoteDto,
  CreateCustomerTagDto,
  ListCustomerOrdersQueryDto,
  ListCustomersQueryDto,
  UpdateCustomerAddressDto,
  UpdateCustomerCrmDto,
  UpdateCustomerDto,
} from "./dto/customer.dto";
import { CustomersService } from "./customers.service";

@Controller("customers")
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly statisticsService: CustomerStatisticsService,
    private readonly historyService: CustomerHistoryService,
    private readonly crmService: CustomerCrmService,
  ) {}

  @Get()
  findAll(@Query() query: ListCustomersQueryDto) {
    return this.customersService.findAll(query);
  }

  @Get("tags")
  listTags() {
    return this.crmService.listTags();
  }

  @Post("tags")
  createTag(@Body() dto: CreateCustomerTagDto) {
    return this.crmService.createTag(dto);
  }

  @Get("phone/:phone")
  findByPhone(@Param("phone") phone: string) {
    return this.customersService.findByPhone(phone);
  }

  @Get(":id/statistics")
  getStatistics(@Param("id") id: string) {
    return this.statisticsService.getStatistics(id);
  }

  @Get(":id/history")
  getHistory(@Param("id") id: string) {
    return this.historyService.getHistory(id);
  }

  @Get(":id/orders")
  getOrders(@Param("id") id: string, @Query() query: ListCustomerOrdersQueryDto) {
    return this.crmService.getOrders(id, query);
  }

  @Get(":id/notes")
  getNotes(@Param("id") id: string) {
    return this.crmService.getNotes(id);
  }

  @Post(":id/notes")
  createNote(
    @Param("id") id: string,
    @Body() dto: CreateCustomerNoteDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.crmService.createNote(id, dto, user.id);
  }

  @Delete(":id/notes/:noteId")
  deleteNote(@Param("id") id: string, @Param("noteId") noteId: string) {
    return this.crmService.deleteNote(id, noteId);
  }

  @Get(":id/crm")
  getCrm(@Param("id") id: string) {
    return this.crmService.getCrm(id);
  }

  @Patch(":id/crm")
  updateCrm(@Param("id") id: string, @Body() dto: UpdateCustomerCrmDto) {
    return this.crmService.updateCrm(id, dto);
  }

  @Post(":id/tags")
  assignTag(@Param("id") id: string, @Body() dto: AssignCustomerTagDto) {
    return this.crmService.assignTag(id, dto);
  }

  @Delete(":id/tags/:tagId")
  removeTag(@Param("id") id: string, @Param("tagId") tagId: string) {
    return this.crmService.removeTag(id, tagId);
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.customersService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.customersService.remove(id);
  }

  @Patch(":id/deactivate")
  deactivate(@Param("id") id: string) {
    return this.customersService.deactivate(id);
  }

  @Patch(":id/activate")
  activate(@Param("id") id: string) {
    return this.customersService.activate(id);
  }

  @Post(":id/addresses")
  addAddress(@Param("id") id: string, @Body() dto: CreateCustomerAddressDto) {
    return this.customersService.addAddress(id, dto);
  }

  @Put(":id/addresses/:addressId")
  updateAddress(
    @Param("id") id: string,
    @Param("addressId") addressId: string,
    @Body() dto: UpdateCustomerAddressDto,
  ) {
    return this.customersService.updateAddress(id, addressId, dto);
  }

  @Delete(":id/addresses/:addressId")
  removeAddress(@Param("id") id: string, @Param("addressId") addressId: string) {
    return this.customersService.removeAddress(id, addressId);
  }

  @Patch(":id/addresses/:addressId/principal")
  setPrincipalAddress(
    @Param("id") id: string,
    @Param("addressId") addressId: string,
  ) {
    return this.customersService.setPrincipalAddress(id, addressId);
  }
}
