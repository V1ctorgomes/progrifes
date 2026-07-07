const adminModules = [
  "produtos",
  "categorias",
  "pedidos",
  "clientes",
  "estoque",
  "financeiro",
] as const;

function createPlaceholderPage(title: string) {
  return function AdminModulePage() {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
          {title}
        </h1>
        <p className="text-brand-gray">Módulo em desenvolvimento.</p>
      </div>
    );
  };
}

export const ProdutosPage = createPlaceholderPage("Produtos");
export const CategoriasPage = createPlaceholderPage("Categorias");
export const PedidosPage = createPlaceholderPage("Pedidos");
export const ClientesPage = createPlaceholderPage("Clientes");
export const EstoquePage = createPlaceholderPage("Estoque");
export { FinancialOverviewPage as FinanceiroPage } from "@/features/admin/financial/FinancialOverviewPage";

export { adminModules };
