import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AuthUser } from "../../common/interfaces/jwt-payload.interface";
import {
  CreateInventoryEntryDto,
  ListInventoryEntriesQueryDto,
} from "./dto/inventory-entry.dto";
import { ListInventoryQueryDto } from "./dto/inventory.dto";
import { InventoryEntryService } from "./inventory-entry.service";
import { InventoryService } from "./inventory.service";

@Controller("inventory")
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly inventoryEntryService: InventoryEntryService,
  ) {}

  @Get()
  findAll(@Query() query: ListInventoryQueryDto) {
    return this.inventoryService.findAll(query);
  }

  @Get("entries")
  findAllEntries(@Query() query: ListInventoryEntriesQueryDto) {
    return this.inventoryEntryService.findAll(query);
  }

  @Get("entries/:id")
  findEntryById(@Param("id") id: string) {
    return this.inventoryEntryService.findById(id);
  }

  @Post("entries")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE)
  createEntry(@Body() dto: CreateInventoryEntryDto, @CurrentUser() user: AuthUser) {
    return this.inventoryEntryService.create(dto, user.id);
  }

  @Get("alerts")
  getAlerts() {
    return this.inventoryService.getAlerts();
  }

  @Get("low-stock")
  getLowStock() {
    return this.inventoryService.getLowStock();
  }

  @Get("out-of-stock")
  getOutOfStock() {
    return this.inventoryService.getOutOfStock();
  }

  @Get(":variantId")
  findByVariantId(@Param("variantId") variantId: string) {
    return this.inventoryService.findByVariantId(variantId);
  }
}
