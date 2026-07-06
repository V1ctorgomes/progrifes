import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import { Category, Prisma, Product, ProductImage } from "@prisma/client";
import { slugify } from "../../common/utils/mappers";
import { CategoriesRepository } from "../categories/categories.repository";
import { VariantsService } from "../variants/variants.service";
import {
  CreateProductDto,
  ListProductsQueryDto,
  ProductImageDto,
  UpdateProductDto,
} from "./dto/product.dto";
import { ProductsRepository } from "./products.repository";

type ProductWithRelations = Product & {
  categoria: Category;
  imagens: ProductImage[];
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly repository: ProductsRepository,
    private readonly categoriesRepository: CategoriesRepository,
    @Inject(forwardRef(() => VariantsService))
    private readonly variantsService: VariantsService,
  ) {}

  async findPublic(query: ListProductsQueryDto) {
    const where = await this.buildWhere(query, true);
    return this.paginate(where, query);
  }

  async findAdmin(query: ListProductsQueryDto) {
    const where = await this.buildWhere(query, false);
    return this.paginate(where, query);
  }

  async findById(id: string, publicOnly = false) {
    const product = await this.repository.findById(id);
    if (!product || (publicOnly && !product.ativo)) {
      throw new NotFoundException("Produto não encontrado");
    }
    return this.toResponse(product);
  }

  async findBySlug(slug: string) {
    const product = await this.repository.findBySlug(slug);
    if (!product || !product.ativo) {
      throw new NotFoundException("Produto não encontrado");
    }

    const variantes = await this.variantsService.findByProductId(product.id, true);

    return {
      ...this.toResponse(product),
      variantes,
    };
  }

  async findVariantsByProductId(id: string, publicOnly = false) {
    await this.ensureExists(id);
    return this.variantsService.findByProductId(id, publicOnly);
  }

  async create(dto: CreateProductDto) {
    this.validateImages(dto.imagens);
    await this.ensureCategory(dto.categoriaId);
    const slug = await this.resolveSlug(dto.slug ?? slugify(dto.nome));

    const product = await this.repository.create({
      nome: dto.nome,
      slug,
      descricaoCurta: dto.descricaoCurta,
      descricaoCompleta: dto.descricaoCompleta,
      categoria: { connect: { id: dto.categoriaId } },
      codigoInterno: dto.codigoInterno,
      marca: dto.marca,
      preco: dto.preco,
      precoPromocional: dto.precoPromocional,
      custo: dto.custo,
      mostrarPrecoPromocional: dto.mostrarPrecoPromocional ?? false,
      ativo: dto.ativo ?? true,
      destaque: dto.destaque ?? false,
      novo: dto.novo ?? false,
      ordem: dto.ordem ?? 0,
      imagens: {
        create: this.normalizeImages(dto.imagens),
      },
    });

    return this.toResponse(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    const current = await this.ensureExists(id);

    if (dto.categoriaId) {
      await this.ensureCategory(dto.categoriaId);
    }

    if (dto.imagens) {
      this.validateImages(dto.imagens);
      await this.repository.deleteImagesByProductId(id);
    }

    const slug = dto.slug
      ? await this.resolveSlug(dto.slug, id)
      : dto.nome
        ? await this.resolveSlug(slugify(dto.nome), id)
        : undefined;

    const product = await this.repository.update(id, {
      nome: dto.nome,
      slug,
      descricaoCurta: dto.descricaoCurta,
      descricaoCompleta: dto.descricaoCompleta,
      categoria: dto.categoriaId ? { connect: { id: dto.categoriaId } } : undefined,
      codigoInterno: dto.codigoInterno,
      marca: dto.marca,
      preco: dto.preco,
      precoPromocional: dto.precoPromocional,
      custo: dto.custo,
      mostrarPrecoPromocional: dto.mostrarPrecoPromocional,
      ativo: dto.ativo,
      destaque: dto.destaque,
      novo: dto.novo,
      ordem: dto.ordem,
      imagens: dto.imagens
        ? { create: this.normalizeImages(dto.imagens) }
        : undefined,
    });

    if (!product) {
      throw new NotFoundException("Produto não encontrado");
    }

    return this.toResponse(product);
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.repository.softDelete(id);
    return { message: "Produto removido com sucesso" };
  }

  async activate(id: string) {
    await this.ensureExists(id);
    const product = await this.repository.update(id, { ativo: true });
    return this.toResponse(product);
  }

  async deactivate(id: string) {
    await this.ensureExists(id);
    const product = await this.repository.update(id, { ativo: false });
    return this.toResponse(product);
  }

  async duplicate(id: string) {
    const product = await this.ensureExists(id);
    const slug = await this.resolveSlug(`${product.slug}-copia`);

    const duplicate = await this.repository.create({
      nome: `${product.nome} (Cópia)`,
      slug,
      descricaoCurta: product.descricaoCurta,
      descricaoCompleta: product.descricaoCompleta,
      categoria: { connect: { id: product.categoriaId } },
      codigoInterno: product.codigoInterno,
      marca: product.marca,
      preco: product.preco,
      precoPromocional: product.precoPromocional,
      custo: product.custo,
      mostrarPrecoPromocional: product.mostrarPrecoPromocional,
      ativo: false,
      destaque: false,
      novo: false,
      ordem: product.ordem,
      imagens: {
        create: product.imagens.map((image, index) => ({
          url: image.url,
          ordem: image.ordem,
          principal: index === 0 ? true : image.principal,
        })),
      },
    });

    return this.toResponse(duplicate);
  }

  private async paginate(
    where: Prisma.ProductWhereInput,
    query: ListProductsQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.repository.findMany(where, skip, limit),
      this.repository.count(where),
    ]);

    return {
      data: items.map((item) => this.toResponse(item)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async buildWhere(
    query: ListProductsQueryDto,
    publicOnly: boolean,
  ): Promise<Prisma.ProductWhereInput> {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(publicOnly ? { ativo: true } : {}),
    };

    if (query.ativo !== undefined && !publicOnly) {
      where.ativo = query.ativo;
    }

    if (query.destaque !== undefined) {
      where.destaque = query.destaque;
    }

    if (query.novo !== undefined) {
      where.novo = query.novo;
    }

    if (query.search) {
      where.OR = [
        { nome: { contains: query.search, mode: "insensitive" } },
        { slug: { contains: query.search, mode: "insensitive" } },
        { codigoInterno: { contains: query.search, mode: "insensitive" } },
        { marca: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.categoryId) {
      where.categoriaId = query.categoryId;
    }

    if (query.categorySlug) {
      const category = await this.categoriesRepository.findBySlug(query.categorySlug);
      if (!category) {
        return { id: "not-found" };
      }

      const allCategories = await this.categoriesRepository.findMany({ ativo: true });
      const categoryIds = this.collectCategoryTreeIds(allCategories, category.id);
      where.categoriaId = { in: categoryIds };
    }

    return where;
  }

  private collectCategoryTreeIds(
    categories: Array<{ id: string; categoriaPaiId: string | null }>,
    rootId: string,
  ): string[] {
    const ids = [rootId];
    const children = categories.filter((category) => category.categoriaPaiId === rootId);

    for (const child of children) {
      ids.push(...this.collectCategoryTreeIds(categories, child.id));
    }

    return ids;
  }

  private validateImages(images: ProductImageDto[]) {
    if (!images || images.length === 0) {
      throw new BadRequestException("O produto deve ter ao menos uma imagem");
    }

    const principalCount = images.filter((image) => image.principal).length;
    if (principalCount > 1) {
      throw new BadRequestException("Apenas uma imagem pode ser principal");
    }
  }

  private normalizeImages(images: ProductImageDto[]) {
    const hasPrincipal = images.some((image) => image.principal);

    return images.map((image, index) => ({
      url: image.url,
      ordem: image.ordem ?? index + 1,
      principal: image.principal ?? (!hasPrincipal && index === 0),
    }));
  }

  private async resolveSlug(baseSlug: string, ignoreId?: string) {
    let slug = slugify(baseSlug);
    let suffix = 1;

    while (true) {
      const existing = await this.repository.findBySlug(slug);
      if (!existing || existing.id === ignoreId) {
        return slug;
      }
      suffix += 1;
      slug = `${slugify(baseSlug)}-${suffix}`;
    }
  }

  private async ensureCategory(categoriaId: string) {
    const category = await this.categoriesRepository.findById(categoriaId);
    if (!category) {
      throw new BadRequestException("Categoria inválida");
    }
  }

  private async ensureExists(id: string) {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new NotFoundException("Produto não encontrado");
    }
    return product;
  }

  private toResponse(product: ProductWithRelations) {
    const preco = Number(product.preco);
    const precoPromocional = product.precoPromocional
      ? Number(product.precoPromocional)
      : null;

    return {
      id: product.id,
      nome: product.nome,
      slug: product.slug,
      descricaoCurta: product.descricaoCurta,
      descricaoCompleta: product.descricaoCompleta,
      categoriaId: product.categoriaId,
      categoria: {
        id: product.categoria.id,
        nome: product.categoria.nome,
        slug: product.categoria.slug,
      },
      codigoInterno: product.codigoInterno,
      marca: product.marca,
      preco,
      precoPromocional,
      custo: product.custo ? Number(product.custo) : null,
      mostrarPrecoPromocional: product.mostrarPrecoPromocional,
      ativo: product.ativo,
      destaque: product.destaque,
      novo: product.novo,
      ordem: product.ordem,
      imagens: product.imagens.map((image) => ({
        id: image.id,
        url: image.url,
        ordem: image.ordem,
        principal: image.principal,
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
