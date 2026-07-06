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
  CreateProductDto,
  ListProductsQueryDto,
  UpdateProductDto,
} from "./dto/product.dto";
import { ProductsService } from "./products.service";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  findPublic(@Query() query: ListProductsQueryDto) {
    return this.productsService.findPublic(query);
  }

  @Get("admin/all")
  findAdmin(@Query() query: ListProductsQueryDto) {
    return this.productsService.findAdmin(query);
  }

  @Public()
  @Get("slug/:slug")
  findBySlug(@Param("slug") slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Public()
  @Get(":id/variants")
  findVariants(@Param("id") id: string) {
    return this.productsService.findVariantsByProductId(id, true);
  }

  @Get(":id/variants/admin")
  findVariantsAdmin(@Param("id") id: string) {
    return this.productsService.findVariantsByProductId(id, false);
  }

  @Public()
  @Get(":id")
  findById(@Param("id") id: string) {
    return this.productsService.findById(id, true);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Post(":id/duplicate")
  duplicate(@Param("id") id: string) {
    return this.productsService.duplicate(id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.productsService.remove(id);
  }

  @Patch(":id/activate")
  activate(@Param("id") id: string) {
    return this.productsService.activate(id);
  }

  @Patch(":id/deactivate")
  deactivate(@Param("id") id: string) {
    return this.productsService.deactivate(id);
  }
}
