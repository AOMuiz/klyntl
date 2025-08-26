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
  currency: keyof typeof RATES = "NGN"
) {
  const symbol = currency === "NGN" ? "₦" : currency === "USD" ? "$" : "€";
  return `${symbol}${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
  })}`;
}

/**
 * Get supported currencies
 */
export function getSupportedCurrencies(): string[] {
  return Object.keys(RATES);
}
