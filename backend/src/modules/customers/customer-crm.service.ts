import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import {
  AssignCustomerTagDto,
  CreateCustomerNoteDto,
  CreateCustomerTagDto,
  ListCustomerOrdersQueryDto,
  UpdateCustomerCrmDto,
} from "./dto/customer.dto";
import { getStatusMeta } from "../orders/order-status.config";

@Injectable()
export class CustomerCrmService {
  constructor(private readonly prisma: PrismaService) {}

  async getCrm(customerId: string) {
    const customer = await this.ensureCustomer(customerId);

    const tags = await this.prisma.customerTagRelation.findMany({
      where: { customerId },
      include: { tag: true },
      orderBy: { createdAt: "desc" },
    });

    return {
      origem: customer.origem,
      canalAtendimento: customer.canalAtendimento,
      responsavelId: customer.responsavelId,
      responsavel: customer.responsavel
        ? {
            id: customer.responsavel.id,
            nome: customer.responsavel.nome,
            email: customer.responsavel.email,
          }
        : null,
      observacoesComerciais: customer.observacoesComerciais,
      tags: tags.map((relation) => ({
        id: relation.tag.id,
        nome: relation.tag.nome,
        cor: relation.tag.cor,
        aplicadaEm: relation.createdAt,
      })),
    };
  }

  async updateCrm(customerId: string, dto: UpdateCustomerCrmDto) {
    await this.ensureCustomer(customerId);

    if (dto.responsavelId) {
      const user = await this.prisma.user.findUnique({ where: { id: dto.responsavelId } });
      if (!user) {
        throw new BadRequestException("Responsável inválido");
      }
    }

    const customer = await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        origem: dto.origem === undefined ? undefined : dto.origem?.trim() || null,
        canalAtendimento:
          dto.canalAtendimento === undefined
            ? undefined
            : dto.canalAtendimento?.trim() || null,
        responsavelId:
          dto.responsavelId === undefined
            ? undefined
            : dto.responsavelId,
        observacoesComerciais:
          dto.observacoesComerciais === undefined
            ? undefined
            : dto.observacoesComerciais?.trim() || null,
      },
      include: {
        responsavel: { select: { id: true, nome: true, email: true } },
      },
    });

    return this.getCrm(customer.id);
  }

  async getOrders(customerId: string, query: ListCustomerOrdersQueryDto) {
    await this.ensureCustomer(customerId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { customerId },
        include: { itens: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where: { customerId } }),
    ]);

    return {
      data: orders.map((order) => {
        const statusMeta = getStatusMeta(order.status);
        const itemCount = order.itens.reduce((sum, item) => sum + item.quantidade, 0);
        return {
          id: order.id,
          numero: order.numero,
          numeroFormatado: `#${String(order.numero).padStart(6, "0")}`,
          status: order.status,
          statusLabel: statusMeta.nome,
          statusCor: statusMeta.cor,
          formaPagamento: order.formaPagamento,
          total: Number(order.total),
          itemCount,
          createdAt: order.createdAt,
        };
      }),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getNotes(customerId: string) {
    await this.ensureCustomer(customerId);

    const notes = await this.prisma.customerNote.findMany({
      where: { customerId, deletedAt: null },
      include: { usuario: { select: { id: true, nome: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    return notes.map((note) => ({
      id: note.id,
      descricao: note.descricao,
      usuario: note.usuario,
      createdAt: note.createdAt,
    }));
  }

  async createNote(customerId: string, dto: CreateCustomerNoteDto, usuarioId?: string) {
    await this.ensureCustomer(customerId);

    const note = await this.prisma.customerNote.create({
      data: {
        customerId,
        usuarioId: usuarioId ?? null,
        descricao: dto.descricao.trim(),
      },
      include: { usuario: { select: { id: true, nome: true, email: true } } },
    });

    return {
      id: note.id,
      descricao: note.descricao,
      usuario: note.usuario,
      createdAt: note.createdAt,
    };
  }

  async deleteNote(customerId: string, noteId: string) {
    await this.ensureCustomer(customerId);

    const note = await this.prisma.customerNote.findFirst({
      where: { id: noteId, customerId, deletedAt: null },
    });

    if (!note) {
      throw new NotFoundException("Observação não encontrada");
    }

    await this.prisma.customerNote.update({
      where: { id: noteId },
      data: { deletedAt: new Date() },
    });

    return { message: "Observação removida com sucesso" };
  }

  async listTags() {
    return this.prisma.customerTag.findMany({ orderBy: { nome: "asc" } });
  }

  async createTag(dto: CreateCustomerTagDto) {
    const existing = await this.prisma.customerTag.findUnique({
      where: { nome: dto.nome.trim() },
    });
    if (existing) {
      throw new BadRequestException("Já existe uma tag com este nome");
    }

    return this.prisma.customerTag.create({
      data: {
        nome: dto.nome.trim(),
        cor: dto.cor?.trim() || "#111111",
      },
    });
  }

  async assignTag(customerId: string, dto: AssignCustomerTagDto) {
    await this.ensureCustomer(customerId);

    let tagId = dto.tagId;
    if (!tagId) {
      if (!dto.nome?.trim()) {
        throw new BadRequestException("Informe tagId ou nome da tag");
      }
      const tag = await this.prisma.customerTag.upsert({
        where: { nome: dto.nome.trim() },
        update: {},
        create: {
          nome: dto.nome.trim(),
          cor: dto.cor?.trim() || "#111111",
        },
      });
      tagId = tag.id;
    }

    const tag = await this.prisma.customerTag.findUnique({ where: { id: tagId } });
    if (!tag) {
      throw new NotFoundException("Tag não encontrada");
    }

    await this.prisma.customerTagRelation.upsert({
      where: { customerId_tagId: { customerId, tagId } },
      update: {},
      create: { customerId, tagId },
    });

    return this.getCrm(customerId);
  }

  async removeTag(customerId: string, tagId: string) {
    await this.ensureCustomer(customerId);

    const relation = await this.prisma.customerTagRelation.findUnique({
      where: { customerId_tagId: { customerId, tagId } },
    });

    if (!relation) {
      throw new NotFoundException("Tag não vinculada a este cliente");
    }

    await this.prisma.customerTagRelation.delete({
      where: { customerId_tagId: { customerId, tagId } },
    });

    return { message: "Tag removida do cliente" };
  }

  private async ensureCustomer(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: { responsavel: { select: { id: true, nome: true, email: true } } },
    });
    if (!customer) {
      throw new NotFoundException("Cliente não encontrado");
    }
    return customer;
  }
}
