/**
 * Utility functions for the application
 */

// import { CURRENCY, VALIDATION_RULES } from '@/constants/app';

// Temporary inline constants until path resolution is working
const CURRENCY = {
  SYMBOL: "₦",
  CODE: "NGN",
  LOCALE: "en-NG",
} as const;

const VALIDATION_RULES = {
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

/**
 * Format currency amount for display
 */
export const formatCurrency = (amount: number): string => {
  return `${CURRENCY.SYMBOL}${amount.toLocaleString(CURRENCY.LOCALE, {
    minimumFractionDigits: 0,
  })}`;
};

/**
 * Validate Nigerian phone number
 */
export const validateNigerianPhone = (
  phone: string
): {
  isValid: boolean;
  error?: string;
} => {
  if (!phone) {
    return { isValid: false, error: "Phone number is required" };
  }

  const cleanPhone = phone.trim();

  if (cleanPhone.length < VALIDATION_RULES.PHONE.MIN_LENGTH) {
    return { isValid: false, error: "Phone number is too short" };
  }

  if (cleanPhone.length > VALIDATION_RULES.PHONE.MAX_LENGTH) {
    return { isValid: false, error: "Phone number is too long" };
  }

  const isValid = VALIDATION_RULES.PHONE.NIGERIAN_REGEX.test(cleanPhone);

  return {
    isValid,
    error: isValid ? undefined : "Invalid Nigerian phone number format",
  };
};

/**
 * Validate email address
 */
export const validateEmail = (
  email: string
): {
  isValid: boolean;
  error?: string;
} => {
  if (!email) {
    return { isValid: true }; // Email is optional
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);

  return {
    isValid,
    error: isValid ? undefined : "Invalid email address format",
  };
};

/**
 * Validate customer name
 */
export const validateCustomerName = (
  name: string
): {
  isValid: boolean;
  error?: string;
} => {
  if (!name) {
    return { isValid: false, error: "Customer name is required" };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < VALIDATION_RULES.CUSTOMER_NAME.MIN_LENGTH) {
    return { isValid: false, error: "Customer name is too short" };
  }

  if (trimmedName.length > VALIDATION_RULES.CUSTOMER_NAME.MAX_LENGTH) {
    return { isValid: false, error: "Customer name is too long" };
  }

  return { isValid: true };
};

/**
 * Generate customer initials for avatar
 */
export const getCustomerInitials = (name: string): string => {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Format last purchase date for display
 */
export const formatLastPurchase = (date?: string): string => {
  if (!date) return "No purchases yet";

  const purchaseDate = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - purchaseDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
};

/**
 * Generate unique ID with prefix
 */
export const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Debounce function for search inputs
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
