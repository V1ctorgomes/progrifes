export type AdminDashboardPeriodPreset =
  | "HOJE"
  | "ONTEM"
  | "ULTIMOS_7_DIAS"
  | "ULTIMOS_30_DIAS"
  | "ESTE_MES"
  | "MES_ANTERIOR"
  | "PERSONALIZADO";

export type DashboardComparison = {
  valorAtual: number;
  valorAnterior: number;
  variacaoPercentual: number;
  tendencia: "ALTA" | "BAIXA" | "ESTAVEL";
};

export type DashboardCard = {
  id: string;
  titulo: string;
  valor: number;
  formato: "number" | "currency";
  href: string;
  comparacao: DashboardComparison | null;
};

export type DashboardCharts = {
  faturamento: Array<{ periodo: string; valor: number }>;
  pedidos: Array<{ periodo: string; quantidade: number }>;
  formasPagamento: Array<{
    metodo: string;
    label: string;
    quantidade: number;
    valor: number;
  }>;
  statusPedidos: Array<{ key: string; label: string; quantidade: number }>;
};

export type DashboardRecentOrder = {
  id: string;
  numero: number;
  numeroFormatado: string;
  clienteNome: string;
  total: number;
  status: string;
  statusLabel: string;
  createdAt: string;
  href: string;
};

export type DashboardStockItem = {
  id: string;
  produtoNome: string;
  sku: string;
  quantidadeDisponivel: number;
  href: string;
};

export type DashboardStockMovement = {
  id: string;
  tipo: string;
  produtoNome: string;
  sku: string;
  quantidade: number;
  createdAt: string;
  href: string;
};

export type DashboardStock = {
  semEstoque: DashboardStockItem[];
  estoqueBaixo: DashboardStockItem[];
  movimentacoes: DashboardStockMovement[];
  totais?: {
    semEstoque: number;
    estoqueBaixo: number;
  };
};

export type DashboardMoneyCount = {
  quantidade: number;
  valor: number;
};

export type DashboardFinancial = {
  receitasPeriodo: number;
  despesasPeriodo: number;
  saldo: number;
  contasVencidas: {
    receber: DashboardMoneyCount;
    pagar: DashboardMoneyCount;
  };
  contasAVencer: {
    receber: DashboardMoneyCount;
    pagar: DashboardMoneyCount;
  };
};

export type DashboardDeliveries = {
  emPreparacao: number;
  prontas: number;
  saiuParaEntrega: number;
  concluidas: number;
  canceladas: number;
};

export type DashboardCustomers = {
  novosClientes: number;
  clientesAtivos: number;
  semComprasRecentes: number;
};

export type DashboardActivity = {
  id: string;
  tipo: string;
  descricao: string;
  usuarioNome: string | null;
  createdAt: string;
};

export type DashboardShortcut = {
  id: string;
  label: string;
  href: string;
  permission: string;
};

export type AdminDashboard = {
  periodo: {
    preset: AdminDashboardPeriodPreset;
    dataInicio: string;
    dataFim: string;
  };
  cards: DashboardCard[];
  charts: DashboardCharts | null;
  recentOrders: DashboardRecentOrder[];
  stock: DashboardStock | null;
  financial: DashboardFinancial | null;
  deliveries: DashboardDeliveries | null;
  customers: DashboardCustomers | null;
  activities: DashboardActivity[];
  shortcuts: DashboardShortcut[];
};

export const ADMIN_DASHBOARD_PERIOD_OPTIONS: Array<{
  value: AdminDashboardPeriodPreset;
  label: string;
}> = [
  { value: "HOJE", label: "Hoje" },
  { value: "ONTEM", label: "Ontem" },
  { value: "ULTIMOS_7_DIAS", label: "Últimos 7 dias" },
  { value: "ULTIMOS_30_DIAS", label: "Últimos 30 dias" },
  { value: "ESTE_MES", label: "Este mês" },
  { value: "MES_ANTERIOR", label: "Mês anterior" },
  { value: "PERSONALIZADO", label: "Personalizado" },
];
