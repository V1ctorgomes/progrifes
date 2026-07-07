import { Prisma } from "@prisma/client";

export function normalizeLocationText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function decimal(value: unknown) {
  return Number(value ?? 0);
}

export function mapNeighborhood(neighborhood: {
  id: string;
  name: string;
  city: string;
  state: string;
  deliveryFee: unknown;
  averageDeliveryTime: number;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: neighborhood.id,
    name: neighborhood.name,
    city: neighborhood.city,
    state: neighborhood.state,
    deliveryFee: decimal(neighborhood.deliveryFee),
    averageDeliveryTime: neighborhood.averageDeliveryTime,
    isActive: neighborhood.isActive,
    notes: neighborhood.notes,
    createdAt: neighborhood.createdAt,
    updatedAt: neighborhood.updatedAt,
  };
}

export type NeighborhoodWhere = Prisma.DeliveryNeighborhoodWhereInput;
