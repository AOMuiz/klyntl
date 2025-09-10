/**
 * Tests for the new libphonenumber      test('provides formatted output for valid Nigerian numbers', () => {
        const result = validatePhoneNumber('08012345678', 'NG');
        
        expect(result.isValid).toBe(true);
        expect(result.formatted).toBe('0801 234 5678'); // National format
        expect(result.international).toBe('+234 801 234 5678');
        expect(result.countryCode).toBe('NG');
      });act validation system
 * Demonstrates the enhanced capabilities and international support
 */

import {
  getEmailValidationError,
  getPhoneValidationError,
  isValidEmail,
  isValidNigerianPhone,
  isValidPhone,
  validateEmail,
  validateNigerianPhone,
  validatePhoneNumber,
} from "../contactValidation";

describe("Enhanced Contact Validation with libphonenumber-js", () => {
  describe("Phone Number Validation", () => {
    describe("Nigerian Numbers", () => {
      test("validates Nigerian mobile numbers in various formats", () => {
        const testNumbers = [
          "+2348012345678",
          "08012345678",
          "2348012345678",
          "+234 801 234 5678",
          "+234-801-234-5678",
          "0801 234 5678",
        ];

        testNumbers.forEach((number) => {
          const result = validatePhoneNumber(number, "NG");
          expect(result.isValid).toBe(true);
          expect(result.countryCode).toBe("NG");
          expect(result.international).toMatch(/\+234/);
        });
      });

      test("provides formatted output for valid Nigerian numbers", () => {
        const result = validatePhoneNumber("+2348012345678", "NG");

        expect(result.isValid).toBe(true);
        expect(result.formatted).toMatch(/\(080\)/); // National format
        expect(result.international).toBe("+234 801 234 5678");
        expect(result.countryCode).toBe("NG");
      });

      test("rejects invalid Nigerian numbers", () => {
        const invalidNumbers = [
          "081", // Too short
          "not-a-number",
          "",
          "123456789012345", // Too long
        ];

        invalidNumbers.forEach((number) => {
          const result = validatePhoneNumber(number, "NG");
          expect(result.isValid).toBe(false);
          expect(result.error).toBeDefined();
        });
      });
    });

    describe("International Numbers", () => {
      test("validates US phone numbers", () => {
        const result = validatePhoneNumber("+1 202 555 1234", "US");

        expect(result.isValid).toBe(true);
        expect(result.countryCode).toBe("US");
        expect(result.international).toBe("+1 202 555 1234");
        expect(result.formatted).toMatch(/\(202\)/); // US national format
      });

      test("validates UK phone numbers", () => {
        const result = validatePhoneNumber("+44 20 7946 0958", "GB");

        expect(result.isValid).toBe(true);
        expect(result.countryCode).toBe("GB");
        expect(result.international).toBe("+44 20 7946 0958");
      });

      test("validates French phone numbers", () => {
        const result = validatePhoneNumber("+33 1 45 45 32 45", "FR");

        expect(result.isValid).toBe(true);
        expect(result.countryCode).toBe("FR");
        expect(result.international).toBe("+33 1 45 45 32 45");
      });

      test("auto-detects country from international format", () => {
        // Should detect US number without specifying country
        const usResult = validatePhoneNumber("+1 202 555 1234");
        expect(usResult.countryCode).toBe("US");

        // Should detect UK number without specifying country
        const ukResult = validatePhoneNumber("+44 20 7946 0958");
        expect(ukResult.countryCode).toBe("GB");

        // Should detect Nigerian number without specifying country
        const ngResult = validatePhoneNumber("+234 801 234 5678");
        expect(ngResult.countryCode).toBe("NG");
      });
    });

    describe("Backward Compatibility", () => {
      test("validateNigerianPhone function works as before", () => {
        const result = validateNigerianPhone("+2348012345678");

        expect(result.isValid).toBe(true);
        expect(result.countryCode).toBe("NG");
      });

      test("isValidNigerianPhone boolean function works", () => {
        expect(isValidNigerianPhone("+2348012345678")).toBe(true);
        expect(isValidNigerianPhone("1234567890")).toBe(false);
      });

      test("isValidPhone with different countries", () => {
        expect(isValidPhone("+2348012345678", "NG")).toBe(true);
        expect(isValidPhone("+1 202 555 1234", "US")).toBe(true);
        expect(isValidPhone("invalid", "NG")).toBe(false);
      });
    });

    describe("Error Handling", () => {
      test("provides helpful error messages", () => {
        const shortNumber = getPhoneValidationError("123");
        expect(shortNumber).toContain("Invalid");

        const invalidPrefix = getPhoneValidationError("08112345678", "NG");
        expect(invalidPrefix).toBeTruthy();
      });

      test("handles edge cases gracefully", () => {
        const emptyResult = validatePhoneNumber("");
        expect(emptyResult.isValid).toBe(false);
        expect(emptyResult.error).toBe("Phone number is required");

        const whitespaceResult = validatePhoneNumber("   ");
        expect(whitespaceResult.isValid).toBe(false);
      });
    });
  });

  describe("Email Validation", () => {
    describe("Valid Email Addresses", () => {
      test("validates standard email formats", () => {
        const validEmails = [
          "user@example.com",
          "user.name@example.com",
          "user+tag@example.com",
          "user123@example.co.uk",
          "firstname.lastname@company.org",
          "test.email-with-dash@example.com",
        ];

        validEmails.forEach((email) => {
          const result = validateEmail(email);
          expect(result.isValid).toBe(true);
          expect(result.formatted).toBe(email.toLowerCase());
        });
      });

      test("normalizes email case", () => {
        const result = validateEmail("User@EXAMPLE.COM");

        expect(result.isValid).toBe(true);
        expect(result.formatted).toBe("user@example.com");
      });

      test("handles optional email correctly", () => {
        // Empty or undefined emails should be valid (optional)
        expect(validateEmail("").isValid).toBe(true);
        expect(validateEmail(undefined).isValid).toBe(true);
        expect(validateEmail("   ").isValid).toBe(true);
      });
    });

    describe("Invalid Email Addresses", () => {
      test("rejects malformed emails", () => {
        const invalidEmails = [
          "plainaddress",
          "@missingusername.com",
          "username@.com",
          "username@com",
          "username..double.dot@example.com",
          "username@-example.com",
          "username@example-.com",
        ];

        invalidEmails.forEach((email) => {
          const result = validateEmail(email);
          expect(result.isValid).toBe(false);
          expect(result.error).toBeDefined();
        });
      });

      test("enforces length limits", () => {
        // Email too long (over 254 characters)
        const longEmail = "a".repeat(250) + "@example.com";
        const longResult = validateEmail(longEmail);
        expect(longResult.isValid).toBe(false);
        expect(longResult.error).toContain("too long");

        // Local part too long (over 64 characters)
        const longLocal = "a".repeat(70) + "@example.com";
        const localResult = validateEmail(longLocal);
        expect(localResult.isValid).toBe(false);
        expect(localResult.error).toContain("local part");
      });
    });

    describe("Backward Compatibility", () => {
      test("isValidEmail boolean function works", () => {
        expect(isValidEmail("user@example.com")).toBe(true);
        expect(isValidEmail("invalid-email")).toBe(false);
        expect(isValidEmail("")).toBe(true); // Optional
      });

      test("provides error messages for UI", () => {
        const error = getEmailValidationError("invalid-email");
        expect(error).toBeTruthy();
        expect(error).toContain("Invalid email");

        const noError = getEmailValidationError("user@example.com");
        expect(noError).toBeNull();
      });
    });
  });

  describe("Integration Examples", () => {
    test("validates contact form data", () => {
      const contactData = {
        name: "John Doe",
        phone: "+2348012345678",
        email: "john.doe@example.com",
      };

      const phoneResult = validatePhoneNumber(contactData.phone, "NG");
      const emailResult = validateEmail(contactData.email);

      expect(phoneResult.isValid).toBe(true);
      expect(emailResult.isValid).toBe(true);

      // Can get formatted versions for storage
      const formattedData = {
        ...contactData,
        phone: phoneResult.phoneNumber?.number, // E.164 format: +2348012345678
        phoneFormatted: phoneResult.formatted, // National format: (080) 1234-5678
        email: emailResult.formatted, // Normalized: john.doe@example.com
      };

      expect(formattedData.phone).toBe("+2348012345678");
      expect(formattedData.email).toBe("john.doe@example.com");
    });

    test("handles international customer data", () => {
      const customers = [
        { name: "Nigerian Customer", phone: "+2348012345678", country: "NG" },
        { name: "US Customer", phone: "+1 555 123 4567", country: "US" },
        { name: "UK Customer", phone: "+44 20 7946 0958", country: "GB" },
      ];

      customers.forEach((customer) => {
        const result = validatePhoneNumber(
          customer.phone,
          customer.country as any
        );
        expect(result.isValid).toBe(true);
        expect(result.countryCode).toBe(customer.country);
      });
    });
  });

  describe("Performance and Edge Cases", () => {
    test("handles malformed input gracefully", () => {
      const edgeCases = [
        null,
        undefined,
        "",
        "   ",
        "abc123",
        "+++++",
        "-----",
        "()()()())",
        "123..456..789",
      ];

      edgeCases.forEach((input) => {
        expect(() => {
          const result = validatePhoneNumber(input as any);
          // Should not throw, just return invalid result
          expect(typeof result.isValid).toBe("boolean");
        }).not.toThrow();
      });
    });

    test("is reasonably fast for common operations", () => {
      const startTime = Date.now();

      // Validate 100 phone numbers
      for (let i = 0; i < 100; i++) {
        validatePhoneNumber("+2348012345678", "NG");
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete 100 validations in under 1 second
      expect(duration).toBeLessThan(1000);
    });
  });
});
