import { ExpenseRecurrenceFrequency } from "@prisma/client";

export function addRecurrenceInterval(
  date: Date,
  frequency: ExpenseRecurrenceFrequency,
) {
  const next = new Date(date);

  switch (frequency) {
    case "SEMANAL":
      next.setDate(next.getDate() + 7);
      break;
    case "QUINZENAL":
      next.setDate(next.getDate() + 15);
      break;
    case "MENSAL":
      next.setMonth(next.getMonth() + 1);
      break;
    case "BIMESTRAL":
      next.setMonth(next.getMonth() + 2);
      break;
    case "TRIMESTRAL":
      next.setMonth(next.getMonth() + 3);
      break;
    case "SEMESTRAL":
      next.setMonth(next.getMonth() + 6);
      break;
    case "ANUAL":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next;
}

export function splitInstallments(
  total: number,
  quantity: number,
): number[] {
  const base = Math.floor((total / quantity) * 100) / 100;
  const values = Array.from({ length: quantity }, () => base);
  const sum = base * quantity;
  const remainder = Math.round((total - sum) * 100) / 100;
  if (remainder !== 0) {
    values[values.length - 1] = Math.round((values[values.length - 1] + remainder) * 100) / 100;
  }
  return values;
}

export function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}
