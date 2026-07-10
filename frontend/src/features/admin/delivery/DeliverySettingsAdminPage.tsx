"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { deliveryAdminApi, getErrorMessage } from "@/lib/admin-api";
import { formatCurrency } from "@/utils/cn";
import {
  DELIVERY_TIME_PRESETS,
  type DeliveryBusinessHour,
  type UpdateDeliverySettingsInput,
  WEEKDAY_OPTIONS,
} from "@/types/delivery";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-black">
      {children}
    </h2>
  );
}

export function DeliverySettingsAdminPage() {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [enabled, setEnabled] = useState(true);
  const [minimumOrderValue, setMinimumOrderValue] = useState(0);
  const [averageDeliveryTime, setAverageDeliveryTime] = useState(45);
  const [message, setMessage] = useState("");
  const [closedMessage, setClosedMessage] = useState("");
  const [businessHours, setBusinessHours] = useState<DeliveryBusinessHour[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "delivery", "settings"],
    queryFn: deliveryAdminApi.getSettings,
  });

  useEffect(() => {
    if (!data) return;
    setEnabled(data.enabled);
    setMinimumOrderValue(data.minimumOrderValue);
    setAverageDeliveryTime(data.averageDeliveryTime);
    setMessage(data.message);
    setClosedMessage(data.closedMessage);
    setBusinessHours(data.businessHours);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload: UpdateDeliverySettingsInput) =>
      deliveryAdminApi.updateSettings(payload),
    onSuccess: (result) => {
      queryClient.setQueryData(["admin", "delivery", "settings"], result);
      setFormError(null);
      setSuccess("Configurações salvas com sucesso.");
    },
    onError: (error) => {
      setSuccess(null);
      setFormError(getErrorMessage(error));
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => deliveryAdminApi.updateSettings({ restoreDefaults: true }),
    onSuccess: (result) => {
      queryClient.setQueryData(["admin", "delivery", "settings"], result);
      setFormError(null);
      setSuccess("Configurações restauradas para o padrão.");
    },
    onError: (error) => {
      setSuccess(null);
      setFormError(getErrorMessage(error));
    },
  });

  const updateHour = (
    weekday: DeliveryBusinessHour["weekday"],
    field: "isOpen" | "startTime" | "endTime",
    value: boolean | string,
  ) => {
    setBusinessHours((current) =>
      current.map((hour) =>
        hour.weekday === weekday ? { ...hour, [field]: value } : hour,
      ),
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSuccess(null);
    saveMutation.mutate({
      enabled,
      minimumOrderValue,
      averageDeliveryTime,
      message: message.trim(),
      closedMessage: closedMessage.trim(),
      businessHours: businessHours.map((hour) => ({
        weekday: hour.weekday,
        isOpen: hour.isOpen,
        startTime: hour.startTime,
        endTime: hour.endTime,
      })),
    });
  };

  if (isLoading) {
    return <p className="text-brand-gray">Carregando configurações de entrega...</p>;
  }

  if (!data) {
    return <p className="text-brand-gray">Não foi possível carregar as configurações.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-brand-black">
          Entrega Própria
        </h1>
        <p className="text-brand-gray">
          Configure horários, prazo médio, pedido mínimo e mensagens exibidas no site.
        </p>
        <Link href="/admin/entregas?tab=bairros" className="inline-block text-sm underline">
          Gerenciar bairros e taxas →
        </Link>
        <p className="text-xs text-brand-gray">
          Status atual:{" "}
          <span className="font-medium text-brand-black">
            {data.availability.canAcceptOrders
              ? "Aceitando pedidos"
              : data.enabled
                ? "Fora do horário"
                : "Entregas desativadas"}
          </span>
          {data.availability.todayHours
            ? ` · Hoje: ${data.availability.todayHours.isOpen ? `${data.availability.todayHours.startTime}–${data.availability.todayHours.endTime}` : "Fechado"}`
            : null}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="space-y-4 border border-neutral-200 bg-brand-white p-4">
          <SectionTitle>Configurações gerais</SectionTitle>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
            />
            Entrega própria ativa
          </label>
          <p className="text-xs text-brand-gray">
            Quando desativada, o checkout não permitirá finalizar pedidos com entrega.
          </p>
        </section>

        <section className="space-y-4 border border-neutral-200 bg-brand-white p-4">
          <SectionTitle>Prazo médio de entrega</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {DELIVERY_TIME_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAverageDeliveryTime(preset)}
                className={`border px-3 py-2 text-sm ${
                  averageDeliveryTime === preset
                    ? "border-brand-black bg-brand-black text-brand-white"
                    : "border-neutral-300"
                }`}
              >
                {preset} min
              </button>
            ))}
          </div>
          <Input
            label="Tempo médio (minutos)"
            type="number"
            min={1}
            max={1440}
            value={averageDeliveryTime}
            onChange={(event) => setAverageDeliveryTime(Number(event.target.value))}
          />
        </section>

        <section className="space-y-4 border border-neutral-200 bg-brand-white p-4">
          <SectionTitle>Pedido mínimo para entrega</SectionTitle>
          <Input
            label="Valor mínimo (R$)"
            type="number"
            min={0}
            step="0.01"
            value={minimumOrderValue}
            onChange={(event) => setMinimumOrderValue(Number(event.target.value))}
          />
          <p className="text-xs text-brand-gray">
            Pedidos abaixo de {formatCurrency(minimumOrderValue)} não poderão ser finalizados.
          </p>
        </section>

        <section className="space-y-4 border border-neutral-200 bg-brand-white p-4">
          <SectionTitle>Mensagens do site</SectionTitle>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-brand-gray">
              Mensagem informativa
            </label>
            <textarea
              className="min-h-[120px] w-full border border-neutral-300 px-4 py-2.5 text-sm"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-brand-gray">
              Mensagem fora do horário
            </label>
            <textarea
              className="min-h-[80px] w-full border border-neutral-300 px-4 py-2.5 text-sm"
              value={closedMessage}
              onChange={(event) => setClosedMessage(event.target.value)}
            />
          </div>
        </section>

        <section className="space-y-4 border border-neutral-200 bg-brand-white p-4">
          <SectionTitle>Horário de funcionamento</SectionTitle>
          <div className="space-y-4">
            {WEEKDAY_OPTIONS.map((option) => {
              const hour =
                businessHours.find((item) => item.weekday === option.value) ?? null;
              if (!hour) return null;

              return (
                <div
                  key={option.value}
                  className="grid gap-3 border-b border-neutral-100 pb-4 last:border-b-0 md:grid-cols-[180px_1fr_1fr_1fr]"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={hour.isOpen}
                      onChange={(event) =>
                        updateHour(option.value, "isOpen", event.target.checked)
                      }
                    />
                    <span className="text-sm font-medium text-brand-black">{option.label}</span>
                  </div>
                  <Input
                    label="Início"
                    type="time"
                    value={hour.startTime}
                    disabled={!hour.isOpen}
                    onChange={(event) =>
                      updateHour(option.value, "startTime", event.target.value)
                    }
                  />
                  <Input
                    label="Fim"
                    type="time"
                    value={hour.endTime}
                    disabled={!hour.isOpen}
                    onChange={(event) =>
                      updateHour(option.value, "endTime", event.target.value)
                    }
                  />
                  <p className="self-end text-xs text-brand-gray">
                    {hour.isOpen ? "Dia ativo" : "Dia inativo"}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Salvando..." : "Salvar configurações"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={restoreMutation.isPending}
            onClick={() => restoreMutation.mutate()}
          >
            {restoreMutation.isPending ? "Restaurando..." : "Restaurar padrões"}
          </Button>
        </div>
      </form>
    </div>
  );
}
