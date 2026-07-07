export type DashboardPeriodPreset =
  | "HOJE"
  | "ULTIMOS_7_DIAS"
  | "ULTIMOS_30_DIAS"
  | "ESTE_MES"
  | "ESTE_ANO"
  | "PERSONALIZADO";

export type DateRange = {
  start: Date;
  end: Date;
  preset: DashboardPeriodPreset;
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

export function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1);
}

export function endOfYear(date: Date) {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

export function subtractDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() - days);
  return value;
}

export function resolveDateRange(input: {
  preset?: DashboardPeriodPreset;
  dataInicio?: string;
  dataFim?: string;
}): DateRange {
  const now = new Date();
  const preset = input.preset ?? "ESTE_MES";

  if (preset === "PERSONALIZADO" && input.dataInicio && input.dataFim) {
    return {
      preset,
      start: startOfDay(new Date(input.dataInicio)),
      end: endOfDay(new Date(input.dataFim)),
    };
  }

  switch (preset) {
    case "HOJE":
      return { preset, start: startOfDay(now), end: endOfDay(now) };
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
    case "ESTE_ANO":
      return { preset, start: startOfYear(now), end: endOfYear(now) };
    case "ESTE_MES":
    default:
      return { preset: "ESTE_MES", start: startOfMonth(now), end: endOfMonth(now) };
  }
}

export function previousRange(range: DateRange): DateRange {
  const duration = range.end.getTime() - range.start.getTime();
  const end = new Date(range.start.getTime() - 1);
  const start = new Date(end.getTime() - duration);
  return { preset: range.preset, start, end };
}

export function previousDayRange(): { current: DateRange; previous: DateRange } {
  const today = new Date();
  const current = { preset: "HOJE" as const, start: startOfDay(today), end: endOfDay(today) };
  const yesterday = subtractDays(today, 1);
  const previous = {
    preset: "HOJE" as const,
    start: startOfDay(yesterday),
    end: endOfDay(yesterday),
  };
  return { current, previous };
}

export function previousWeekRanges(): { current: DateRange; previous: DateRange } {
  const now = new Date();
  const current = {
    preset: "ULTIMOS_7_DIAS" as const,
    start: startOfDay(subtractDays(now, 6)),
    end: endOfDay(now),
  };
  const previous = {
    preset: "ULTIMOS_7_DIAS" as const,
    start: startOfDay(subtractDays(now, 13)),
    end: endOfDay(subtractDays(now, 7)),
  };
  return { current, previous };
}

export function previousMonthRanges(): { current: DateRange; previous: DateRange } {
  const now = new Date();
  const current = {
    preset: "ESTE_MES" as const,
    start: startOfMonth(now),
    end: endOfMonth(now),
  };
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previous = {
    preset: "ESTE_MES" as const,
    start: startOfMonth(prevMonth),
    end: endOfMonth(prevMonth),
  };
  return { current, previous };
}

export function previousYearRanges(): { current: DateRange; previous: DateRange } {
  const now = new Date();
  const current = {
    preset: "ESTE_ANO" as const,
    start: startOfYear(now),
    end: endOfYear(now),
  };
  const prevYear = new Date(now.getFullYear() - 1, 0, 1);
  const previous = {
    preset: "ESTE_ANO" as const,
    start: startOfYear(prevYear),
    end: endOfYear(prevYear),
  };
  return { current, previous };
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
      variacaoPercentual > 0 ? "ALTA" : variacaoPercentual < 0 ? "BAIXA" : "ESTAVEL",
  };
}

export const REVENUE_ORDER_STATUSES = [
  "CONFIRMADO",
  "SEPARANDO",
  "PRONTO_PARA_ENTREGA",
  "SAIU_PARA_ENTREGA",
  "ENTREGUE",
] as const;
