import { Injectable, NotFoundException } from "@nestjs/common";
import { Banner } from "@prisma/client";
import { bannerTypeToClient } from "../../common/utils/mappers";
import { BannersRepository } from "./banners.repository";
import { CreateBannerDto, ReorderDto, UpdateBannerDto } from "./dto/banner.dto";

@Injectable()
export class BannersService {
  constructor(private readonly repository: BannersRepository) {}

  async findPublic() {
    const banners = await this.repository.findMany({ ativo: true });
    return banners.map((banner) => this.toResponse(banner));
  }

  async findAll() {
    const banners = await this.repository.findMany();
    return banners.map((banner) => this.toResponse(banner));
  }

  async create(dto: CreateBannerDto) {
    const maxOrder = await this.repository.getNextOrder(dto.tipo);
    const ordem = dto.ordem ?? (maxOrder._max.ordem ?? 0) + 1;

    const banner = await this.repository.create({
      nome: dto.nome,
      titulo: dto.titulo,
      subtitulo: dto.subtitulo,
      descricao: dto.descricao,
      imagemDesktop: dto.imagemDesktop,
      imagemMobile: dto.imagemMobile,
      tipo: dto.tipo,
      link: dto.link,
      textoBotaoPrimario: dto.textoBotaoPrimario,
      textoBotaoSecundario: dto.textoBotaoSecundario,
      linkPrimario: dto.linkPrimario ?? dto.link,
      linkSecundario: dto.linkSecundario,
      ordem,
      ativo: dto.ativo ?? true,
    });

    return this.toResponse(banner);
  }

  async update(id: string, dto: UpdateBannerDto) {
    await this.ensureExists(id);

    const banner = await this.repository.update(id, {
      ...dto,
      linkPrimario: dto.linkPrimario ?? dto.link,
    });

    return this.toResponse(banner);
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.repository.delete(id);
    return { message: "Banner removido com sucesso" };
  }

  async activate(id: string) {
    await this.ensureExists(id);
    const banner = await this.repository.update(id, { ativo: true });
    return this.toResponse(banner);
  }

  async deactivate(id: string) {
    await this.ensureExists(id);
    const banner = await this.repository.update(id, { ativo: false });
    return this.toResponse(banner);
  }

  async reorder(dto: ReorderDto) {
    await Promise.all(
      dto.ids.map((id, index) =>
        this.repository.update(id, { ordem: index + 1 }),
      ),
    );

    return this.findAll();
  }

  private async ensureExists(id: string) {
    const banner = await this.repository.findById(id);
    if (!banner) {
      throw new NotFoundException("Banner não encontrado");
    }
    return banner;
  }

  private toResponse(banner: Banner) {
    return {
      id: banner.id,
      nome: banner.nome ?? banner.titulo,
      titulo: banner.titulo,
      subtitulo: banner.subtitulo ?? undefined,
      descricao: banner.descricao ?? undefined,
      imagemDesktop: banner.imagemDesktop,
      imagemMobile: banner.imagemMobile ?? undefined,
      tipo: bannerTypeToClient(banner.tipo),
      link: banner.link ?? undefined,
      textoBotaoPrimario: banner.textoBotaoPrimario ?? undefined,
      textoBotaoSecundario: banner.textoBotaoSecundario ?? undefined,
      linkPrimario: banner.linkPrimario ?? banner.link ?? undefined,
      linkSecundario: banner.linkSecundario ?? undefined,
      ordem: banner.ordem,
      ativo: banner.ativo,
      createdAt: banner.createdAt,
      updatedAt: banner.updatedAt,
    };
  }
}
