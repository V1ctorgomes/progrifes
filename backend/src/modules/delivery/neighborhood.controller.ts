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
import { Public } from "../../common/decorators/public.decorator";
import { AuthUser } from "../../common/interfaces/jwt-payload.interface";
import {
  CreateNeighborhoodDto,
  ListNeighborhoodsQueryDto,
  LookupNeighborhoodQueryDto,
  UpdateNeighborhoodDto,
  UpdateNeighborhoodStatusDto,
} from "./dto/neighborhood.dto";
import { NeighborhoodService } from "./neighborhood.service";

@Controller("delivery/neighborhoods")
export class NeighborhoodController {
  constructor(private readonly service: NeighborhoodService) {}

  @Public()
  @Get("lookup")
  lookup(@Query() query: LookupNeighborhoodQueryDto) {
    return this.service.lookup(query.bairro, query.cidade, query.estado);
  }

  @Public()
  @Get("active")
  getActive() {
    return this.service.getActiveList();
  }

  @Get()
  findAll(@Query() query: ListNeighborhoodsQueryDto) {
    return this.service.findAll(query);
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.service.findById(id);
  }

  @Post()
  create(@Body() dto: CreateNeighborhoodDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  @Post(":id/duplicate")
  duplicate(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.service.duplicate(id, user.id);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateNeighborhoodDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateNeighborhoodStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.updateStatus(id, dto.isActive, user.id);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(id, user.id);
  }
}
