/**
 * Currency conversion and formatting utilities
 */

// Example rates, in a real app this would be fetched from an API
const RATES: Record<string, number> = {
  NGN: 1,
  USD: 0.0012,
  EUR: 0.0011,
};

/**
 * Convert an amount from NGN to another currency
 */
export function convertCurrency(
  amount: number,
  to: keyof typeof RATES
): number {
  const rate = RATES[to] || 1;
  return amount * rate;
}

/**
 * Format currency for display
 */
type Curr = "NGN" | "USD" | "EUR";

const CURRENCY_SYMBOL: Record<Curr, string> = {
  NGN: "₦",
  USD: "$",
  EUR: "€",
};

function toCompact(n: number) {
  const abs = Math.abs(n);
  const units = [
    { v: 1e12, s: "T" },
    { v: 1e9, s: "B" },
    { v: 1e6, s: "M" },
    { v: 1e3, s: "K" },
  ];
  for (let i = 0; i < units.length; i++) {
    const { v, s } = units[i];
    if (abs >= v) {
      let num = Math.round((abs / v) * 10) / 10; // 1 decimal
      // If we rounded up to 1000 of a unit, bump to next unit
      if (num >= 1000 && i > 0) {
        const next = units[i - 1];
        num = Math.round((abs / next.v) * 10) / 10;
        return `${num % 1 === 0 ? num.toFixed(0) : num}${next.s}`;
      }
      return `${num % 1 === 0 ? num.toFixed(0) : num}${s}`;
    }
  }
  return String(n);
}

export function formatCurrency(
  amount: number,
  options: {
    short?: boolean;
    currency?: Curr;
    useCodeIfNairaMissing?: boolean;
  } = {
    currency: "NGN",
  }
) {
  const {
    short = false,
    currency = "NGN",
    useCodeIfNairaMissing = false,
  } = options;

  if (short) {
    const symbol =
      currency === "NGN" && useCodeIfNairaMissing
        ? "NGN "
        : CURRENCY_SYMBOL[currency] ?? "";
    const sign = amount < 0 ? "-" : "";
    const compact = toCompact(Math.abs(amount));
    return `${sign}${symbol}${compact}`;
  }

  // Standard (non-compact) uses Intl safely
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get supported currencies
 */
export function getSupportedCurrencies(): string[] {
  return Object.keys(RATES);
}
