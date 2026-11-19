const ariary = new Intl.NumberFormat("fr-MG", { maximumFractionDigits: 0 });

/** 12500 → "12 500 Ar" */
export function formatAriary(amount: number) {
  return `${ariary.format(amount)} Ar`;
}
