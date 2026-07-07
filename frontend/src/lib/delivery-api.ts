import axios from "axios";
import type { DeliverySettings } from "@/types/delivery";
import type { NeighborhoodLookupResponse } from "@/types/neighborhood";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

export async function getDeliverySettings(): Promise<DeliverySettings> {
  const response = await api.get<DeliverySettings>("/delivery/settings");
  return response.data;
}

export async function lookupNeighborhood(params: {
  bairro: string;
  cidade: string;
  estado: string;
}): Promise<NeighborhoodLookupResponse> {
  const response = await api.get<NeighborhoodLookupResponse>("/delivery/neighborhoods/lookup", {
    params,
  });
  return response.data;
}
