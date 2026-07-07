export type DeliveryPersonStatus =
  | "DISPONIVEL"
  | "EM_ENTREGA"
  | "AUSENTE"
  | "FOLGA"
  | "INATIVO";

export type DeliveryPersonStats = {
  totalDeliveries: number;
  deliveredOrders: number;
  cancelledOrders: number;
  lastDeliveryAt: string | null;
};

export type DeliveryPerson = {
  id: string;
  name: string;
  phone: string;
  cpf: string | null;
  document: string | null;
  status: DeliveryPersonStatus;
  statusLabel: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  stats?: DeliveryPersonStats;
};

export type DeliveryPersonHistoryEntry = {
  id: string;
  operacao: string;
  descricao: string;
  usuario: { id: string; nome: string; email: string } | null;
  createdAt: string;
};

export type DeliveryPersonDetail = DeliveryPerson & {
  stats: DeliveryPersonStats;
  history: DeliveryPersonHistoryEntry[];
};

export type DeliveryPersonsListResponse = {
  data: DeliveryPerson[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type DeliveryPersonDashboard = {
  entregadoresAtivos: number;
  entregadoresDisponiveis: number;
  entregadoresEmRota: number;
  totalEntregas: number;
  entregadorComMaisEntregas: {
    id: string;
    name: string;
    total: number;
  } | null;
};

export type CreateDeliveryPersonInput = {
  name: string;
  phone: string;
  cpf?: string;
  document?: string;
  status?: DeliveryPersonStatus;
  notes?: string;
};

export type UpdateDeliveryPersonInput = Partial<CreateDeliveryPersonInput>;

export const DELIVERY_PERSON_STATUS_OPTIONS: Array<{
  value: DeliveryPersonStatus;
  label: string;
}> = [
  { value: "DISPONIVEL", label: "Disponível" },
  { value: "EM_ENTREGA", label: "Em Entrega" },
  { value: "AUSENTE", label: "Ausente" },
  { value: "FOLGA", label: "Folga" },
  { value: "INATIVO", label: "Inativo" },
];

export const DELIVERY_PERSON_STATUS_COLORS: Record<DeliveryPersonStatus, string> = {
  DISPONIVEL: "text-emerald-700",
  EM_ENTREGA: "text-blue-700",
  AUSENTE: "text-amber-700",
  FOLGA: "text-brand-gray",
  INATIVO: "text-red-700",
};
