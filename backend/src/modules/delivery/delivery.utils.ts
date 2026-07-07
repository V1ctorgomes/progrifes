import { Weekday } from "@prisma/client";

export const WEEKDAY_ORDER: Weekday[] = [
  Weekday.SEGUNDA_FEIRA,
  Weekday.TERCA_FEIRA,
  Weekday.QUARTA_FEIRA,
  Weekday.QUINTA_FEIRA,
  Weekday.SEXTA_FEIRA,
  Weekday.SABADO,
  Weekday.DOMINGO,
];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  [Weekday.DOMINGO]: "Domingo",
  [Weekday.SEGUNDA_FEIRA]: "Segunda-feira",
  [Weekday.TERCA_FEIRA]: "Terça-feira",
  [Weekday.QUARTA_FEIRA]: "Quarta-feira",
  [Weekday.QUINTA_FEIRA]: "Quinta-feira",
  [Weekday.SEXTA_FEIRA]: "Sexta-feira",
  [Weekday.SABADO]: "Sábado",
};

export const DEFAULT_DELIVERY_MESSAGE =
  "Entrega realizada pela própria loja.\n\nPrazo médio: 45 minutos.\n\nConsulte bairros atendidos.";

export const DEFAULT_CLOSED_MESSAGE =
  "No momento estamos fora do horário de entrega.";

export const DEFAULT_AVERAGE_DELIVERY_TIME = 45;

export const DELIVERY_TIME_PRESETS = [30, 45, 60, 90, 120];

export const DEFAULT_BUSINESS_HOURS: Array<{
  weekday: Weekday;
  isOpen: boolean;
  startTime: string;
  endTime: string;
}> = [
  { weekday: Weekday.DOMINGO, isOpen: false, startTime: "09:00", endTime: "18:00" },
  { weekday: Weekday.SEGUNDA_FEIRA, isOpen: true, startTime: "09:00", endTime: "18:00" },
  { weekday: Weekday.TERCA_FEIRA, isOpen: true, startTime: "09:00", endTime: "18:00" },
  { weekday: Weekday.QUARTA_FEIRA, isOpen: true, startTime: "09:00", endTime: "18:00" },
  { weekday: Weekday.QUINTA_FEIRA, isOpen: true, startTime: "09:00", endTime: "18:00" },
  { weekday: Weekday.SEXTA_FEIRA, isOpen: true, startTime: "09:00", endTime: "18:00" },
  { weekday: Weekday.SABADO, isOpen: true, startTime: "09:00", endTime: "14:00" },
];

const JS_DAY_TO_WEEKDAY: Weekday[] = [
  Weekday.DOMINGO,
  Weekday.SEGUNDA_FEIRA,
  Weekday.TERCA_FEIRA,
  Weekday.QUARTA_FEIRA,
  Weekday.QUINTA_FEIRA,
  Weekday.SEXTA_FEIRA,
  Weekday.SABADO,
];

export function getWeekdayFromDate(date: Date, timeZone = "America/Fortaleza"): Weekday {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
  }).format(date);

  const map: Record<string, Weekday> = {
    Sunday: Weekday.DOMINGO,
    Monday: Weekday.SEGUNDA_FEIRA,
    Tuesday: Weekday.TERCA_FEIRA,
    Wednesday: Weekday.QUARTA_FEIRA,
    Thursday: Weekday.QUINTA_FEIRA,
    Friday: Weekday.SEXTA_FEIRA,
    Saturday: Weekday.SABADO,
  };

  return map[weekday] ?? JS_DAY_TO_WEEKDAY[date.getDay()];
}

export function getCurrentMinutes(date: Date, timeZone = "America/Fortaleza") {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

export function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function decimal(value: unknown) {
  return Number(value ?? 0);
}
