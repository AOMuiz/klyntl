/**
 * Standardized Contact Validation using libphonenumber-js
 */

import { parsePhoneNumberWithError, type PhoneNumber } from "libphonenumber-js";

export interface PhoneValidationResult {
  isValid: boolean;
  formatted?: string;
  international?: string;
  national?: string;
  error?: string;
  countryCode?: string;
  phoneNumber?: PhoneNumber;
}

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  formatted?: string;
}

export function validatePhoneNumber(
  input: string,
  defaultCountry: string = "NG"
): PhoneValidationResult {
  if (!input?.trim()) {
    return {
      isValid: false,
      error: "Phone number is required",
    };
  }

  try {
    const phoneNumber = parsePhoneNumberWithError(input, defaultCountry as any);

    if (!phoneNumber) {
      return {
        isValid: false,
        error: "Invalid phone number format",
      };
    }

    const isValid = phoneNumber.isValid();

    if (!isValid) {
      return {
        isValid: false,
        error: "Invalid phone number",
        phoneNumber,
      };
    }

    return {
      isValid: true,
      formatted: phoneNumber.formatNational(),
      international: phoneNumber.formatInternational(),
      national: phoneNumber.formatNational(),
      countryCode: phoneNumber.country,
      phoneNumber,
    };
  } catch (error) {
    return {
      isValid: false,
      error:
        error instanceof Error ? error.message : "Invalid phone number format",
    };
  }
}

export function validateNigerianPhone(input: string): PhoneValidationResult {
  return validatePhoneNumber(input, "NG");
}

export function isValidPhone(
  input: string,
  defaultCountry: string = "NG"
): boolean {
  return validatePhoneNumber(input, defaultCountry).isValid;
}

export function isValidNigerianPhone(input: string): boolean {
  return validateNigerianPhone(input).isValid;
}

export function validateEmail(input?: string): EmailValidationResult {
  if (!input?.trim()) {
    return {
      isValid: true,
      error: undefined,
    };
  }

  const email = input.trim().toLowerCase();

  // More comprehensive email validation
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: "Invalid email address format",
    };
  }

  if (email.length > 254) {
    return {
      isValid: false,
      error: "Email address is too long",
    };
  }

  const localPart = email.split("@")[0];
  if (localPart.length > 64) {
    return {
      isValid: false,
      error: "Email address local part is too long",
    };
  }

  return {
    isValid: true,
    formatted: email,
  };
}

export function isValidEmail(input?: string): boolean {
  return validateEmail(input).isValid;
}

export function getPhoneValidationError(
  input: string,
  defaultCountry: string = "NG"
): string | null {
  const result = validatePhoneNumber(input, defaultCountry);
  return result.error || null;
}

export function getEmailValidationError(input?: string): string | null {
  const result = validateEmail(input);
  return result.error || null;
}
