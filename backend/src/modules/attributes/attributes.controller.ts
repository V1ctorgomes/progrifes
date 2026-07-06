import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { AttributesService } from "./attributes.service";
import {
  AddAttributeValueDto,
  CreateAttributeDto,
  UpdateAttributeDto,
} from "./dto/attribute.dto";

@Controller("attributes")
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Public()
  @Get()
  findAll() {
    return this.attributesService.findAll();
  }

  @Public()
  @Get(":id")
  findById(@Param("id") id: string) {
    return this.attributesService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateAttributeDto) {
    return this.attributesService.create(dto);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateAttributeDto) {
    return this.attributesService.update(id, dto);
  }

  @Post(":id/values")
  addValue(@Param("id") id: string, @Body() dto: AddAttributeValueDto) {
    return this.attributesService.addValue(id, dto);
  }

  @Delete("values/:valueId")
  removeValue(@Param("valueId") valueId: string) {
    return this.attributesService.removeValue(valueId);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.attributesService.remove(id);
  }
}
