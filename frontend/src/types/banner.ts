export type BannerType = "hero" | "horizontal" | "promocional" | "institucional";

export type Banner = {
  id: string;
  nome: string;
  tipo: BannerType;
  titulo: string;
  subtitulo?: string;
  descricao?: string;
  imagemDesktop: string;
  imagemMobile?: string;
  textoBotaoPrimario?: string;
  textoBotaoSecundario?: string;
  linkPrimario?: string;
  linkSecundario?: string;
  ativo: boolean;
  ordem: number;
};
