export type AdminDashboardPeriodPreset =
  | "HOJE"
  | "ONTEM"
  | "ULTIMOS_7_DIAS"
  | "ULTIMOS_30_DIAS"
  | "ESTE_MES"
  | "MES_ANTERIOR"
  | "PERSONALIZADO";

export type DateRange = {
  start: Date;
  end: Date;
  preset: AdminDashboardPeriodPreset;
};

export function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function endOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function subtractDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() - days);
  return value;
}

export function resolveDashboardDateRange(input: {
  preset?: AdminDashboardPeriodPreset;
  dataInicio?: string;
  dataFim?: string;
}): DateRange {
  const now = new Date();
  const preset = input.preset ?? "HOJE";

  if (preset === "PERSONALIZADO" && input.dataInicio && input.dataFim) {
    return {
      preset,
      start: startOfDay(new Date(input.dataInicio)),
      end: endOfDay(new Date(input.dataFim)),
    };
  }

  switch (preset) {
    case "ONTEM": {
      const yesterday = subtractDays(now, 1);
      return { preset, start: startOfDay(yesterday), end: endOfDay(yesterday) };
    }
    case "ULTIMOS_7_DIAS":
      return {
        preset,
        start: startOfDay(subtractDays(now, 6)),
        end: endOfDay(now),
      };
    case "ULTIMOS_30_DIAS":
      return {
        preset,
        start: startOfDay(subtractDays(now, 29)),
        end: endOfDay(now),
      };
    case "ESTE_MES":
      return { preset, start: startOfMonth(now), end: endOfMonth(now) };
    case "MES_ANTERIOR": {
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return {
        preset,
        start: startOfMonth(prevMonth),
        end: endOfMonth(prevMonth),
      };
    }
    case "HOJE":
    default:
      return { preset: "HOJE", start: startOfDay(now), end: endOfDay(now) };
  }
}

export function previousDashboardRange(range: DateRange): DateRange {
  const duration = range.end.getTime() - range.start.getTime();
  const end = new Date(range.start.getTime() - 1);
  const start = new Date(end.getTime() - duration);
  return { preset: range.preset, start, end };
}

export function decimal(value: unknown) {
  return Number(value ?? 0);
}

export function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

export function comparisonResult(current: number, previous: number) {
  const variacaoPercentual = Math.round(percentChange(current, previous) * 100) / 100;
  return {
    valorAtual: current,
    valorAnterior: previous,
    variacaoPercentual,
    tendencia:
      variacaoPercentual > 0 ? ("ALTA" as const) : variacaoPercentual < 0 ? ("BAIXA" as const) : ("ESTAVEL" as const),
  };
}

export const REVENUE_ORDER_STATUSES = [
  "CONFIRMADO",
  "SEPARANDO",
  "PRONTO_PARA_ENTREGA",
  "SAIU_PARA_ENTREGA",
  "ENTREGUE",
] as const;

export function eachDayKeys(range: DateRange) {
  const keys: string[] = [];
  const cursor = startOfDay(range.start);
  const end = startOfDay(range.end);
  while (cursor <= end) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}
