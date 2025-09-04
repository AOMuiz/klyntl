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

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    currencyDisplay: "symbol", // ensures ₦ / $ / €
    notation: short ? "compact" : "standard", // short = 100K, standard = 100,000
    compactDisplay: short ? "short" : undefined,
    maximumFractionDigits: short ? 1 : 0, // 1 decimal for compact, none for normal
  }).format(amount);
}

/**
 * Get supported currencies
 */
export function getSupportedCurrencies(): string[] {
  return Object.keys(RATES);
}
