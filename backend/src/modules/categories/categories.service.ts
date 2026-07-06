import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Category } from "@prisma/client";
import { slugify } from "../../common/utils/mappers";
import { CategoriesRepository } from "./categories.repository";
import {
  CreateCategoryDto,
  ReorderCategoriesDto,
  UpdateCategoryDto,
} from "./dto/category.dto";

@Injectable()
export class CategoriesService {
  constructor(private readonly repository: CategoriesRepository) {}

  async findPublic() {
    const categories = await this.repository.findMany({ ativo: true });
    return categories.map((category) => this.toResponse(category));
  }

  async findAll() {
    const categories = await this.repository.findMany();
    return categories.map((category) => this.toResponse(category));
  }

  async findBySlug(slug: string) {
    const category = await this.repository.findBySlug(slug);
    if (!category || !category.ativo) {
      throw new NotFoundException("Categoria não encontrada");
    }
    return this.toResponse(category);
  }

  async create(dto: CreateCategoryDto) {
    const slug = await this.resolveSlug(dto.slug ?? slugify(dto.nome));
    await this.validateParent(dto.categoriaPaiId ?? null);

    const maxOrder = await this.repository.getNextOrder(dto.categoriaPaiId ?? null);
    const ordem = dto.ordem ?? (maxOrder._max.ordem ?? 0) + 1;

    const category = await this.repository.create({
      nome: dto.nome,
      slug,
      descricao: dto.descricao,
      imagem: dto.imagem,
      banner: dto.banner,
      ordem,
      ativo: dto.ativo ?? true,
      categoriaPai: dto.categoriaPaiId
        ? { connect: { id: dto.categoriaPaiId } }
        : undefined,
    });

    return this.toResponse(category);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const current = await this.ensureExists(id);

    if (dto.categoriaPaiId === id) {
      throw new BadRequestException("Uma categoria não pode ser pai dela mesma");
    }

    await this.validateParent(dto.categoriaPaiId ?? current.categoriaPaiId);

    const slug = dto.slug
      ? await this.resolveSlug(dto.slug, id)
      : dto.nome
        ? await this.resolveSlug(slugify(dto.nome), id)
        : undefined;

    const category = await this.repository.update(id, {
      nome: dto.nome,
      slug,
      descricao: dto.descricao,
      imagem: dto.imagem,
      banner: dto.banner,
      ordem: dto.ordem,
      ativo: dto.ativo,
      categoriaPai:
        dto.categoriaPaiId === null
          ? { disconnect: true }
          : dto.categoriaPaiId
            ? { connect: { id: dto.categoriaPaiId } }
            : undefined,
    });

    return this.toResponse(category);
  }

  async remove(id: string) {
    await this.ensureExists(id);

    const children = await this.repository.count({ categoriaPaiId: id });
    if (children > 0) {
      throw new BadRequestException(
        "Não é possível excluir uma categoria com subcategorias",
      );
    }

    await this.repository.delete(id);
    return { message: "Categoria removida com sucesso" };
  }

  async activate(id: string) {
    await this.ensureExists(id);
    const category = await this.repository.update(id, { ativo: true });
    return this.toResponse(category);
  }

  async deactivate(id: string) {
    await this.ensureExists(id);
    const category = await this.repository.update(id, { ativo: false });
    return this.toResponse(category);
  }

  async reorder(dto: ReorderCategoriesDto) {
    await Promise.all(
      dto.ids.map((id, index) =>
        this.repository.update(id, { ordem: index + 1 }),
      ),
    );

    return this.findAll();
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

  private async validateParent(categoriaPaiId: string | null) {
    if (!categoriaPaiId) {
      return;
    }

    const parent = await this.repository.findById(categoriaPaiId);
    if (!parent) {
      throw new BadRequestException("Categoria pai inválida");
    }
  }

  private async ensureExists(id: string) {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new NotFoundException("Categoria não encontrada");
    }
    return category;
  }

  private toResponse(category: Category) {
    return {
      id: category.id,
      nome: category.nome,
      slug: category.slug,
      descricao: category.descricao,
      imagem: category.imagem,
      banner: category.banner,
      categoriaPai: category.categoriaPaiId,
      ordem: category.ordem,
      ativo: category.ativo,
      productCount: 0,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
