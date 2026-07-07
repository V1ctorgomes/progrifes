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
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthUser } from "../../common/interfaces/jwt-payload.interface";
import {
  CancelPurchaseOrderDto,
  CreatePurchaseOrderDto,
  ListPurchaseOrdersQueryDto,
  UpdatePurchaseOrderDto,
  UpdatePurchaseOrderStatusDto,
} from "./dto/purchase-order.dto";
import { GoodsReceiptsService } from "../goods-receipts/goods-receipts.service";
import { PurchaseOrdersService } from "./purchase-orders.service";

@Controller("purchase-orders")
export class PurchaseOrdersController {
  constructor(
    private readonly purchaseOrdersService: PurchaseOrdersService,
    private readonly goodsReceiptsService: GoodsReceiptsService,
  ) {}

  @Get("dashboard")
  getDashboard() {
    return this.purchaseOrdersService.getDashboard();
  }

  @Get("statuses")
  getStatuses() {
    return this.purchaseOrdersService.getStatusDefinitions();
  }

  @Get()
  findAll(@Query() query: ListPurchaseOrdersQueryDto) {
    return this.purchaseOrdersService.findAll(query);
  }

  @Get(":id/receipts")
  getReceipts(@Param("id") id: string) {
    return this.goodsReceiptsService.findByPurchaseOrderId(id);
  }

  @Get(":id/receipt-summary")
  getReceiptSummary(@Param("id") id: string) {
    return this.goodsReceiptsService.getOrderReceiptSummary(id);
  }

  @Get(":id/history")
  getHistory(@Param("id") id: string) {
    return this.purchaseOrdersService.getHistory(id);
  }

  @Post(":id/duplicate")
  duplicate(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.purchaseOrdersService.duplicate(id, user.id);
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.purchaseOrdersService.findById(id);
  }

  @Post()
  create(@Body() dto: CreatePurchaseOrderDto, @CurrentUser() user: AuthUser) {
    return this.purchaseOrdersService.create(dto, user.id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdatePurchaseOrderDto) {
    return this.purchaseOrdersService.update(id, dto);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdatePurchaseOrderStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.purchaseOrdersService.updateStatus(
      id,
      dto,
      user.id,
      user.cargo as UserRole,
    );
  }

  @Patch(":id/cancel")
  cancel(
    @Param("id") id: string,
    @Body() dto: CancelPurchaseOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.purchaseOrdersService.cancel(id, dto, user.id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.purchaseOrdersService.remove(id);
  }
}
