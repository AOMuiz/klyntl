// Solution 1: Validation helper functions
export function validateNumber(
  value: string | number,
  defaultValue: number = 0
): number {
  if (typeof value === "number")
    return Number.isFinite(value) ? value : defaultValue;

  const trimmed = String(value).trim();
  if (trimmed === "") return defaultValue;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

export function validatePositiveInteger(
  value: string | number,
  defaultValue: number = 0
): number {
  const num = validateNumber(value, defaultValue);
  return Math.max(0, Math.floor(num));
}

// Solution 2: Validation with error throwing
export function parseNumberStrict(
  value: string | number,
  fieldName: string
): number {
  if (typeof value === "number") {
    if (isNaN(value)) throw new Error(`${fieldName} must be a valid number`);
    return value;
  }

  const trimmed = String(value).trim();
  if (trimmed === "") throw new Error(`${fieldName} is required`);

  const parsed = parseFloat(trimmed);
  if (isNaN(parsed))
    throw new Error(`${fieldName} must be a valid number, got "${value}"`);

  return parsed;
}

// Solution 3: Validation with result object (most flexible)
interface ValidationResult<T> {
  success: boolean;
  value?: T;
  error?: string;
}

export function validateNumberSafe(
  value: string | number,
  fieldName: string
): ValidationResult<number> {
  try {
    if (typeof value === "number") {
      if (isNaN(value))
        return { success: false, error: `${fieldName} is not a valid number` };
      return { success: true, value };
    }

    const trimmed = String(value).trim();
    if (trimmed === "")
      return { success: false, error: `${fieldName} is required` };

    const parsed = parseFloat(trimmed);
    if (isNaN(parsed)) {
      return {
        success: false,
        error: `${fieldName} must be a valid number, got "${value}"`,
      };
    }

    return { success: true, value: parsed };
  } catch (error) {
    return {
      success: false,
      error: `Validation error for ${fieldName}: ${error}`,
    };
  }
}

/**
 * Validation utilities for the Klyntl app
 */

/**
 * Validates a Nigerian phone number
 * Supports formats:
 * - +234XXXXXXXXXX (international)
 * - 0XXXXXXXXXX (local)
 * - 080XXXXXXXX (common format)
 * - 090XXXXXXXX (common format)
 * - 070XXXXXXXX (common format)
 * - 081XXXXXXXX (common format)
 */
export const validateNigerianPhone = (phone: string): boolean => {
  if (!phone) return false;

  // Remove all non-digit characters except +
  const cleanPhone = phone.replace(/[^\d+]/g, "");

  // Check for international format (+234)
  if (cleanPhone.startsWith("+234")) {
    const numberPart = cleanPhone.substring(4);
    return /^\d{10}$/.test(numberPart);
  }

  // Check for local format (0)
  if (cleanPhone.startsWith("0")) {
    return /^\d{11}$/.test(cleanPhone);
  }

  // Check for 10-digit format without leading 0
  if (/^\d{10}$/.test(cleanPhone)) {
    return true;
  }

  return false;
};

/**
 * Formats a Nigerian phone number to a consistent format
 */
export const formatNigerianPhone = (phone: string): string => {
  if (!phone) return phone;

  const cleanPhone = phone.replace(/[^\d+]/g, "");

  // If already in international format, return as is
  if (cleanPhone.startsWith("+234")) {
    return cleanPhone;
  }

  // If starts with 0, convert to international format
  if (cleanPhone.startsWith("0")) {
    return `+234${cleanPhone.substring(1)}`;
  }

  // If 10 digits, assume it's without leading 0, add +234
  if (/^\d{10}$/.test(cleanPhone)) {
    return `+234${cleanPhone}`;
  }

  return phone; // Return original if format is unrecognized
};

/**
 * Validates an email address
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export const validatePassword = (password: string): boolean => {
  if (!password) return false;

  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);

  return minLength && hasUpperCase && hasLowerCase && hasNumbers;
};

/**
 * Validates business name
 * Requirements:
 * - Not empty if provided
 * - At least 2 characters
 * - No special characters that could cause issues
 */
export const validateBusinessName = (name: string): boolean => {
  if (!name || name.trim() === "") return true; // Optional field

  const trimmed = name.trim();
  return trimmed.length >= 2 && /^[a-zA-Z0-9\s&.-]+$/.test(trimmed);
};

/**
 * Validates full name
 * Requirements:
 * - Not empty if provided
 * - At least 2 characters
 * - Contains at least one space (first and last name)
 */
export const validateFullName = (name: string): boolean => {
  if (!name || name.trim() === "") return true; // Optional field

  const trimmed = name.trim();
  return (
    trimmed.length >= 2 &&
    trimmed.includes(" ") &&
    /^[a-zA-Z\s]+$/.test(trimmed)
  );
};

/**
 * Get validation error message for Nigerian phone
 */
export const getNigerianPhoneError = (phone: string): string | null => {
  if (!phone) return null;

  if (!validateNigerianPhone(phone)) {
    return "Please enter a valid Nigerian phone number (e.g., +2348012345678 or 08012345678)";
  }

  return null;
};

/**
 * Get validation error message for email
 */
export const getEmailError = (email: string): string | null => {
  if (!email) return null;

  if (!validateEmail(email)) {
    return "Please enter a valid email address";
  }

  return null;
};

/**
 * Get validation error message for password
 */
export const getPasswordError = (password: string): string | null => {
  if (!password) return null;

  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }

  if (!/\d/.test(password)) {
    return "Password must contain at least one number";
  }

  return null;
};

/**
 * Get validation error message for business name
 */
export const getBusinessNameError = (name: string): string | null => {
  if (!name || name.trim() === "") return null;

  if (name.trim().length < 2) {
    return "Business name must be at least 2 characters long";
  }

  if (!/^[a-zA-Z0-9\s&.-]+$/.test(name.trim())) {
    return "Business name can only contain letters, numbers, spaces, and basic punctuation";
  }

  return null;
};

/**
 * Get validation error message for full name
 */
export const getFullNameError = (name: string): string | null => {
  if (!name || name.trim() === "") return null;

  if (name.trim().length < 2) {
    return "Full name must be at least 2 characters long";
  }

  if (!name.trim().includes(" ")) {
    return "Please enter both first and last name";
  }

  if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
    return "Full name can only contain letters and spaces";
  }

  return null;
};
