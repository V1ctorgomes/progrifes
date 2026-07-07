import { DeliveryPersonStatus } from "@prisma/client";

export const DELIVERY_PERSON_STATUS_LABELS: Record<DeliveryPersonStatus, string> = {
  DISPONIVEL: "Disponível",
  EM_ENTREGA: "Em Entrega",
  AUSENTE: "Ausente",
  FOLGA: "Folga",
  INATIVO: "Inativo",
};

export function normalizeCpf(cpf?: string | null) {
  if (!cpf) return null;
  const digits = cpf.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export function mapDeliveryPerson(person: {
  id: string;
  name: string;
  phone: string;
  cpf: string | null;
  document: string | null;
  status: DeliveryPersonStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: person.id,
    name: person.name,
    phone: person.phone,
    cpf: person.cpf,
    document: person.document,
    status: person.status,
    statusLabel: DELIVERY_PERSON_STATUS_LABELS[person.status],
    notes: person.notes,
    createdAt: person.createdAt,
    updatedAt: person.updatedAt,
  };
}
