/**
 * Application constants and configuration
 */

export const APP_CONFIG = {
  NAME: "Klyntl",
  VERSION: "1.0.0",
  DESCRIPTION: "Customer & Marketing Management for Nigerian SMEs",
} as const;

export const DATABASE_CONFIG = {
  NAME: "klyntl.db",
  VERSION: 1,
} as const;

export const VALIDATION_RULES = {
  PHONE: {
    NIGERIAN_REGEX: /^(\+234|0)[789][01]\d{8}$/,
    MIN_LENGTH: 11,
    MAX_LENGTH: 14,
  },
  CUSTOMER_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  SEARCH_QUERY: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
} as const;

export const CURRENCY = {
  SYMBOL: "₦",
  CODE: "NGN",
  LOCALE: "en-NG",
} as const;

export const DATE_FORMATS = {
  DISPLAY: "MMM dd, yyyy",
  ISO: "yyyy-MM-dd",
  TIMESTAMP: "yyyy-MM-dd HH:mm:ss",
} as const;

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
