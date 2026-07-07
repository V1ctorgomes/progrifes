export function normalizeCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, "");
}

export function isValidCnpj(cnpj: string): boolean {
  const digits = normalizeCnpj(cnpj);

  if (digits.length !== 14) {
    return false;
  }

  if (/^(\d)\1+$/.test(digits)) {
    return false;
  }

  const calcDigit = (base: string, weights: number[]) => {
    const sum = base
      .split("")
      .reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calcDigit(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (firstDigit !== Number(digits[12])) {
    return false;
  }

  const secondDigit = calcDigit(digits.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return secondDigit === Number(digits[13]);
}
