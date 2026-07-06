import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Attribute, AttributeValue } from "@prisma/client";
import {
  AddAttributeValueDto,
  CreateAttributeDto,
  UpdateAttributeDto,
} from "./dto/attribute.dto";
import { AttributesRepository } from "./attributes.repository";

type AttributeWithValues = Attribute & { valores: AttributeValue[] };

@Injectable()
export class AttributesService {
  constructor(private readonly repository: AttributesRepository) {}

  findAll() {
    return this.repository.findAll().then((items) => items.map((item) => this.toResponse(item)));
  }

  async findById(id: string) {
    const attribute = await this.repository.findById(id);
    if (!attribute) {
      throw new NotFoundException("Atributo não encontrado");
    }
    return this.toResponse(attribute);
  }

  async create(dto: CreateAttributeDto) {
    const existing = await this.repository.findByNome(dto.nome);
    if (existing) {
      throw new BadRequestException("Já existe um atributo com este nome");
    }

    const attribute = await this.repository.create({
      nome: dto.nome,
      tipo: dto.tipo ?? "text",
      valores: dto.valores?.length
        ? { create: dto.valores.map((item) => ({ valor: item.valor })) }
        : undefined,
    });

    return this.toResponse(attribute);
  }

  async update(id: string, dto: UpdateAttributeDto) {
    await this.ensureExists(id);

    if (dto.nome) {
      const existing = await this.repository.findByNome(dto.nome);
      if (existing && existing.id !== id) {
        throw new BadRequestException("Já existe um atributo com este nome");
      }
    }

    const attribute = await this.repository.update(id, {
      nome: dto.nome,
      tipo: dto.tipo,
    });

    return this.toResponse(attribute);
  }

  async remove(id: string) {
    const attribute = await this.ensureExists(id);

    for (const value of attribute.valores) {
      const usage = await this.repository.countValueUsage(value.id);
      if (usage > 0) {
        throw new BadRequestException(
          `O valor "${value.valor}" está em uso por variantes e não pode ser removido`,
        );
      }
    }

    await this.repository.delete(id);
    return { message: "Atributo removido com sucesso" };
  }

  async addValue(attributeId: string, dto: AddAttributeValueDto) {
    const attribute = await this.ensureExists(attributeId);
    const duplicate = attribute.valores.find(
      (value) => value.valor.toLowerCase() === dto.valor.toLowerCase(),
    );

    if (duplicate) {
      throw new BadRequestException("Este valor já existe para o atributo");
    }

    const value = await this.repository.addValue(attributeId, dto.valor);
    return {
      id: value.id,
      attributeId: value.attributeId,
      valor: value.valor,
    };
  }

  async removeValue(valueId: string) {
    const value = await this.repository.findValueById(valueId);
    if (!value) {
      throw new NotFoundException("Valor não encontrado");
    }

    const usage = await this.repository.countValueUsage(valueId);
    if (usage > 0) {
      throw new BadRequestException("Valor em uso por variantes e não pode ser removido");
    }

    await this.repository.deleteValue(valueId);
    return { message: "Valor removido com sucesso" };
  }

  private async ensureExists(id: string) {
    const attribute = await this.repository.findById(id);
    if (!attribute) {
      throw new NotFoundException("Atributo não encontrado");
    }
    return attribute;
  }

  private toResponse(attribute: AttributeWithValues) {
    return {
      id: attribute.id,
      nome: attribute.nome,
      tipo: attribute.tipo,
      valores: attribute.valores.map((value) => ({
        id: value.id,
        valor: value.valor,
      })),
      createdAt: attribute.createdAt,
      updatedAt: attribute.updatedAt,
    };
  }
}
