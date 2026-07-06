export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatInstallment(price: number, installments: number): string {
  const installmentValue = price / installments;
  return `${installments}x de ${formatCurrency(installmentValue)} sem juros`;
}
