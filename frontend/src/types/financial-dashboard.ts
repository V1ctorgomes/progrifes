export type DashboardPeriodPreset =
  | "HOJE"
  | "ULTIMOS_7_DIAS"
  | "ULTIMOS_30_DIAS"
  | "ESTE_MES"
  | "ESTE_ANO"
  | "PERSONALIZADO";

export type ComparisonTrend = "ALTA" | "BAIXA" | "ESTAVEL";

export type DashboardComparison = {
  valorAtual: number;
  valorAnterior: number;
  variacaoPercentual: number;
  tendencia: ComparisonTrend;
};

export type FinancialDashboardCards = {
  faturamentoDia: number;
  faturamentoMes: number;
  faturamentoPeriodo: number;
  lucroBruto: number;
  lucroLiquido: number;
  totalRecebido: number;
  totalPago: number;
  saldoAtual: number;
  fluxoCaixa: number;
  ticketMedio: number;
  quantidadePedidos: number;
  pedidosMes: number;
  quantidadeClientes: number;
  produtosVendidos: number;
  receitasRecebidas: number;
  despesasPagas: number;
  saldoBancario: number;
  saldoCaixa: number;
};

export type FinancialDashboardFinanceiro = {
  contasAReceber: number;
  contasAPagar: number;
  despesasPendentes: { quantidade: number; valor: number };
  despesasPagas: { quantidade: number; valor: number };
  receitasPendentes: number;
  receitasRecebidas: number;
  saldoBancario: number;
  saldoCaixa: number;
};

export type FinancialDashboardComercial = {
  pedidosHoje: number;
  pedidosMes: number;
  vendasPorCategoria: Array<{
    categoriaId: string;
    categoriaNome: string;
    total: number;
  }>;
  produtosMaisVendidos: Array<{
    produtoId: string;
    produtoNome: string;
    quantidade: number;
    total: number;
  }>;
  clientesAtivos: number;
  novosClientes: number;
  conversaoPedidos: number;
};

export type FinancialDashboardEstoque = {
  produtosEmEstoque: number;
  produtosSemEstoque: number;
  produtosEstoqueBaixo: number;
  valorTotalEstoque: number;
  comprasPendentes: number;
};

export type FinancialDashboardCharts = {
  receitasVsDespesas: Array<{ periodo: string; receitas: number; despesas: number }>;
  fluxoCaixaDiario: Array<{
    periodo: string;
    entradas: number;
    saidas: number;
    saldo: number;
  }>;
  fluxoCaixaMensal: Array<{
    periodo: string;
    entradas: number;
    saidas: number;
    saldo: number;
  }>;
  faturamentoMensal: Array<{ periodo: string; total: number; pedidos: number }>;
  vendasPorCategoria: Array<{
    categoriaId: string;
    categoriaNome: string;
    total: number;
  }>;
  comprasPorMes: Array<{ periodo: string; total: number; quantidade: number }>;
  produtosMaisVendidos: Array<{
    produtoId: string;
    produtoNome: string;
    quantidade: number;
    total: number;
  }>;
};

export type FinancialDashboardAlert = {
  tipo: string;
  severidade: "ALTA" | "MEDIA" | "BAIXA";
  titulo: string;
  descricao: string;
  quantidade: number;
  valor?: number;
  itens?: unknown[];
};

export type FinancialDashboardAlerts = {
  total: number;
  alertas: FinancialDashboardAlert[];
};

export type FinancialDashboardComparisons = {
  tipo: "DIA" | "SEMANA" | "MES" | "ANO";
  faturamento: DashboardComparison;
  lucroLiquido: DashboardComparison;
  totalRecebido: DashboardComparison;
  totalPago: DashboardComparison;
  pedidos: DashboardComparison;
  ticketMedio: DashboardComparison;
};

export type FinancialDashboardPeriod = {
  preset: DashboardPeriodPreset;
  dataInicio: string;
  dataFim: string;
};

export type FinancialDashboard = {
  periodo: FinancialDashboardPeriod;
  cards: FinancialDashboardCards;
  financeiro: FinancialDashboardFinanceiro;
  comercial: FinancialDashboardComercial;
  estoque: FinancialDashboardEstoque;
  charts: FinancialDashboardCharts;
  alerts: FinancialDashboardAlerts;
};

export type FinancialDashboardSummary = {
  periodo: FinancialDashboardPeriod;
  cards: FinancialDashboardCards;
  financeiro: FinancialDashboardFinanceiro;
  comercial: FinancialDashboardComercial;
  estoque: FinancialDashboardEstoque;
  comparacoes: FinancialDashboardComparisons;
};

export const DASHBOARD_PERIOD_OPTIONS: Array<{
  value: DashboardPeriodPreset;
  label: string;
}> = [
  { value: "HOJE", label: "Hoje" },
  { value: "ULTIMOS_7_DIAS", label: "Últimos 7 dias" },
  { value: "ULTIMOS_30_DIAS", label: "Últimos 30 dias" },
  { value: "ESTE_MES", label: "Este mês" },
  { value: "ESTE_ANO", label: "Este ano" },
  { value: "PERSONALIZADO", label: "Personalizado" },
];

export const DASHBOARD_COMPARISON_OPTIONS: Array<{
  value: "DIA" | "SEMANA" | "MES" | "ANO";
  label: string;
}> = [
  { value: "DIA", label: "Hoje × Ontem" },
  { value: "SEMANA", label: "Semana atual × anterior" },
  { value: "MES", label: "Mês atual × anterior" },
  { value: "ANO", label: "Ano atual × anterior" },
];
