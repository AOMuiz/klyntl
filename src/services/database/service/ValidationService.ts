import { CreateCustomerInput, UpdateCustomerInput } from "@/types/customer";
import { CreateProductInput, UpdateProductInput } from "@/types/product";
import {
  CreateTransactionInput,
  UpdateTransactionInput,
} from "@/types/transaction";
import { SQLiteDatabase } from "expo-sqlite";
import {
  BusinessRuleError,
  DuplicateError,
  ValidationError,
} from "./utilService";

// Validation Service Implementation
export class ValidationService {
  constructor(private db: SQLiteDatabase) {}

  async validateCustomer(
    data: CreateCustomerInput | UpdateCustomerInput
  ): Promise<void> {
    // Name validation
    if ("name" in data) {
      if (!data.name?.trim()) {
        throw new ValidationError(
          "Name is required and cannot be empty",
          "name"
        );
      }
      if (data.name.length > 100) {
        throw new ValidationError("Name cannot exceed 100 characters", "name");
      }
    }

    // Phone validation
    if ("phone" in data) {
      if (!data.phone?.trim()) {
        throw new ValidationError(
          "Phone is required and cannot be empty",
          "phone"
        );
      }

      // Remove formatting characters for validation
      const cleanPhone = data.phone.replace(/[\s\-\(\)\+]/g, "");
      if (!/^\d{10,15}$/.test(cleanPhone)) {
        throw new ValidationError("Phone must be 10-15 digits", "phone");
      }

      // Check for duplicate phone (only for creates or when phone is changing)
      if ("name" in data) {
        // This is a create operation
        const existing = await this.db.getFirstAsync(
          "SELECT id FROM customers WHERE phone = ? LIMIT 1",
          [data.phone]
        );
        if (existing) {
          throw new DuplicateError("phone", data.phone);
        }
      }
    }

    // Email validation
    if ("email" in data && data.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new ValidationError("Invalid email format", "email");
      }
    }

    // Business validation rules
    if ("company" in data && data.company && !data.jobTitle) {
      console.warn(
        "Business customer without job title - consider adding for better records"
      );
    }
  }

  async validateProduct(
    data: CreateProductInput | UpdateProductInput
  ): Promise<void> {
    // Name validation
    if ("name" in data) {
      if (!data.name?.trim()) {
        throw new ValidationError("Product name is required", "name");
      }
      if (data.name.length > 200) {
        throw new ValidationError(
          "Product name cannot exceed 200 characters",
          "name"
        );
      }
    }

    // Price validation
    if ("price" in data) {
      if (typeof data.price !== "number" || data.price < 0) {
        throw new ValidationError(
          "Price must be a non-negative number",
          "price"
        );
      }
      if (data.price > 1000000) {
        throw new ValidationError("Price seems unusually high", "price");
      }
    }

    // Cost price validation
    if ("costPrice" in data && typeof data.costPrice === "number") {
      if (data.costPrice < 0) {
        throw new ValidationError(
          "Cost price must be non-negative",
          "costPrice"
        );
      }
    }

    // Stock validation
    if ("stockQuantity" in data) {
      if (typeof data.stockQuantity !== "number" || data.stockQuantity < 0) {
        throw new ValidationError(
          "Stock quantity must be non-negative",
          "stockQuantity"
        );
      }
    }

    // SKU validation and duplicate check
    if ("sku" in data && data.sku?.trim()) {
      if (data.sku.length > 50) {
        throw new ValidationError("SKU cannot exceed 50 characters", "sku");
      }

      // Check for duplicate SKU (only for creates or when SKU is changing)
      if ("name" in data) {
        // This is a create operation
        const existing = await this.db.getFirstAsync(
          "SELECT id FROM products WHERE sku = ? LIMIT 1",
          [data.sku]
        );
        if (existing) {
          throw new DuplicateError("sku", data.sku);
        }
      }
    }

    // Business rules
    if (
      "price" in data &&
      "costPrice" in data &&
      typeof data.price === "number" &&
      typeof data.costPrice === "number"
    ) {
      if (data.price < data.costPrice) {
        throw new BusinessRuleError(
          "Selling price should not be less than cost price",
          "price_below_cost",
          { price: data.price, costPrice: data.costPrice }
        );
      }
    }
  }

  async validateTransaction(
    data: CreateTransactionInput | UpdateTransactionInput
  ): Promise<void> {
    // Amount validation
    if ("amount" in data) {
      if (typeof data.amount !== "number" || isNaN(data.amount)) {
        throw new ValidationError("Amount must be a valid number", "amount");
      }

      if (data.amount < 0) {
        throw new ValidationError("Amount cannot be negative", "amount");
      }

      if (data.amount === 0 && data.type === "sale") {
        throw new ValidationError("Sale amount cannot be zero", "amount");
      }

      if (data.amount > 1000000) {
        throw new ValidationError("Amount seems unusually high", "amount");
      }
    }

    // Type validation
    if ("type" in data && data.type) {
      const validTypes = ["sale", "refund", "payment", "adjustment"];
      if (!validTypes.includes(data.type)) {
        throw new ValidationError("Invalid transaction type", "type");
      }
    }

    // Date validation
    if ("date" in data && data.date) {
      const date = new Date(data.date);
      if (isNaN(date.getTime())) {
        throw new ValidationError("Invalid date format", "date");
      }

      // Don't allow future dates
      if (date > new Date()) {
        throw new ValidationError(
          "Transaction date cannot be in the future",
          "date"
        );
      }
    }

    // Customer existence validation
    if ("customerId" in data && data.customerId) {
      const customer = await this.db.getFirstAsync(
        "SELECT id FROM customers WHERE id = ? LIMIT 1",
        [data.customerId]
      );
      if (!customer) {
        throw new ValidationError(
          `Customer with ID ${data.customerId} does not exist`,
          "customerId"
        );
      }
    }

    // Business rules for refunds
    if (data.type === "refund" && "customerId" in data && data.customerId) {
      const customerTotal = await this.db.getFirstAsync<{ total: number }>(
        "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE customerId = ? AND type = 'sale'",
        [data.customerId]
      );

      if (data.amount && (customerTotal?.total || 0) < data.amount) {
        throw new BusinessRuleError(
          "Refund amount cannot exceed customer's total purchases",
          "refund_exceeds_purchases",
          {
            refundAmount: data.amount,
            customerTotal: customerTotal?.total || 0,
          }
        );
      }
    }
  }

  async validateStoreConfig(data: any): Promise<void> {
    if (
      "storeName" in data &&
      (!data.storeName?.trim() || data.storeName.length > 100)
    ) {
      throw new ValidationError(
        "Store name is required and cannot exceed 100 characters",
        "storeName"
      );
    }

    if (
      "currency" in data &&
      data.currency &&
      !/^[A-Z]{3}$/.test(data.currency)
    ) {
      throw new ValidationError(
        "Currency must be a 3-letter code (e.g., USD, EUR)",
        "currency"
      );
    }

    if (
      "primaryColor" in data &&
      data.primaryColor &&
      !/^#[0-9A-Fa-f]{6}$/.test(data.primaryColor)
    ) {
      throw new ValidationError(
        "Primary color must be a valid hex color",
        "primaryColor"
      );
    }
  }
}
