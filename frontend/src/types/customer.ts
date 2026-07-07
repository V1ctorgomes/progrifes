export interface CustomerAddress {
  id: string;
  cep: string;
  rua: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  referencia?: string | null;
  principal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerListItem {
  id: string;
  nome: string;
  telefone: string;
  email?: string | null;
  cpf?: string | null;
  ativo: boolean;
  cidade?: string | null;
  bairro?: string | null;
  pedidosCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Customer extends CustomerListItem {
  dataNascimento?: string | null;
  observacoes?: string | null;
  enderecos: CustomerAddress[];
}

export interface CustomersListResponse {
  data: CustomerListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerAddressInput {
  id?: string;
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  referencia?: string;
  principal?: boolean;
}

export interface CustomerInput {
  nome: string;
  telefone: string;
  email?: string;
  cpf?: string;
  dataNascimento?: string;
  observacoes?: string;
  ativo?: boolean;
  enderecos?: CustomerAddressInput[];
}

export interface CustomerTag {
  id: string;
  nome: string;
  cor: string;
  aplicadaEm?: string;
}

export interface CustomerCrm {
  origem?: string | null;
  canalAtendimento?: string | null;
  responsavelId?: string | null;
  responsavel?: { id: string; nome: string; email: string } | null;
  observacoesComerciais?: string | null;
  tags: CustomerTag[];
}

export interface CustomerNote {
  id: string;
  descricao: string;
  usuario?: { id: string; nome: string; email: string } | null;
  createdAt: string;
}

export interface CustomerOrderHistoryItem {
  id: string;
  numero: number;
  numeroFormatado: string;
  status: string;
  statusLabel: string;
  statusCor: string;
  formaPagamento: string;
  total: number;
  itemCount: number;
  createdAt: string;
}

export interface CustomerOrdersResponse {
  data: CustomerOrderHistoryItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export type PurchaseFrequency = "NOVO_CLIENTE" | "RECORRENTE" | "ESPORADICO" | "INATIVO";

export interface CustomerStatistics {
  clienteDesde: string;
  ultimaCompra?: string | null;
  quantidadePedidos: number;
  totalGasto: number;
  ticketMedio: number;
  maiorCompra: number;
  menorCompra: number;
  pedidoEmAberto?: {
    id: string;
    numero: number;
    numeroFormatado: string;
    status: string;
    statusLabel: string;
  } | null;
  frequenciaCompra: PurchaseFrequency;
  statusCliente: string;
  produtosMaisComprados: Array<{ nome: string; quantidade: number }>;
}

export interface CustomerTimelineEntry {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  createdAt: string;
  usuario?: { id: string; nome: string } | null;
}

export const FREQUENCY_LABELS: Record<PurchaseFrequency, string> = {
  NOVO_CLIENTE: "Novo Cliente",
  RECORRENTE: "Recorrente",
  ESPORADICO: "Esporádico",
  INATIVO: "Inativo",
};

export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function formatCpf(cpf?: string | null) {
  if (!cpf) return "—";
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}
