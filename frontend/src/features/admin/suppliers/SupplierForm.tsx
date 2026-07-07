"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type {
  Supplier,
  SupplierAddressInput,
  SupplierContactInput,
  SupplierInput,
} from "@/types/supplier";

const emptyAddress = (): SupplierAddressInput => ({
  cep: "",
  rua: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
});

const emptyContact = (): SupplierContactInput => ({
  nome: "",
  cargo: "",
  telefone: "",
  whatsapp: "",
  email: "",
});

interface SupplierFormProps {
  initial?: Supplier | null;
  onSubmit: (data: SupplierInput) => void;
  loading?: boolean;
  error?: string;
}

export function SupplierForm({ initial, onSubmit, loading, error }: SupplierFormProps) {
  const [razaoSocial, setRazaoSocial] = useState(initial?.razaoSocial ?? "");
  const [nomeFantasia, setNomeFantasia] = useState(initial?.nomeFantasia ?? "");
  const [cnpj, setCnpj] = useState(initial?.cnpj ?? "");
  const [inscricaoEstadual, setInscricaoEstadual] = useState(initial?.inscricaoEstadual ?? "");
  const [telefone, setTelefone] = useState(initial?.telefone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [website, setWebsite] = useState(initial?.website ?? "");
  const [contatoPrincipal, setContatoPrincipal] = useState(initial?.contatoPrincipal ?? "");
  const [observacoes, setObservacoes] = useState(initial?.observacoes ?? "");
  const [ativo, setAtivo] = useState(initial?.ativo ?? true);
  const [endereco, setEndereco] = useState<SupplierAddressInput>(
    initial?.endereco
      ? {
          id: initial.endereco.id,
          cep: initial.endereco.cep,
          rua: initial.endereco.rua,
          numero: initial.endereco.numero,
          complemento: initial.endereco.complemento ?? undefined,
          bairro: initial.endereco.bairro,
          cidade: initial.endereco.cidade,
          estado: initial.endereco.estado,
        }
      : emptyAddress(),
  );
  const [contatos, setContatos] = useState<SupplierContactInput[]>(
    initial?.contatos?.map((contact) => ({
      id: contact.id,
      nome: contact.nome,
      cargo: contact.cargo ?? undefined,
      telefone: contact.telefone ?? undefined,
      whatsapp: contact.whatsapp ?? undefined,
      email: contact.email ?? undefined,
    })) ?? [],
  );

  useEffect(() => {
    if (!initial) return;
    setRazaoSocial(initial.razaoSocial);
    setNomeFantasia(initial.nomeFantasia);
    setCnpj(initial.cnpj);
    setInscricaoEstadual(initial.inscricaoEstadual ?? "");
    setTelefone(initial.telefone);
    setEmail(initial.email ?? "");
    setWebsite(initial.website ?? "");
    setContatoPrincipal(initial.contatoPrincipal ?? "");
    setObservacoes(initial.observacoes ?? "");
    setAtivo(initial.ativo);
    setEndereco(
      initial.endereco
        ? {
            id: initial.endereco.id,
            cep: initial.endereco.cep,
            rua: initial.endereco.rua,
            numero: initial.endereco.numero,
            complemento: initial.endereco.complemento ?? undefined,
            bairro: initial.endereco.bairro,
            cidade: initial.endereco.cidade,
            estado: initial.endereco.estado,
          }
        : emptyAddress(),
    );
    setContatos(
      initial.contatos.map((contact) => ({
        id: contact.id,
        nome: contact.nome,
        cargo: contact.cargo ?? undefined,
        telefone: contact.telefone ?? undefined,
        whatsapp: contact.whatsapp ?? undefined,
        email: contact.email ?? undefined,
      })),
    );
  }, [initial]);

  const updateAddress = (field: keyof SupplierAddressInput, value: string) => {
    setEndereco((current) => ({ ...current, [field]: value }));
  };

  const updateContact = (index: number, field: keyof SupplierContactInput, value: string) => {
    setContatos((current) =>
      current.map((contact, i) => (i === index ? { ...contact, [field]: value } : contact)),
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      razaoSocial,
      nomeFantasia,
      cnpj,
      telefone,
      inscricaoEstadual: inscricaoEstadual || undefined,
      email: email || undefined,
      website: website || undefined,
      contatoPrincipal: contatoPrincipal || undefined,
      observacoes: observacoes || undefined,
      ativo,
      endereco: endereco.cep ? endereco : undefined,
      contatos: contatos.filter((contact) => contact.nome.trim()),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Razão social *"
          value={razaoSocial}
          onChange={(e) => setRazaoSocial(e.target.value)}
          required
        />
        <Input
          label="Nome fantasia *"
          value={nomeFantasia}
          onChange={(e) => setNomeFantasia(e.target.value)}
          required
        />
        <Input
          label="CNPJ *"
          value={cnpj}
          onChange={(e) => setCnpj(e.target.value)}
          placeholder="00.000.000/0000-00"
          required
        />
        <Input
          label="Inscrição estadual"
          value={inscricaoEstadual}
          onChange={(e) => setInscricaoEstadual(e.target.value)}
        />
        <Input
          label="Telefone *"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          required
        />
        <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
        <Input
          label="Contato principal"
          value={contatoPrincipal}
          onChange={(e) => setContatoPrincipal(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-brand-black">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
            className="h-4 w-4"
          />
          Fornecedor ativo
        </label>
      </div>

      <div className="space-y-3 border border-neutral-200 p-4">
        <p className="font-medium text-brand-black">Endereço</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="CEP" value={endereco.cep} onChange={(e) => updateAddress("cep", e.target.value)} />
          <Input label="Rua" value={endereco.rua} onChange={(e) => updateAddress("rua", e.target.value)} />
          <Input
            label="Número"
            value={endereco.numero}
            onChange={(e) => updateAddress("numero", e.target.value)}
          />
          <Input
            label="Complemento"
            value={endereco.complemento ?? ""}
            onChange={(e) => updateAddress("complemento", e.target.value)}
          />
          <Input
            label="Bairro"
            value={endereco.bairro}
            onChange={(e) => updateAddress("bairro", e.target.value)}
          />
          <Input
            label="Cidade"
            value={endereco.cidade}
            onChange={(e) => updateAddress("cidade", e.target.value)}
          />
          <Input
            label="Estado"
            value={endereco.estado}
            onChange={(e) => updateAddress("estado", e.target.value)}
            placeholder="UF"
            maxLength={2}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-medium text-brand-black">Contatos comerciais</p>
          <Button type="button" variant="secondary" onClick={() => setContatos((c) => [...c, emptyContact()])}>
            Adicionar contato
          </Button>
        </div>
        {contatos.length === 0 ? (
          <p className="text-sm text-brand-gray">Nenhum contato cadastrado.</p>
        ) : (
          contatos.map((contact, index) => (
            <div key={contact.id ?? index} className="grid gap-3 border border-neutral-200 p-4 sm:grid-cols-2">
              <Input
                label="Nome"
                value={contact.nome}
                onChange={(e) => updateContact(index, "nome", e.target.value)}
              />
              <Input
                label="Cargo"
                value={contact.cargo ?? ""}
                onChange={(e) => updateContact(index, "cargo", e.target.value)}
              />
              <Input
                label="Telefone"
                value={contact.telefone ?? ""}
                onChange={(e) => updateContact(index, "telefone", e.target.value)}
              />
              <Input
                label="WhatsApp"
                value={contact.whatsapp ?? ""}
                onChange={(e) => updateContact(index, "whatsapp", e.target.value)}
              />
              <Input
                label="E-mail"
                type="email"
                value={contact.email ?? ""}
                onChange={(e) => updateContact(index, "email", e.target.value)}
              />
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setContatos((current) => current.filter((_, i) => i !== index))}
                >
                  Remover
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Input
        label="Observações"
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
        placeholder="Informações adicionais sobre o fornecedor"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : initial ? "Salvar alterações" : "Cadastrar fornecedor"}
      </Button>
    </form>
  );
}
