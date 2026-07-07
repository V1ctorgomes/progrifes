import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  Attribute,
  AttributeValue,
  Product,
  ProductVariant,
  VariantImage,
} from "@prisma/client";
import { ProductsRepository } from "../products/products.repository";
import { AttributesRepository } from "../attributes/attributes.repository";
import {
  BulkUpdateVariantsDto,
  CreateVariantDto,
  GenerateVariantsDto,
  ListVariantsQueryDto,
  UpdateVariantDto,
  VariantImageDto,
} from "./dto/variant.dto";
import { VariantsRepository } from "./variants.repository";
import { InventoryService } from "../inventory/inventory.service";
import { toStockStatusKey } from "../inventory/inventory-stock.config";

type VariantAttributeRelation = {
  attributeValue: AttributeValue & { attribute: Attribute };
};

type VariantWithRelations = ProductVariant & {
  imagens: VariantImage[];
  atributos: VariantAttributeRelation[];
  produto?: Product;
  inventory?: {
    quantidadeTotal: number;
    quantidadeReservada: number;
    quantidadeDisponivel: number;
    estoqueMinimo: number;
    status: import("@prisma/client").InventoryStatus;
  } | null;
};

export type StockStatus = "em_estoque" | "estoque_baixo" | "sem_estoque";

@Injectable()
export class VariantsService {
  constructor(
    private readonly repository: VariantsRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly attributesRepository: AttributesRepository,
    private readonly inventoryService: InventoryService,
  ) {}

  async findAll(query: ListVariantsQueryDto) {
    const where = this.buildWhere(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.repository.findMany(where, skip, limit),
      this.repository.count(where),
    ]);

    return {
      data: items.map((item) => this.toResponse(item)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string, publicOnly = false) {
    const variant = await this.repository.findById(id);
    if (!variant || (publicOnly && !variant.ativo)) {
      throw new NotFoundException("Variante não encontrada");
    }
    return this.toResponse(variant);
  }

  async findByProductId(produtoId: string, publicOnly = false) {
    const product = await this.productsRepository.findById(produtoId);
    if (!product || (publicOnly && !product.ativo)) {
      throw new NotFoundException("Produto não encontrado");
    }

    const variants = await this.repository.findByProductId(produtoId, publicOnly);
    return variants.map((variant) => this.toResponse(variant, product));
  }

  async create(dto: CreateVariantDto) {
    const product = await this.ensureProduct(dto.produtoId);
    await this.ensureUniqueSku(dto.sku);
    const attributeValues = await this.validateAttributeValues(dto.attributeValueIds);

    if (dto.imagens) {
      this.validateImages(dto.imagens);
    }

    const variant = await this.repository.create({
      produto: { connect: { id: dto.produtoId } },
      sku: dto.sku.trim().toUpperCase(),
      codigoBarras: dto.codigoBarras,
      preco: dto.preco,
      precoPromocional: dto.precoPromocional,
      custo: dto.custo,
      estoque: dto.estoque ?? 0,
      estoqueMinimo: dto.estoqueMinimo ?? 0,
      ativo: dto.ativo ?? true,
      atributos: {
        create: attributeValues.map((value) => ({
          attributeValue: { connect: { id: value.id } },
        })),
      },
      imagens: dto.imagens?.length
        ? { create: this.normalizeImages(dto.imagens) }
        : undefined,
    });

    await this.inventoryService.ensureForVariant(
      variant.id,
      dto.estoque ?? 0,
      dto.estoqueMinimo ?? 0,
    );

    const refreshed = await this.repository.findById(variant.id);
    return this.toResponse(refreshed!, product);
  }

  async update(id: string, dto: UpdateVariantDto) {
    const current = await this.ensureExists(id);

    if (dto.sku && dto.sku.trim().toUpperCase() !== current.sku) {
      await this.ensureUniqueSku(dto.sku, id);
    }

    if (dto.attributeValueIds) {
      await this.validateAttributeValues(dto.attributeValueIds);
      await this.repository.deleteAttributesByVariantId(id);
    }

    if (dto.imagens) {
      this.validateImages(dto.imagens);
      await this.repository.deleteImagesByVariantId(id);
    }

    if (dto.estoque !== undefined && dto.estoque !== current.estoque) {
      throw new BadRequestException(
        "O saldo de estoque só pode ser alterado pelo módulo de entradas de estoque",
      );
    }

    const variant = await this.repository.update(id, {
      sku: dto.sku ? dto.sku.trim().toUpperCase() : undefined,
      codigoBarras: dto.codigoBarras,
      preco: dto.preco,
      precoPromocional: dto.precoPromocional,
      custo: dto.custo,
      estoqueMinimo: dto.estoqueMinimo,
      ativo: dto.ativo,
      atributos: dto.attributeValueIds
        ? {
            create: dto.attributeValueIds.map((valueId) => ({
              attributeValue: { connect: { id: valueId } },
            })),
          }
        : undefined,
      imagens: dto.imagens
        ? { create: this.normalizeImages(dto.imagens) }
        : undefined,
    });

    if (dto.estoqueMinimo !== undefined) {
      await this.inventoryService.syncFromVariantUpdate(
        id,
        current.estoque,
        dto.estoqueMinimo,
      );
    }

    const refreshed = await this.repository.findById(id);
    return this.toResponse(refreshed!);
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.repository.softDelete(id);
    return { message: "Variante removida com sucesso" };
  }

  async activate(id: string) {
    await this.ensureExists(id);
    const variant = await this.repository.update(id, { ativo: true });
    return this.toResponse(variant);
  }

  async deactivate(id: string) {
    await this.ensureExists(id);
    const variant = await this.repository.update(id, { ativo: false });
    return this.toResponse(variant);
  }

  async bulkUpdate(dto: BulkUpdateVariantsDto) {
    if (!dto.ids.length) {
      throw new BadRequestException("Informe ao menos uma variante");
    }

    if (dto.estoque !== undefined) {
      throw new BadRequestException(
        "O saldo de estoque só pode ser alterado pelo módulo de entradas de estoque",
      );
    }

    const hasField =
      dto.preco !== undefined ||
      dto.precoPromocional !== undefined ||
      dto.custo !== undefined ||
      dto.estoqueMinimo !== undefined ||
      dto.ativo !== undefined;

    if (!hasField) {
      throw new BadRequestException("Informe ao menos um campo para atualizar");
    }

    await this.repository.updateMany(dto.ids, {
      preco: dto.preco,
      precoPromocional: dto.precoPromocional,
      custo: dto.custo,
      estoqueMinimo: dto.estoqueMinimo,
      ativo: dto.ativo,
    });

    if (dto.estoqueMinimo !== undefined) {
      for (const variantId of dto.ids) {
        const variant = await this.repository.findById(variantId);
        if (!variant) continue;
        await this.inventoryService.syncFromVariantUpdate(
          variantId,
          variant.estoque,
          dto.estoqueMinimo,
        );
      }
    }

    const variants = await this.repository.findMany({
      id: { in: dto.ids },
      deletedAt: null,
    });

    return variants.map((variant) => this.toResponse(variant));
  }

  async generateCombinations(dto: GenerateVariantsDto) {
    const product = await this.ensureProduct(dto.produtoId);

    if (!dto.grupos.length) {
      throw new BadRequestException("Informe ao menos um grupo de atributos");
    }

    const groups = await Promise.all(
      dto.grupos.map(async (group) => {
        const attribute = await this.attributesRepository.findById(group.attributeId);
        if (!attribute) {
          throw new BadRequestException(`Atributo inválido: ${group.attributeId}`);
        }

        const values = attribute.valores.filter((value) =>
          group.valueIds.includes(value.id),
        );

        if (values.length !== group.valueIds.length) {
          throw new BadRequestException(`Valores inválidos para o atributo ${attribute.nome}`);
        }

        return values;
      }),
    );

    const combinations = this.cartesianProduct(groups);
    const existing = await this.repository.findByProductId(dto.produtoId);
    const created = [];

    for (const combo of combinations) {
      const signature = combo
        .map((value) => value.id)
        .sort()
        .join(":");

      const duplicate = existing.find((variant) => {
        const variantSignature = variant.atributos
          .map((item) => item.attributeValue.id)
          .sort()
          .join(":");
        return variantSignature === signature;
      });

      if (duplicate) {
        continue;
      }

      const sku = await this.generateSku(product, combo);
      const variant = await this.repository.create({
        produto: { connect: { id: dto.produtoId } },
        sku,
        estoque: dto.estoqueInicial ?? 0,
        estoqueMinimo: dto.estoqueMinimo ?? 0,
        ativo: true,
        atributos: {
          create: combo.map((value) => ({
            attributeValue: { connect: { id: value.id } },
          })),
        },
      });

      await this.inventoryService.ensureForVariant(
        variant.id,
        dto.estoqueInicial ?? 0,
        dto.estoqueMinimo ?? 0,
      );

      const refreshed = await this.repository.findById(variant.id);
      created.push(this.toResponse(refreshed!, product));
      existing.push(refreshed!);
    }

    return { created, total: created.length };
  }

  getStockStatus(estoque: number, estoqueMinimo: number): StockStatus {
    if (estoque <= 0) return "sem_estoque";
    if (estoque <= estoqueMinimo) return "estoque_baixo";
    return "em_estoque";
  }

  toResponse(variant: VariantWithRelations, product?: Product) {
    const resolvedProduct = product ?? variant.produto;
    const precoBase = variant.preco ? Number(variant.preco) : resolvedProduct ? Number(resolvedProduct.preco) : 0;
    const precoPromocionalVariant = variant.precoPromocional
      ? Number(variant.precoPromocional)
      : null;
    const precoPromocionalProduct = resolvedProduct?.precoPromocional
      ? Number(resolvedProduct.precoPromocional)
      : null;

    const inventory = variant.inventory;
    const estoqueTotal = inventory?.quantidadeTotal ?? variant.estoque;
    const estoqueReservado = inventory?.quantidadeReservada ?? 0;
    const estoqueDisponivel = inventory?.quantidadeDisponivel ?? variant.estoque;
    const estoqueMinimo = inventory?.estoqueMinimo ?? variant.estoqueMinimo;
    const statusEstoque = inventory
      ? toStockStatusKey(inventory.status)
      : this.getStockStatus(estoqueDisponivel, estoqueMinimo);

    return {
      id: variant.id,
      produtoId: variant.produtoId,
      sku: variant.sku,
      codigoBarras: variant.codigoBarras,
      preco: precoBase,
      precoPromocional: precoPromocionalVariant ?? precoPromocionalProduct,
      custo: variant.custo
        ? Number(variant.custo)
        : resolvedProduct?.custo
          ? Number(resolvedProduct.custo)
          : null,
      estoque: estoqueDisponivel,
      estoqueTotal,
      estoqueReservado,
      estoqueMinimo,
      statusEstoque,
      ativo: variant.ativo,
      atributos: variant.atributos.map((item) => ({
        attributeId: item.attributeValue.attribute.id,
        attributeNome: item.attributeValue.attribute.nome,
        valueId: item.attributeValue.id,
        valor: item.attributeValue.valor,
      })),
      imagens: variant.imagens.map((image) => ({
        id: image.id,
        url: image.url,
        ordem: image.ordem,
        principal: image.principal,
      })),
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    };
  }

  private buildWhere(query: ListVariantsQueryDto) {
    const where: {
      deletedAt: null;
      produtoId?: string;
      ativo?: boolean;
      OR?: Array<{ sku?: { contains: string; mode: "insensitive" }; codigoBarras?: { contains: string; mode: "insensitive" } }>;
    } = { deletedAt: null };

    if (query.produtoId) where.produtoId = query.produtoId;
    if (query.ativo !== undefined) where.ativo = query.ativo;

    if (query.search) {
      where.OR = [
        { sku: { contains: query.search, mode: "insensitive" } },
        { codigoBarras: { contains: query.search, mode: "insensitive" } },
      ];
    }

    return where;
  }

  private async ensureProduct(produtoId: string) {
    const product = await this.productsRepository.findById(produtoId);
    if (!product) {
      throw new BadRequestException("Produto inválido");
    }
    return product;
  }

  private async ensureExists(id: string) {
    const variant = await this.repository.findById(id);
    if (!variant) {
      throw new NotFoundException("Variante não encontrada");
    }
    return variant;
  }

  private async ensureUniqueSku(sku: string, ignoreId?: string) {
    const existing = await this.repository.findBySku(sku.trim().toUpperCase());
    if (existing && existing.id !== ignoreId) {
      throw new BadRequestException("SKU já está em uso");
    }
  }

  private async validateAttributeValues(ids: string[]) {
    if (!ids.length) {
      throw new BadRequestException("Informe ao menos um valor de atributo");
    }

    const values = await this.repository.findAttributeValuesByIds(ids);
    if (values.length !== ids.length) {
      throw new BadRequestException("Valores de atributo inválidos");
    }

    const attributeIds = new Set(values.map((value) => value.attributeId));
    if (attributeIds.size !== values.length) {
      throw new BadRequestException("Cada atributo só pode ter um valor por variante");
    }

    return values;
  }

  private validateImages(images: VariantImageDto[]) {
    const principalCount = images.filter((image) => image.principal).length;
    if (principalCount > 1) {
      throw new BadRequestException("Apenas uma imagem pode ser principal");
    }
  }

  private normalizeImages(images: VariantImageDto[]) {
    const hasPrincipal = images.some((image) => image.principal);
    return images.map((image, index) => ({
      url: image.url,
      ordem: image.ordem ?? index + 1,
      principal: image.principal ?? (!hasPrincipal && index === 0),
    }));
  }

  private cartesianProduct<T>(groups: T[][]): T[][] {
    return groups.reduce<T[][]>(
      (acc, group) => acc.flatMap((combo) => group.map((item) => [...combo, item])),
      [[]],
    );
  }

  private abbreviate(value: string) {
    const normalized = value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();

    if (normalized.length <= 2) return normalized;
    return normalized.slice(0, 2);
  }

  private async generateSku(product: Product, values: AttributeValue[]) {
    const prefix = (product.codigoInterno ?? product.slug.split("-")[0] ?? "PRD")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);

    const suffix = values.map((value) => this.abbreviate(value.valor)).join("-");
    let sku = `${prefix}-${suffix}`;
    let counter = 1;

    while (await this.repository.findBySku(sku)) {
      counter += 1;
      sku = `${prefix}-${suffix}-${counter}`;
    }

    return sku;
  }
}
