import axios, { isAxiosError } from "axios";
import type { CreateOrderInput, CreateOrderResponse } from "@/types/order";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

export function getOrderErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message[0];
    if (typeof message === "string") return message;
  }
  return "Não foi possível finalizar o pedido";
}

export async function createOrder(data: CreateOrderInput): Promise<CreateOrderResponse> {
  const response = await api.post<CreateOrderResponse>("/orders", data);
  return response.data;
}
