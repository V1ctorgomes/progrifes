export type DeliveryNeighborhood = {
  id: string;
  name: string;
  city: string;
  state: string;
  deliveryFee: number;
  averageDeliveryTime: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NeighborhoodsListResponse = {
  data: DeliveryNeighborhood[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type NeighborhoodLookupResponse =
  | { found: true; neighborhood: DeliveryNeighborhood }
  | { found: false; message: string };

export type CreateNeighborhoodInput = {
  name: string;
  city: string;
  state: string;
  deliveryFee: number;
  averageDeliveryTime: number;
  isActive?: boolean;
  notes?: string;
};

export type UpdateNeighborhoodInput = Partial<CreateNeighborhoodInput>;

export const NEIGHBORHOOD_TIME_PRESETS = [30, 45, 60, 90, 120] as const;

export const NEIGHBORHOOD_SORT_OPTIONS = [
  { value: "name", label: "Nome" },
  { value: "fee", label: "Taxa" },
  { value: "time", label: "Prazo" },
  { value: "city", label: "Cidade" },
  { value: "status", label: "Status" },
  { value: "recent", label: "Mais recentes" },
] as const;
