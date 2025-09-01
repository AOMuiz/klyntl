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
    NIGERIAN_REGEX: /^(\+234|0)[789][01]\d{8}$/, // Strict Nigerian mobile format
    INTERNATIONAL_REGEX: /^\+?[1-9]\d{7,14}$/, // General international format
    MIN_LENGTH: 11,
    MAX_LENGTH: 15,
    ALLOWED_PREFIXES: ["+234", "234", "0"],
    ALLOWED_CHARS: /^[\d\+\-\s\(\)]+$/, // Digits, +, -, space, ()
  },
  CUSTOMER_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
    ALLOWED_CHARS: /^[A-Za-z0-9 .,'-]+$/, // Letters, numbers, spaces, common punctuation
    DISALLOWED_CHARS: /[^A-Za-z0-9 .,'-]/, // For stricter checks
  },
  SEARCH_QUERY: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    ALLOWED_CHARS: /^[A-Za-z0-9 .,'-]+$/,
  },
  EMAIL: {
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MIN_LENGTH: 5,
    MAX_LENGTH: 100,
  },
  ADDRESS: {
    MAX_LENGTH: 200,
  },
  COMPANY: {
    MAX_LENGTH: 100,
  },
  NOTES: {
    MAX_LENGTH: 500,
  },
  NICKNAME: {
    MAX_LENGTH: 50,
  },
  JOB_TITLE: {
    MAX_LENGTH: 50,
  },
  PRODUCT_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200,
    ALLOWED_CHARS: /^[A-Za-z0-9 .,'-]+$/,
  },
  SKU: {
    MAX_LENGTH: 30,
    ALLOWED_CHARS: /^[A-Za-z0-9\-]+$/,
  },
  CATEGORY_NAME: {
    MAX_LENGTH: 100,
    ALLOWED_CHARS: /^[A-Za-z0-9 .,'-]+$/,
  },
};

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
