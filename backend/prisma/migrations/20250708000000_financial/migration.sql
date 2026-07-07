-- CreateEnum
CREATE TYPE "FinancialAccountType" AS ENUM ('CONTA_CORRENTE', 'CONTA_POUPANCA', 'CONTA_DIGITAL');

-- CreateEnum
CREATE TYPE "FinancialTransactionType" AS ENUM ('RECEITA', 'DESPESA', 'TRANSFERENCIA', 'AJUSTE');

-- CreateEnum
CREATE TYPE "FinancialTransactionStatus" AS ENUM ('PENDENTE', 'RECEBIDO', 'PAGO', 'CANCELADO', 'VENCIDO', 'PARCIALMENTE_PAGO');

-- CreateEnum
CREATE TYPE "FinancialOriginType" AS ENUM ('PEDIDO', 'COMPRA', 'RECEBIMENTO', 'CLIENTE', 'FORNECEDOR', 'DESPESA', 'TRANSFERENCIA', 'AJUSTE', 'LANCAMENTO_MANUAL');

-- CreateEnum
CREATE TYPE "ChartAccountType" AS ENUM ('RECEITA', 'DESPESA');

-- CreateTable
CREATE TABLE "financial_chart_accounts" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "ChartAccountType" NOT NULL,
    "parent_id" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_chart_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_categories" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "chart_account_id" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_cost_centers" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_cost_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_accounts" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "banco" TEXT,
    "agencia" TEXT,
    "conta" TEXT,
    "tipo" "FinancialAccountType" NOT NULL,
    "saldo_inicial" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_cashboxes" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "saldo_inicial" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_cashboxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_payment_methods" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_transactions" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "tipo" "FinancialTransactionType" NOT NULL,
    "origem" "FinancialOriginType" NOT NULL,
    "origem_referencia_id" TEXT,
    "category_id" TEXT NOT NULL,
    "chart_account_id" TEXT,
    "cost_center_id" TEXT,
    "bank_account_id" TEXT,
    "cashbox_id" TEXT,
    "payment_method_id" TEXT,
    "valor" DECIMAL(12,2) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "competencia" TIMESTAMP(3) NOT NULL,
    "vencimento" TIMESTAMP(3),
    "pagamento" TIMESTAMP(3),
    "status" "FinancialTransactionStatus" NOT NULL DEFAULT 'PENDENTE',
    "observacoes" TEXT,
    "account_payable_id" TEXT,
    "usuario_id" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_transaction_history" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "operacao" TEXT NOT NULL,
    "usuario_id" TEXT,
    "ip" TEXT,
    "origem" TEXT,
    "valor_anterior" DECIMAL(12,2),
    "valor_novo" DECIMAL(12,2),
    "descricao" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_transaction_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "financial_chart_accounts_codigo_key" ON "financial_chart_accounts"("codigo");

-- CreateIndex
CREATE INDEX "financial_chart_accounts_parent_id_idx" ON "financial_chart_accounts"("parent_id");

-- CreateIndex
CREATE INDEX "financial_chart_accounts_tipo_idx" ON "financial_chart_accounts"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "financial_categories_codigo_key" ON "financial_categories"("codigo");

-- CreateIndex
CREATE INDEX "financial_categories_chart_account_id_idx" ON "financial_categories"("chart_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_cost_centers_codigo_key" ON "financial_cost_centers"("codigo");

-- CreateIndex
CREATE INDEX "financial_accounts_ativo_idx" ON "financial_accounts"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "financial_cashboxes_codigo_key" ON "financial_cashboxes"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "financial_payment_methods_codigo_key" ON "financial_payment_methods"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "financial_transactions_numero_key" ON "financial_transactions"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "financial_transactions_account_payable_id_key" ON "financial_transactions"("account_payable_id");

-- CreateIndex
CREATE INDEX "financial_transactions_data_idx" ON "financial_transactions"("data");

-- CreateIndex
CREATE INDEX "financial_transactions_competencia_idx" ON "financial_transactions"("competencia");

-- CreateIndex
CREATE INDEX "financial_transactions_category_id_idx" ON "financial_transactions"("category_id");

-- CreateIndex
CREATE INDEX "financial_transactions_bank_account_id_idx" ON "financial_transactions"("bank_account_id");

-- CreateIndex
CREATE INDEX "financial_transactions_cashbox_id_idx" ON "financial_transactions"("cashbox_id");

-- CreateIndex
CREATE INDEX "financial_transactions_status_idx" ON "financial_transactions"("status");

-- CreateIndex
CREATE INDEX "financial_transactions_origem_idx" ON "financial_transactions"("origem");

-- CreateIndex
CREATE INDEX "financial_transactions_tipo_idx" ON "financial_transactions"("tipo");

-- CreateIndex
CREATE INDEX "financial_transactions_vencimento_idx" ON "financial_transactions"("vencimento");

-- CreateIndex
CREATE INDEX "financial_transaction_history_transaction_id_idx" ON "financial_transaction_history"("transaction_id");

-- CreateIndex
CREATE INDEX "financial_transaction_history_created_at_idx" ON "financial_transaction_history"("created_at");

-- AddForeignKey
ALTER TABLE "financial_chart_accounts" ADD CONSTRAINT "financial_chart_accounts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "financial_chart_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_categories" ADD CONSTRAINT "financial_categories_chart_account_id_fkey" FOREIGN KEY ("chart_account_id") REFERENCES "financial_chart_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "financial_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_chart_account_id_fkey" FOREIGN KEY ("chart_account_id") REFERENCES "financial_chart_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "financial_cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "financial_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_cashbox_id_fkey" FOREIGN KEY ("cashbox_id") REFERENCES "financial_cashboxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "financial_payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_account_payable_id_fkey" FOREIGN KEY ("account_payable_id") REFERENCES "accounts_payable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transaction_history" ADD CONSTRAINT "financial_transaction_history_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "financial_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transaction_history" ADD CONSTRAINT "financial_transaction_history_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed: Plano de Contas
INSERT INTO "financial_chart_accounts" ("id", "codigo", "nome", "tipo", "parent_id", "updated_at") VALUES
('fca-receitas', 'RECEITAS', 'Receitas', 'RECEITA', NULL, CURRENT_TIMESTAMP),
('fca-despesas', 'DESPESAS', 'Despesas', 'DESPESA', NULL, CURRENT_TIMESTAMP),
('fca-vendas', 'RECEITAS_VENDAS', 'Vendas', 'RECEITA', 'fca-receitas', CURRENT_TIMESTAMP),
('fca-servicos', 'RECEITAS_SERVICOS', 'Serviços', 'RECEITA', 'fca-receitas', CURRENT_TIMESTAMP),
('fca-receitas-outros', 'RECEITAS_OUTROS', 'Outros', 'RECEITA', 'fca-receitas', CURRENT_TIMESTAMP),
('fca-compras', 'DESPESAS_COMPRAS', 'Compras', 'DESPESA', 'fca-despesas', CURRENT_TIMESTAMP),
('fca-aluguel', 'DESPESAS_ALUGUEL', 'Aluguel', 'DESPESA', 'fca-despesas', CURRENT_TIMESTAMP),
('fca-energia', 'DESPESAS_ENERGIA', 'Energia', 'DESPESA', 'fca-despesas', CURRENT_TIMESTAMP),
('fca-agua', 'DESPESAS_AGUA', 'Água', 'DESPESA', 'fca-despesas', CURRENT_TIMESTAMP),
('fca-internet', 'DESPESAS_INTERNET', 'Internet', 'DESPESA', 'fca-despesas', CURRENT_TIMESTAMP),
('fca-marketing', 'DESPESAS_MARKETING', 'Marketing', 'DESPESA', 'fca-despesas', CURRENT_TIMESTAMP),
('fca-salarios', 'DESPESAS_SALARIOS', 'Salários', 'DESPESA', 'fca-despesas', CURRENT_TIMESTAMP),
('fca-impostos', 'DESPESAS_IMPOSTOS', 'Impostos', 'DESPESA', 'fca-despesas', CURRENT_TIMESTAMP),
('fca-despesas-outros', 'DESPESAS_OUTROS', 'Outros', 'DESPESA', 'fca-despesas', CURRENT_TIMESTAMP);

-- Seed: Categorias Financeiras
INSERT INTO "financial_categories" ("id", "codigo", "nome", "chart_account_id", "updated_at") VALUES
('fcat-venda', 'VENDA', 'Venda', 'fca-vendas', CURRENT_TIMESTAMP),
('fcat-compra', 'COMPRA', 'Compra', 'fca-compras', CURRENT_TIMESTAMP),
('fcat-fornecedor', 'FORNECEDOR', 'Fornecedor', 'fca-compras', CURRENT_TIMESTAMP),
('fcat-cliente', 'CLIENTE', 'Cliente', 'fca-vendas', CURRENT_TIMESTAMP),
('fcat-despesa-op', 'DESPESA_OPERACIONAL', 'Despesa Operacional', 'fca-despesas-outros', CURRENT_TIMESTAMP),
('fcat-investimento', 'INVESTIMENTO', 'Investimento', 'fca-despesas-outros', CURRENT_TIMESTAMP),
('fcat-impostos', 'IMPOSTOS', 'Impostos', 'fca-impostos', CURRENT_TIMESTAMP),
('fcat-frete', 'FRETE', 'Frete', 'fca-despesas-outros', CURRENT_TIMESTAMP),
('fcat-marketing', 'MARKETING', 'Marketing', 'fca-marketing', CURRENT_TIMESTAMP),
('fcat-outros', 'OUTROS', 'Outros', 'fca-despesas-outros', CURRENT_TIMESTAMP);

-- Seed: Centros de Custo
INSERT INTO "financial_cost_centers" ("id", "codigo", "nome", "principal", "updated_at") VALUES
('fcc-loja', 'LOJA', 'Loja', true, CURRENT_TIMESTAMP),
('fcc-admin', 'ADMINISTRATIVO', 'Administrativo', false, CURRENT_TIMESTAMP),
('fcc-mkt', 'MARKETING', 'Marketing', false, CURRENT_TIMESTAMP),
('fcc-log', 'LOGISTICA', 'Logística', false, CURRENT_TIMESTAMP),
('fcc-fin', 'FINANCEIRO', 'Financeiro', false, CURRENT_TIMESTAMP),
('fcc-outros', 'OUTROS', 'Outros', false, CURRENT_TIMESTAMP);

-- Seed: Formas de Pagamento
INSERT INTO "financial_payment_methods" ("id", "codigo", "nome", "updated_at") VALUES
('fpm-dinheiro', 'DINHEIRO', 'Dinheiro', CURRENT_TIMESTAMP),
('fpm-pix', 'PIX', 'PIX', CURRENT_TIMESTAMP),
('fpm-debito', 'CARTAO_DEBITO', 'Cartão Débito', CURRENT_TIMESTAMP),
('fpm-credito', 'CARTAO_CREDITO', 'Cartão Crédito', CURRENT_TIMESTAMP),
('fpm-transferencia', 'TRANSFERENCIA', 'Transferência', CURRENT_TIMESTAMP),
('fpm-boleto', 'BOLETO', 'Boleto', CURRENT_TIMESTAMP);

-- Seed: Caixa Principal
INSERT INTO "financial_cashboxes" ("id", "codigo", "nome", "updated_at") VALUES
('fcb-principal', 'CAIXA_PRINCIPAL', 'Caixa Principal', CURRENT_TIMESTAMP);
