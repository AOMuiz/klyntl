/**
 * Utility functions for the application
 */

import { Platform } from "react-native";

// import { CURRENCY, VALIDATION_RULES } from '@/constants/app';

// Temporary inline constants until path resolution is working
const CURRENCY = {
  SYMBOL: "₦",
  CODE: "NGN",
  LOCALE: "en-NG",
} as const;

export const VALIDATION_RULES = {
  PHONE: {
    NIGERIAN_REGEX: /^(\+234|0)[789]\d{2}\d{7}$/, // Fixed: Nigerian mobile format 0[789]XXYYYYYYY or +234[789]XXYYYYYYY
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

  // Remove all non-digit and plus characters
  let normalized = phone.replace(/[^\d+]/g, "").trim();

  // Check allowed characters
  if (!VALIDATION_RULES.PHONE.ALLOWED_CHARS.test(phone)) {
    return {
      isValid: false,
      error: "Phone number contains invalid characters",
    };
  }

  // Normalize Nigerian numbers: allow +234, 234, or 0 as prefix
  if (normalized.startsWith("+234")) {
    normalized = normalized.replace("+234", "0");
  } else if (normalized.startsWith("234")) {
    normalized = normalized.replace("234", "0");
  }

  // Remove leading zeros (except the first one)
  normalized = normalized.replace(/^0+/, "0");

  // Check length
  if (normalized.length < VALIDATION_RULES.PHONE.MIN_LENGTH) {
    return { isValid: false, error: "Phone number is too short" };
  }
  if (normalized.length > VALIDATION_RULES.PHONE.MAX_LENGTH) {
    return { isValid: false, error: "Phone number is too long" };
  }

  // Check prefix
  const prefix = normalized.slice(0, 1);
  if (
    !VALIDATION_RULES.PHONE.ALLOWED_PREFIXES.includes(prefix) &&
    !normalized.startsWith("0")
  ) {
    return { isValid: false, error: "Phone number must start with 0 or +234" };
  }

  // Nigerian mobile number strict regex
  if (!VALIDATION_RULES.PHONE.NIGERIAN_REGEX.test(normalized)) {
    return { isValid: false, error: "Invalid Nigerian phone number format" };
  }

  return { isValid: true };
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
  const parts = name
    .trim()
    .split(" ")
    .filter((part) => part.length > 0);

  if (parts.length === 1) {
    // Single name: take first two letters
    return parts[0].slice(0, 2).toUpperCase();
  } else {
    // Multiple names: take first letter of first two parts
    return parts
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();
  }
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
  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 9)}`;
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

export const blurhash =
  "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

export const isIOS = (): boolean => Platform.OS === "ios";
export const isAndroid = (): boolean => Platform.OS === "android";
export const isWeb = (): boolean => Platform.OS === "web";

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
