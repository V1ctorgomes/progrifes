-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'CONFIRMADO';
ALTER TYPE "OrderStatus" ADD VALUE 'SEPARANDO';
ALTER TYPE "OrderStatus" ADD VALUE 'PRONTO_PARA_ENTREGA';
ALTER TYPE "OrderStatus" ADD VALUE 'SAIU_PARA_ENTREGA';
ALTER TYPE "OrderStatus" ADD VALUE 'ENTREGUE';
ALTER TYPE "OrderStatus" ADD VALUE 'CANCELADO';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "motivo_cancelamento" TEXT,
ADD COLUMN "confirmado_em" TIMESTAMP(3),
ADD COLUMN "separado_em" TIMESTAMP(3),
ADD COLUMN "pronto_entrega_em" TIMESTAMP(3),
ADD COLUMN "saiu_entrega_em" TIMESTAMP(3),
ADD COLUMN "entregue_em" TIMESTAMP(3),
ADD COLUMN "cancelado_em" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "order_history" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "status" "OrderStatus" NOT NULL,
    "descricao" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "order_history" ADD CONSTRAINT "order_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_history" ADD CONSTRAINT "order_history_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
