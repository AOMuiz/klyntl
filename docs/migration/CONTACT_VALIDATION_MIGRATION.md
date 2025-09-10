# Contact Validation Migration to libphonenumber-js

## Overview

This document summarizes the migration from custom phone number validation to the standardized `libphonenumber-js` library for robust international phone number validation.

## What Was Changed

### 1. New Validation Module

- **Created**: `src/utils/contactValidation.ts`
- **Purpose**: Centralized validation using `libphonenumber-js`
- **Features**:
  - International phone number support
  - Nigerian phone number specialization
  - Enhanced email validation
  - Backward compatibility wrappers

### 2. Library Installation

- **Added**: `libphonenumber-js` dependency via `pnpm add libphonenumber-js`
- **Benefits**:
  - Industry-standard validation
  - Regular updates with new number ranges
  - Better international support
  - More accurate validation rules

### 3. Updated Files

#### Core Validation Files:

- `src/utils/helpers.ts` - Updated to use new validation (backward compatibility)
- `src/utils/validations.ts` - Updated to use new validation (backward compatibility)
- `src/services/database/service/ValidationService.ts` - Updated to use new validation

#### User Interface Components:

- `src/screens/customer/AddCustomerScreen.tsx` - Updated validation functions
- `src/screens/customer/EditCustomerScreen.tsx` - Updated validation functions
- `src/app/auth/register.tsx` - Updated phone validation
- `src/components/ContactPicker.tsx` - Updated phone validation

#### Business Logic:

- `src/hooks/useContactImport.ts` - Updated phone validation
- `src/stores/customerStore.ts` - Updated phone validation

## New API Functions

### Phone Number Validation

```typescript
// Main validation function
validatePhoneNumber(input: string, defaultCountry: string = 'NG'): PhoneValidationResult

// Nigerian-specific validation
validateNigerianPhone(input: string): PhoneValidationResult

// Quick boolean checks
isValidPhone(input: string, defaultCountry: string = 'NG'): boolean
isValidNigerianPhone(input: string): boolean

// Error messages for UI
getPhoneValidationError(input: string, defaultCountry: string = 'NG'): string | null
```

### Email Validation

```typescript
// Enhanced email validation
validateEmail(input?: string): EmailValidationResult

// Quick boolean check
isValidEmail(input?: string): boolean

// Error messages for UI
getEmailValidationError(input?: string): string | null
```

### Return Types

```typescript
interface PhoneValidationResult {
  isValid: boolean;
  formatted?: string; // National format: (080) 1234-5678
  international?: string; // International format: +234 80 1234 5678
  national?: string; // National format: (080) 1234-5678
  error?: string; // Error message if invalid
  countryCode?: string; // Country code: 'NG'
  phoneNumber?: PhoneNumber; // libphonenumber-js PhoneNumber object
}

interface EmailValidationResult {
  isValid: boolean;
  error?: string; // Error message if invalid
  formatted?: string; // Normalized email address
}
```

## Benefits of the Migration

### 1. **Better Validation Accuracy**

- Uses Google's libphonenumber database
- Regular updates with new phone number ranges
- Handles edge cases better than custom regex

### 2. **International Support**

- Supports all countries, not just Nigeria
- Proper handling of country codes
- International formatting capabilities

### 3. **Enhanced Features**

- Automatic phone number formatting
- E.164 format conversion
- Number type detection (mobile, landline, etc.)
- Better error messages

### 4. **Maintainability**

- Industry-standard library
- Well-documented and tested
- Active community support
- Reduces custom code maintenance

### 5. **Backward Compatibility**

- Existing code continues to work
- Gradual migration possible
- Same function signatures maintained

## Examples

### Before (Custom Validation)

```typescript
// Old custom validation
const validation = validateNigerianPhone("+2348012345678");
if (validation.isValid) {
  // Phone is valid
}
```

### After (libphonenumber-js)

```typescript
// New standardized validation
const validation = validatePhoneNumber("+2348012345678", "NG");
if (validation.isValid) {
  console.log(validation.formatted); // (080) 1234-5678
  console.log(validation.international); // +234 80 1234 5678
  console.log(validation.countryCode); // NG
}

// Still supports the old function names for compatibility
const legacyResult = validateNigerianPhone("+2348012345678");
```

## International Examples

### US Phone Numbers

```typescript
const usPhone = validatePhoneNumber("(555) 123-4567", "US");
// Result: +1 555 123 4567
```

### UK Phone Numbers

```typescript
const ukPhone = validatePhoneNumber("020 7946 0958", "GB");
// Result: +44 20 7946 0958
```

### Automatic Country Detection

```typescript
const intlPhone = validatePhoneNumber("+1-555-123-4567");
// Automatically detects US number
```

## Email Validation Improvements

### Enhanced Validation

- Better regex pattern for edge cases
- Length validation (local part max 64 chars, total max 254 chars)
- Proper domain validation
- Case normalization

### Example

```typescript
const email = validateEmail("user.name+tag@example.com");
if (email.isValid) {
  console.log(email.formatted); // user.name+tag@example.com (normalized)
}
```

## Migration Testing

The migration maintains backward compatibility, so existing tests should continue to pass. New tests can use the enhanced validation features:

```typescript
import { validatePhoneNumber, validateEmail } from "@/utils/contactValidation";

describe("Enhanced Contact Validation", () => {
  test("validates international phone numbers", () => {
    const result = validatePhoneNumber("+234 803 123 4567", "NG");
    expect(result.isValid).toBe(true);
    expect(result.countryCode).toBe("NG");
    expect(result.international).toBe("+234 803 123 4567");
  });

  test("validates email addresses", () => {
    const result = validateEmail("test@example.com");
    expect(result.isValid).toBe(true);
    expect(result.formatted).toBe("test@example.com");
  });
});
```

## Next Steps

1. **Gradual Migration**: Update remaining files to use the new validation functions
2. **Enhanced Features**: Implement phone number formatting in UI components
3. **International Expansion**: Use the international support for global customers
4. **Performance**: The new library is optimized and should perform better
5. **Testing**: Add comprehensive tests for the new validation features

## Rollback Plan

If issues arise, the migration can be easily rolled back by:

1. Removing the `libphonenumber-js` dependency
2. Restoring the original validation functions in `helpers.ts` and `validations.ts`
3. Reverting the import statements in updated files

The backward compatibility wrappers ensure that existing code will continue to work even during rollback.
