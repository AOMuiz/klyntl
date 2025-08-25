import {
  formatCurrency,
  formatLastPurchase,
  generateId,
  getCustomerInitials,
  validateCustomerName,
  validateEmail,
  validateNigerianPhone,
} from "../helpers";

describe("Helper Functions", () => {
  describe("formatCurrency", () => {
    it("should format currency correctly", () => {
      expect(formatCurrency(1000)).toBe("₦1,000");
      expect(formatCurrency(1500000)).toBe("₦1,500,000");
      expect(formatCurrency(0)).toBe("₦0");
    });
  });

  describe("validateNigerianPhone", () => {
    it("should validate correct Nigerian phone numbers", () => {
      const validNumbers = [
        "+2348012345678",
        "+2347012345678",
        "+2349012345678",
        "08012345678",
        "07012345678",
        "09012345678",
      ];

      validNumbers.forEach((phone) => {
        const result = validateNigerianPhone(phone);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it("should reject invalid phone numbers", () => {
      const invalidNumbers = [
        "",
        "123",
        "+2345012345678", // Invalid prefix
        "08012345", // Too short
        "080123456789012", // Too long
        "+234801234567a", // Contains letter
      ];

      invalidNumbers.forEach((phone) => {
        const result = validateNigerianPhone(phone);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it("should handle empty phone number", () => {
      const result = validateNigerianPhone("");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Phone number is required");
    });
  });

  describe("validateEmail", () => {
    it("should validate correct email addresses", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "user+tag@example.org",
      ];

      validEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it("should reject invalid email addresses", () => {
      const invalidEmails = [
        "invalid-email",
        "@domain.com",
        "user@",
        "user@domain",
      ];

      invalidEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe("Invalid email address format");
      });
    });

    it("should allow empty email (optional field)", () => {
      const result = validateEmail("");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe("validateCustomerName", () => {
    it("should validate correct customer names", () => {
      const validNames = ["John Doe", "A", "A".repeat(100)];

      validNames.forEach((name) => {
        const result = validateCustomerName(name);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it("should reject invalid customer names", () => {
      const result1 = validateCustomerName("");
      expect(result1.isValid).toBe(false);
      expect(result1.error).toBe("Customer name is required");

      const result2 = validateCustomerName("A");
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe("Customer name is too short");

      const result3 = validateCustomerName("A".repeat(101));
      expect(result3.isValid).toBe(false);
      expect(result3.error).toBe("Customer name is too long");
    });
  });

  describe("getCustomerInitials", () => {
    it("should generate correct initials", () => {
      expect(getCustomerInitials("John Doe")).toBe("JD");
      expect(getCustomerInitials("John Michael Doe")).toBe("JM");
      expect(getCustomerInitials("Madonna")).toBe("MA");
      expect(getCustomerInitials("a b c d e")).toBe("AB");
    });
  });

  describe("formatLastPurchase", () => {
    it("should format dates correctly", () => {
      // No purchase
      expect(formatLastPurchase()).toBe("No purchases yet");
      expect(formatLastPurchase(undefined)).toBe("No purchases yet");

      // Yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(formatLastPurchase(yesterday.toISOString())).toBe("Yesterday");

      // Days ago
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      expect(formatLastPurchase(threeDaysAgo.toISOString())).toBe("3 days ago");

      // Weeks ago
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      expect(formatLastPurchase(twoWeeksAgo.toISOString())).toBe("2 weeks ago");

      // Months ago
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      expect(formatLastPurchase(twoMonthsAgo.toISOString())).toBe(
        "2 months ago"
      );
    });
  });

  describe("generateId", () => {
    it("should generate unique IDs with prefix", () => {
      const id1 = generateId("test");
      const id2 = generateId("test");

      expect(id1).toMatch(/^test_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^test_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it("should work with different prefixes", () => {
      const customerId = generateId("cust");
      const transactionId = generateId("txn");

      expect(customerId).toMatch(/^cust_\d+_[a-z0-9]+$/);
      expect(transactionId).toMatch(/^txn_\d+_[a-z0-9]+$/);
    });
  });
});
