-- CreateEnum
CREATE TYPE "BannerType" AS ENUM ('HERO', 'HORIZONTAL', 'PROMOCIONAL', 'INSTITUCIONAL');

-- CreateTable
CREATE TABLE "banners" (
    "id" TEXT NOT NULL,
    "nome" TEXT,
    "titulo" TEXT NOT NULL,
    "subtitulo" TEXT,
    "descricao" TEXT,
    "imagem_desktop" TEXT NOT NULL,
    "imagem_mobile" TEXT,
    "tipo" "BannerType" NOT NULL,
    "link" TEXT,
    "texto_botao_primario" TEXT,
    "texto_botao_secundario" TEXT,
    "link_primario" TEXT,
    "link_secundario" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "imagem" TEXT NOT NULL,
    "banner" TEXT NOT NULL,
    "categoria_pai_id" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_categoria_pai_id_fkey" FOREIGN KEY ("categoria_pai_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
