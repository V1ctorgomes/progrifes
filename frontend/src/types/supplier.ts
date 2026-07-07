export interface SupplierAddress {
  id: string;
  cep: string;
  rua: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierContact {
  id: string;
  nome: string;
  cargo?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierListItem {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  telefone: string;
  email?: string | null;
  ativo: boolean;
  cidade?: string | null;
  estado?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier extends SupplierListItem {
  inscricaoEstadual?: string | null;
  website?: string | null;
  contatoPrincipal?: string | null;
  observacoes?: string | null;
  endereco?: SupplierAddress | null;
  contatos: SupplierContact[];
}

export interface SuppliersListResponse {
  data: SupplierListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SupplierAddressInput {
  id?: string;
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface SupplierContactInput {
  id?: string;
  nome: string;
  cargo?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
}

export interface SupplierInput {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  telefone: string;
  inscricaoEstadual?: string;
  email?: string;
  website?: string;
  contatoPrincipal?: string;
  observacoes?: string;
  ativo?: boolean;
  endereco?: SupplierAddressInput;
  contatos?: SupplierContactInput[];
}

export function normalizeCnpj(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCnpj(value?: string | null): string {
  if (!value) return "—";
  const digits = normalizeCnpj(value);
  if (digits.length !== 14) return value;
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export function formatPhone(value?: string | null): string {
  if (!value) return "—";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  }
  if (digits.length === 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  }
  return value;
}

export function formatAddress(
  address: Pick<
    SupplierAddress,
    "cep" | "rua" | "numero" | "complemento" | "bairro" | "cidade" | "estado"
  >,
): string {
  const parts = [
    `${address.rua}, ${address.numero}`,
    address.complemento,
    address.bairro,
    `${address.cidade}/${address.estado}`,
    `CEP ${address.cep}`,
  ].filter(Boolean);
  return parts.join(" — ");
}
