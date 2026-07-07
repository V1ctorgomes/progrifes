import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Order, OrderItem, PaymentMethod, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { CreateOrderDto } from "./dto/order.dto";
import { OrdersRepository } from "./orders.repository";

type OrderWithItems = Order & { itens: OrderItem[] };

@Injectable()
export class OrdersService {
  constructor(
    private readonly repository: OrdersRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAllAdmin() {
    const orders = await this.repository.findMany();
    return orders.map((order) => this.toResponse(order));
  }

  async findById(id: string) {
    const order = await this.repository.findById(id);
    if (!order) {
      throw new NotFoundException("Pedido não encontrado");
    }
    return this.toResponse(order);
  }

  async findByNumero(numero: number) {
    const order = await this.repository.findByNumero(numero);
    if (!order) {
      throw new NotFoundException("Pedido não encontrado");
    }
    return this.toResponse(order);
  }

  async create(dto: CreateOrderDto) {
    if (dto.formaPagamento === PaymentMethod.DINHEIRO && dto.trocoPara === undefined) {
      // trocoPara is optional even for cash - only required if user needs change
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const preparedItems = await this.prepareItems(dto.itens, tx);
      const subtotal = preparedItems.reduce((sum, item) => sum + item.subtotal, 0);
      const taxaEntrega = 0;
      const total = subtotal + taxaEntrega;
      const numero = await this.repository.getNextNumero(tx);

      return tx.order.create({
        data: {
          numero,
          clienteNome: dto.clienteNome.trim(),
          clienteTelefone: dto.clienteTelefone.trim(),
          clienteEmail: dto.clienteEmail?.trim() || null,
          cep: dto.cep.trim(),
          rua: dto.rua.trim(),
          numeroEndereco: dto.numeroEndereco.trim(),
          bairro: dto.bairro.trim(),
          cidade: dto.cidade.trim(),
          estado: dto.estado.trim().toUpperCase(),
          complemento: dto.complemento?.trim() || null,
          referencia: dto.referencia?.trim() || null,
          formaPagamento: dto.formaPagamento,
          trocoPara: dto.trocoPara ?? null,
          observacoes: dto.observacoes?.trim() || null,
          subtotal,
          taxaEntrega,
          total,
          itens: {
            create: preparedItems.map((item) => ({
              produtoId: item.produtoId,
              variantId: item.variantId,
              produtoNome: item.produtoNome,
              sku: item.sku,
              cor: item.cor,
              tamanho: item.tamanho,
              quantidade: item.quantidade,
              precoUnitario: item.precoUnitario,
              subtotal: item.subtotal,
            })),
          },
        },
        include: { itens: true },
      });
    });

    const response = this.toResponse(order);
    return {
      ...response,
      whatsappUrl: this.buildWhatsAppUrl(response),
      whatsappMessage: this.buildWhatsAppMessage(response),
    };
  }

  private async prepareItems(
    items: CreateOrderDto["itens"],
    tx: Prisma.TransactionClient,
  ) {
    const prepared: Array<{
      produtoId: string;
      variantId: string;
      produtoNome: string;
      sku: string;
      cor: string | null;
      tamanho: string | null;
      quantidade: number;
      precoUnitario: number;
      subtotal: number;
    }> = [];

    for (const item of items) {
      const variant = await tx.productVariant.findFirst({
        where: { id: item.varianteId, deletedAt: null, ativo: true },
        include: {
          produto: true,
          atributos: {
            include: {
              attributeValue: { include: { attribute: true } },
            },
          },
        },
      });

      if (!variant || !variant.produto.ativo || variant.produto.deletedAt) {
        throw new BadRequestException(`Variante inválida ou indisponível: ${item.varianteId}`);
      }

      if (variant.estoque < item.quantidade) {
        throw new BadRequestException(
          `Estoque insuficiente para ${variant.produto.nome} (${variant.sku}). Disponível: ${variant.estoque}`,
        );
      }

      const precoUnitario = variant.preco
        ? Number(variant.preco)
        : Number(variant.produto.preco);

      const cor =
        variant.atributos.find((attr) => attr.attributeValue.attribute.nome === "Cor")
          ?.attributeValue.valor ?? null;
      const tamanho =
        variant.atributos.find((attr) => attr.attributeValue.attribute.nome === "Tamanho")
          ?.attributeValue.valor ?? null;

      prepared.push({
        produtoId: variant.produtoId,
        variantId: variant.id,
        produtoNome: variant.produto.nome,
        sku: variant.sku,
        cor,
        tamanho,
        quantidade: item.quantidade,
        precoUnitario,
        subtotal: precoUnitario * item.quantidade,
      });
    }

    return prepared;
  }

  formatNumero(numero: number) {
    return `#${String(numero).padStart(6, "0")}`;
  }

  buildWhatsAppMessage(order: ReturnType<OrdersService["toResponse"]>) {
    return [
      "Olá!",
      "",
      "Acabei de realizar um pedido pelo site da Grifres.",
      "",
      `Pedido: ${order.numeroFormatado}`,
      "",
      `Nome: ${order.clienteNome}`,
      "",
      `Telefone: ${order.clienteTelefone}`,
      "",
      "Aguardo a confirmação.",
      "",
      "Obrigado!",
    ].join("\n");
  }

  buildWhatsAppUrl(order: ReturnType<OrdersService["toResponse"]>) {
    const phone = process.env.WHATSAPP_NUMBER ?? process.env.STORE_WHATSAPP ?? "5585989484821";
    const message = this.buildWhatsAppMessage(order);
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  private toResponse(order: OrderWithItems) {
    return {
      id: order.id,
      numero: order.numero,
      numeroFormatado: this.formatNumero(order.numero),
      clienteNome: order.clienteNome,
      clienteTelefone: order.clienteTelefone,
      clienteEmail: order.clienteEmail,
      cep: order.cep,
      rua: order.rua,
      numeroEndereco: order.numeroEndereco,
      bairro: order.bairro,
      cidade: order.cidade,
      estado: order.estado,
      complemento: order.complemento,
      referencia: order.referencia,
      formaPagamento: order.formaPagamento,
      trocoPara: order.trocoPara ? Number(order.trocoPara) : null,
      observacoes: order.observacoes,
      subtotal: Number(order.subtotal),
      taxaEntrega: Number(order.taxaEntrega),
      total: Number(order.total),
      status: order.status,
      statusLabel: "Aguardando Confirmação",
      itens: order.itens.map((item) => ({
        id: item.id,
        produtoId: item.produtoId,
        variantId: item.variantId,
        produtoNome: item.produtoNome,
        sku: item.sku,
        cor: item.cor,
        tamanho: item.tamanho,
        quantidade: item.quantidade,
        precoUnitario: Number(item.precoUnitario),
        subtotal: Number(item.subtotal),
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
