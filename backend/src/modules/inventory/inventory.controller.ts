import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
  CreateInventoryAuditDto,
  ListInventoryAuditsQueryDto,
  RecountAuditDto,
  UpdateAuditCountsDto,
} from "./dto/inventory-audit.dto";
import {
  CreateInventoryEntryDto,
  ListInventoryEntriesQueryDto,
} from "./dto/inventory-entry.dto";
import { ListInventoryMovementsQueryDto } from "./dto/inventory-movement.dto";
import {
  CreateInventoryOutputDto,
  ListInventoryOutputsQueryDto,
} from "./dto/inventory-output.dto";
import { ListInventoryQueryDto } from "./dto/inventory.dto";
import { InventoryAuditService } from "./inventory-audit.service";
import { InventoryCountService } from "./inventory-count.service";
import { InventoryEntryService } from "./inventory-entry.service";
import { InventoryMovementHistoryService } from "./inventory-movement-history.service";
import { InventoryOutputService } from "./inventory-output.service";
import { InventoryService } from "./inventory.service";

@Controller("inventory")
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly inventoryEntryService: InventoryEntryService,
    private readonly inventoryOutputService: InventoryOutputService,
    private readonly movementHistoryService: InventoryMovementHistoryService,
    private readonly inventoryAuditService: InventoryAuditService,
    private readonly inventoryCountService: InventoryCountService,
  ) {}

  @Get()
  findAll(@Query() query: ListInventoryQueryDto) {
    return this.inventoryService.findAll(query);
  }

  @Get("audits")
  findAllAudits(@Query() query: ListInventoryAuditsQueryDto) {
    return this.inventoryAuditService.findAll(query);
  }

  @Get("audits/:id")
  findAuditById(@Param("id") id: string) {
    return this.inventoryAuditService.findById(id);
  }

  @Post("audits")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE)
  createAudit(@Body() dto: CreateInventoryAuditDto, @CurrentUser() user: AuthUser) {
    return this.inventoryAuditService.create(dto, user.id);
  }

  @Patch("audits/:id/start")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE)
  startAudit(@Param("id") id: string) {
    return this.inventoryAuditService.start(id);
  }

  @Patch("audits/:id/pause")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE)
  pauseAudit(@Param("id") id: string) {
    return this.inventoryAuditService.pause(id);
  }

  @Patch("audits/:id/finish")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE)
  finishAudit(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.inventoryAuditService.finish(id, user.id);
  }

  @Patch("audits/:id/counts")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE)
  updateAuditCounts(@Param("id") id: string, @Body() dto: UpdateAuditCountsDto) {
    return this.inventoryCountService.updateCounts(id, dto);
  }

  @Post("audits/:id/recount")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE)
  recountAudit(@Param("id") id: string, @Body() dto: RecountAuditDto) {
    return this.inventoryCountService.recount(id, dto);
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

  @Get("outputs")
  findAllOutputs(@Query() query: ListInventoryOutputsQueryDto) {
    return this.inventoryOutputService.findAll(query);
  }

  @Get("outputs/:id")
  findOutputById(@Param("id") id: string) {
    return this.inventoryOutputService.findById(id);
  }

  @Post("outputs")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMINISTRADOR, UserRole.GERENTE)
  createOutput(@Body() dto: CreateInventoryOutputDto, @CurrentUser() user: AuthUser) {
    return this.inventoryOutputService.create(dto, user.id);
  }

  @Get("movements")
  findAllMovements(@Query() query: ListInventoryMovementsQueryDto) {
    return this.movementHistoryService.findAll(query);
  }

  @Get("movements/:id")
  findMovementById(@Param("id") id: string) {
    return this.movementHistoryService.findById(id);
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
