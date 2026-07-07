-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('AGUARDANDO_CONFIRMACAO');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'DINHEIRO', 'CARTAO_ENTREGA');

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "cliente_nome" TEXT NOT NULL,
    "cliente_telefone" TEXT NOT NULL,
    "cliente_email" TEXT,
    "cep" TEXT NOT NULL,
    "rua" TEXT NOT NULL,
    "numero_endereco" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "complemento" TEXT,
    "referencia" TEXT,
    "forma_pagamento" "PaymentMethod" NOT NULL,
    "troco_para" DECIMAL(10,2),
    "observacoes" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxa_entrega" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'AGUARDANDO_CONFIRMACAO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "produto_nome" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "cor" TEXT,
    "tamanho" TEXT,
    "quantidade" INTEGER NOT NULL,
    "preco_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_numero_key" ON "orders"("numero");

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
