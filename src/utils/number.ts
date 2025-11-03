export function abbreviate(n: number): string {
  if (n >= 1_000_000_000) return `${Math.round(n / 1_000_000) / 1000} Miliar`;
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)} Juta`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} Ribu`;
  return n.toString();
}


