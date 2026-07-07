import { Body, Controller, Get, Param, Post, Put, Query } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthUser } from "../../common/interfaces/jwt-payload.interface";
import { PayableGenerationMode } from "@prisma/client";
import {
  CreateGoodsReceiptDto,
  ListGoodsReceiptsQueryDto,
  UpdatePayableGenerationModeDto,
} from "./dto/goods-receipt.dto";
import { ErpSettingsService } from "./erp-settings.service";
import { GoodsReceiptsService } from "./goods-receipts.service";

@Controller("goods-receipts")
export class GoodsReceiptsController {
  constructor(
    private readonly goodsReceiptsService: GoodsReceiptsService,
    private readonly erpSettingsService: ErpSettingsService,
  ) {}

  @Get("settings/payable-mode")
  getPayableMode() {
    return this.erpSettingsService.getPayableGenerationMode().then((mode) => ({
      payableGenerationMode: mode,
    }));
  }

  @Put("settings/payable-mode")
  updatePayableMode(@Body() dto: UpdatePayableGenerationModeDto) {
    const mode =
      dto.mode === "AT_COMPLETION"
        ? PayableGenerationMode.AT_COMPLETION
        : PayableGenerationMode.PER_RECEIPT;
    return this.erpSettingsService.setPayableGenerationMode(mode);
  }

  @Get()
  findAll(@Query() query: ListGoodsReceiptsQueryDto) {
    return this.goodsReceiptsService.findAll(query);
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.goodsReceiptsService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateGoodsReceiptDto, @CurrentUser() user: AuthUser) {
    return this.goodsReceiptsService.create(dto, user.id);
  }
}
