-- CreateEnum
CREATE TYPE "Weekday" AS ENUM (
  'DOMINGO',
  'SEGUNDA_FEIRA',
  'TERCA_FEIRA',
  'QUARTA_FEIRA',
  'QUINTA_FEIRA',
  'SEXTA_FEIRA',
  'SABADO'
);

-- CreateTable
CREATE TABLE "delivery_settings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "minimum_order_value" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "average_delivery_time" INTEGER NOT NULL DEFAULT 45,
  "message" TEXT NOT NULL DEFAULT 'Entrega realizada pela própria loja.',
  "closed_message" TEXT NOT NULL DEFAULT 'No momento estamos fora do horário de entrega.',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "delivery_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_business_hours" (
  "id" TEXT NOT NULL,
  "settings_id" TEXT NOT NULL,
  "weekday" "Weekday" NOT NULL,
  "is_open" BOOLEAN NOT NULL DEFAULT true,
  "start_time" TEXT NOT NULL DEFAULT '09:00',
  "end_time" TEXT NOT NULL DEFAULT '18:00',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "delivery_business_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_settings_history" (
  "id" TEXT NOT NULL,
  "settings_id" TEXT NOT NULL,
  "operacao" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "usuario_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "delivery_settings_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "delivery_business_hours_settings_id_weekday_key"
  ON "delivery_business_hours"("settings_id", "weekday");

-- CreateIndex
CREATE INDEX "delivery_settings_history_settings_id_idx"
  ON "delivery_settings_history"("settings_id");

-- CreateIndex
CREATE INDEX "delivery_settings_history_created_at_idx"
  ON "delivery_settings_history"("created_at");

-- AddForeignKey
ALTER TABLE "delivery_business_hours"
  ADD CONSTRAINT "delivery_business_hours_settings_id_fkey"
  FOREIGN KEY ("settings_id") REFERENCES "delivery_settings"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_settings_history"
  ADD CONSTRAINT "delivery_settings_history_settings_id_fkey"
  FOREIGN KEY ("settings_id") REFERENCES "delivery_settings"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_settings_history"
  ADD CONSTRAINT "delivery_settings_history_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default settings and business hours
INSERT INTO "delivery_settings" ("id", "updated_at")
VALUES ('default', CURRENT_TIMESTAMP);

INSERT INTO "delivery_business_hours" ("id", "settings_id", "weekday", "is_open", "start_time", "end_time", "updated_at")
VALUES
  (gen_random_uuid()::text, 'default', 'DOMINGO', false, '09:00', '18:00', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'default', 'SEGUNDA_FEIRA', true, '09:00', '18:00', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'default', 'TERCA_FEIRA', true, '09:00', '18:00', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'default', 'QUARTA_FEIRA', true, '09:00', '18:00', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'default', 'QUINTA_FEIRA', true, '09:00', '18:00', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'default', 'SEXTA_FEIRA', true, '09:00', '18:00', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'default', 'SABADO', true, '09:00', '14:00', CURRENT_TIMESTAMP);
