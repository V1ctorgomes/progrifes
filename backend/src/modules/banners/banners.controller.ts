import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { BannersService } from "./banners.service";
import { CreateBannerDto, ReorderDto, UpdateBannerDto } from "./dto/banner.dto";

@Controller("banners")
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Public()
  @Get()
  findPublic() {
    return this.bannersService.findPublic();
  }

  @Get("admin/all")
  findAll() {
    return this.bannersService.findAll();
  }

  @Post()
  create(@Body() dto: CreateBannerDto) {
    return this.bannersService.create(dto);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateBannerDto) {
    return this.bannersService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.bannersService.remove(id);
  }

  @Patch("reorder")
  reorder(@Body() dto: ReorderDto) {
    return this.bannersService.reorder(dto);
  }

  @Patch(":id/activate")
  activate(@Param("id") id: string) {
    return this.bannersService.activate(id);
  }

  @Patch(":id/deactivate")
  deactivate(@Param("id") id: string) {
    return this.bannersService.deactivate(id);
  }
}
