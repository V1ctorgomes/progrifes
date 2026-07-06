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
import { Public } from "../../common/decorators/public.decorator";
import {
  BulkUpdateVariantsDto,
  CreateVariantDto,
  GenerateVariantsDto,
  ListVariantsQueryDto,
  UpdateVariantDto,
} from "./dto/variant.dto";
import { VariantsService } from "./variants.service";

@Controller("variants")
export class VariantsController {
  constructor(private readonly variantsService: VariantsService) {}

  @Get()
  findAll(@Query() query: ListVariantsQueryDto) {
    return this.variantsService.findAll(query);
  }

  @Post("generate")
  generate(@Body() dto: GenerateVariantsDto) {
    return this.variantsService.generateCombinations(dto);
  }

  @Patch("bulk")
  bulkUpdate(@Body() dto: BulkUpdateVariantsDto) {
    return this.variantsService.bulkUpdate(dto);
  }

  @Public()
  @Get(":id")
  findById(@Param("id") id: string) {
    return this.variantsService.findById(id, true);
  }

  @Post()
  create(@Body() dto: CreateVariantDto) {
    return this.variantsService.create(dto);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateVariantDto) {
    return this.variantsService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.variantsService.remove(id);
  }

  @Patch(":id/activate")
  activate(@Param("id") id: string) {
    return this.variantsService.activate(id);
  }

  @Patch(":id/deactivate")
  deactivate(@Param("id") id: string) {
    return this.variantsService.deactivate(id);
  }
}
