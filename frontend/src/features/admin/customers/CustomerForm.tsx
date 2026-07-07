"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import type { Customer, CustomerAddressInput, CustomerInput } from "@/types/customer";

const emptyAddress = (): CustomerAddressInput => ({
  cep: "",
  rua: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  principal: true,
});

interface CustomerFormProps {
  initial?: Customer | null;
  onSubmit: (data: CustomerInput) => void;
  loading?: boolean;
  error?: string;
}

export function CustomerForm({ initial, onSubmit, loading, error }: CustomerFormProps) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [telefone, setTelefone] = useState(initial?.telefone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [cpf, setCpf] = useState(initial?.cpf ?? "");
  const [dataNascimento, setDataNascimento] = useState(
    initial?.dataNascimento ? initial.dataNascimento.slice(0, 10) : "",
  );
  const [observacoes, setObservacoes] = useState(initial?.observacoes ?? "");
  const [ativo, setAtivo] = useState(initial?.ativo ?? true);
  const [enderecos, setEnderecos] = useState<CustomerAddressInput[]>(
    initial?.enderecos?.map((address) => ({
      id: address.id,
      cep: address.cep,
      rua: address.rua,
      numero: address.numero,
      complemento: address.complemento ?? undefined,
      bairro: address.bairro,
      cidade: address.cidade,
      estado: address.estado,
      referencia: address.referencia ?? undefined,
      principal: address.principal,
    })) ?? [emptyAddress()],
  );

  useEffect(() => {
    if (!initial) return;
    setNome(initial.nome);
    setTelefone(initial.telefone);
    setEmail(initial.email ?? "");
    setCpf(initial.cpf ?? "");
    setDataNascimento(initial.dataNascimento ? initial.dataNascimento.slice(0, 10) : "");
    setObservacoes(initial.observacoes ?? "");
    setAtivo(initial.ativo);
    setEnderecos(
      initial.enderecos.map((address) => ({
        id: address.id,
        cep: address.cep,
        rua: address.rua,
        numero: address.numero,
        complemento: address.complemento ?? undefined,
        bairro: address.bairro,
        cidade: address.cidade,
        estado: address.estado,
        referencia: address.referencia ?? undefined,
        principal: address.principal,
      })),
    );
  }, [initial]);

  const updateAddress = (index: number, field: keyof CustomerAddressInput, value: string | boolean) => {
    setEnderecos((current) =>
      current.map((address, i) => {
        if (i !== index) {
          if (field === "principal" && value === true) {
            return { ...address, principal: false };
          }
          return address;
        }
        return { ...address, [field]: value };
      }),
    );
  };

  const addAddress = () => {
    setEnderecos((current) => [...current, { ...emptyAddress(), principal: current.length === 0 }]);
  };

  const removeAddress = (index: number) => {
    setEnderecos((current) => {
      if (current.length <= 1) return current;
      const next = current.filter((_, i) => i !== index);
      if (!next.some((address) => address.principal) && next[0]) {
        next[0] = { ...next[0], principal: true };
      }
      return next;
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      nome,
      telefone,
      email: email || undefined,
      cpf: cpf || undefined,
      dataNascimento: dataNascimento || undefined,
      observacoes: observacoes || undefined,
      ativo,
      enderecos,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Nome *" value={nome} onChange={(e) => setNome(e.target.value)} required />
        <Input
          label="Telefone *"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          required
        />
        <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="CPF" value={cpf} onChange={(e) => setCpf(e.target.value)} />
        <Input
          label="Data de nascimento"
          type="date"
          value={dataNascimento}
          onChange={(e) => setDataNascimento(e.target.value)}
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-black">Status</label>
          <select
            className="w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
            value={ativo ? "active" : "inactive"}
            onChange={(e) => setAtivo(e.target.value === "active")}
          >
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-brand-black">Observações</label>
        <textarea
          className="min-h-24 w-full border border-neutral-300 bg-brand-white px-4 py-2.5 text-sm"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-black">Endereços</h3>
          <button
            type="button"
            onClick={addAddress}
            className="text-sm font-medium text-brand-black underline hover:no-underline"
          >
            Adicionar endereço
          </button>
        </div>

        {enderecos.map((address, index) => (
          <div key={address.id ?? index} className="space-y-3 border border-neutral-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Endereço {index + 1}</p>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="principal"
                    checked={Boolean(address.principal)}
                    onChange={() => updateAddress(index, "principal", true)}
                  />
                  Principal
                </label>
                {enderecos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAddress(index)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="CEP *"
                value={address.cep}
                onChange={(e) => updateAddress(index, "cep", e.target.value)}
                required
              />
              <Input
                label="Número *"
                value={address.numero}
                onChange={(e) => updateAddress(index, "numero", e.target.value)}
                required
              />
              <Input
                label="Rua *"
                value={address.rua}
                onChange={(e) => updateAddress(index, "rua", e.target.value)}
                required
              />
              <Input
                label="Bairro *"
                value={address.bairro}
                onChange={(e) => updateAddress(index, "bairro", e.target.value)}
                required
              />
              <Input
                label="Cidade *"
                value={address.cidade}
                onChange={(e) => updateAddress(index, "cidade", e.target.value)}
                required
              />
              <Input
                label="Estado *"
                value={address.estado}
                onChange={(e) => updateAddress(index, "estado", e.target.value)}
                required
              />
              <Input
                label="Complemento"
                value={address.complemento ?? ""}
                onChange={(e) => updateAddress(index, "complemento", e.target.value)}
              />
              <Input
                label="Referência"
                value={address.referencia ?? ""}
                onChange={(e) => updateAddress(index, "referencia", e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center border border-brand-black bg-brand-black px-6 py-2.5 text-sm font-medium uppercase tracking-wide text-brand-white disabled:opacity-50"
      >
        {loading ? "Salvando..." : initial ? "Salvar alterações" : "Criar cliente"}
      </button>
    </form>
  );
}
