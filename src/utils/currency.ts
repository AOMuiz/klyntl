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
export function formatCurrency(
  amount: number,
  options: { short?: boolean; currency?: "NGN" | "USD" | "EUR" } = {
    currency: "NGN",
  }
) {
  const { short, currency = "NGN" } = options;

  if (short) {
    // Compact decimal (no currency, avoids RN bug)
    const compactNumber = new Intl.NumberFormat("en-NG", {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(amount);

    // Extract currency symbol once
    const sample = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(1);

    const symbol = sample.replace(/\d/g, "").trim();

    return `${symbol}${compactNumber}`;
  }

  // Standard currency
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
