-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PEDIDO_RECEBIDO', 'EM_SEPARACAO', 'PRONTO_PARA_ENTREGA', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'NAO_ENTREGUE', 'CANCELADO');

-- CreateTable
CREATE TABLE "deliveries" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "delivery_person_id" TEXT,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PEDIDO_RECEBIDO',
    "estimated_delivery_time" INTEGER,
    "left_for_delivery_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_history" (
    "id" TEXT NOT NULL,
    "delivery_id" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL,
    "usuario_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_order_id_key" ON "deliveries"("order_id");

-- CreateIndex
CREATE INDEX "deliveries_status_idx" ON "deliveries"("status");

-- CreateIndex
CREATE INDEX "deliveries_delivery_person_id_idx" ON "deliveries"("delivery_person_id");

-- CreateIndex
CREATE INDEX "deliveries_order_id_idx" ON "deliveries"("order_id");

-- CreateIndex
CREATE INDEX "deliveries_created_at_idx" ON "deliveries"("created_at");

-- CreateIndex
CREATE INDEX "delivery_history_delivery_id_idx" ON "delivery_history"("delivery_id");

-- CreateIndex
CREATE INDEX "delivery_history_created_at_idx" ON "delivery_history"("created_at");

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_delivery_person_id_fkey" FOREIGN KEY ("delivery_person_id") REFERENCES "delivery_persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_history" ADD CONSTRAINT "delivery_history_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_history" ADD CONSTRAINT "delivery_history_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill deliveries for existing orders
INSERT INTO "deliveries" (
    "id",
    "order_id",
    "delivery_person_id",
    "status",
    "estimated_delivery_time",
    "left_for_delivery_at",
    "delivered_at",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid()::text,
    o."id",
    o."delivery_person_id",
    CASE o."status"
        WHEN 'AGUARDANDO_CONFIRMACAO' THEN 'PEDIDO_RECEBIDO'::"DeliveryStatus"
        WHEN 'CONFIRMADO' THEN 'PEDIDO_RECEBIDO'::"DeliveryStatus"
        WHEN 'SEPARANDO' THEN 'EM_SEPARACAO'::"DeliveryStatus"
        WHEN 'PRONTO_PARA_ENTREGA' THEN 'PRONTO_PARA_ENTREGA'::"DeliveryStatus"
        WHEN 'SAIU_PARA_ENTREGA' THEN 'SAIU_PARA_ENTREGA'::"DeliveryStatus"
        WHEN 'ENTREGUE' THEN 'ENTREGUE'::"DeliveryStatus"
        WHEN 'CANCELADO' THEN 'CANCELADO'::"DeliveryStatus"
        ELSE 'PEDIDO_RECEBIDO'::"DeliveryStatus"
    END,
    o."prazo_entrega_minutos",
    o."saiu_entrega_em",
    o."entregue_em",
    o."created_at",
    o."updated_at"
FROM "orders" o
WHERE NOT EXISTS (
    SELECT 1 FROM "deliveries" d WHERE d."order_id" = o."id"
);
