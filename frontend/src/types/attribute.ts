export interface AttributeValue {
  id: string;
  valor: string;
}

export interface Attribute {
  id: string;
  nome: string;
  tipo: string;
  valores: AttributeValue[];
  createdAt: string;
  updatedAt: string;
}

export interface AttributeInput {
  nome: string;
  tipo?: string;
  valores?: Array<{ valor: string }>;
}
