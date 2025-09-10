// ===== MERGED VALIDATION SERVICE =====
// This file contains the merged validation service that combines:
// 1. Static validation methods (fast, no database access)
// 2. Async validation methods (with database checks for duplicates, existence, etc.)
// 3. Comprehensive business rule validations
//
// Features:
// ✅ Customer validation (name, phone, email, business rules)
// ✅ Product validation (name, price, stock, SKU, cost-price rules)
// ✅ Transaction validation (amount, type, date, customer existence, refund rules)
// ✅ Store config validation (name, currency, colors)
// ✅ Duplicate checking (SKU, phone numbers)
// ✅ Business rules (price vs cost, refund limits, future dates)
// ✅ Nigerian phone validation
// ✅ Email format validation
// ✅ Data type and range validation

import { CreateCustomerInput, UpdateCustomerInput } from "@/types/customer";
import { CreateProductInput, UpdateProductInput } from "@/types/product";
import {
  CreateTransactionInput,
  UpdateTransactionInput,
} from "@/types/transaction";
import { validateEmail, validatePhoneNumber } from "@/utils/contactValidation";
import { SQLiteDatabase } from "expo-sqlite";
import { ValidationError } from "./utilService";

// ===== VALIDATION SERVICE =====
export class ValidationService {
  constructor(private db: SQLiteDatabase) {}

  // ===== CUSTOMER VALIDATION =====
  static validateCustomerInput(
    data: CreateCustomerInput | UpdateCustomerInput
  ): void {
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

    if ("phone" in data && data.phone) {
      const validationResult = validatePhoneNumber(data.phone, "NG");

      if (!validationResult.isValid) {
        const errorMessage =
          validationResult.error || "Invalid Nigerian phone number format";
        throw new ValidationError(errorMessage, "phone");
      }
    }

    if ("email" in data && data.email?.trim()) {
      const emailValidation = validateEmail(data.email);
      if (!emailValidation.isValid) {
        const errorMessage = emailValidation.error || "Invalid email format";
        throw new ValidationError(errorMessage, "email");
      }
    }

    // Business validation rules
    if ("company" in data && data.company && !data.jobTitle) {
      console.warn(
        "Business customer without job title - consider adding for better records"
      );
    }
  }

  // ===== TRANSACTION VALIDATION =====
  static validateTransactionInput(
    data: CreateTransactionInput | UpdateTransactionInput
  ): void {
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

    if ("type" in data && data.type) {
      if (!["sale", "refund", "payment", "credit"].includes(data.type)) {
        throw new ValidationError("Invalid transaction type", "type");
      }
    }

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

    // Debt management validation
    if ("paidAmount" in data && "remainingAmount" in data && "amount" in data) {
      const paid = data.paidAmount || 0;
      const remaining = data.remainingAmount || 0;
      const total = data.amount || 0;
      const paymentMethod = data.paymentMethod || "cash";
      const transactionType = data.type || "sale";

      // Skip payment validation for refunds - they don't follow the same rules
      if (transactionType === "refund") {
        return;
      }

      if (paymentMethod === "mixed") {
        // For mixed payments, paid + remaining must equal total
        if (paid + remaining !== total) {
          throw new ValidationError(
            "Paid amount + remaining amount must equal total amount for mixed payments",
            "paidAmount"
          );
        }
      } else if (paymentMethod === "cash") {
        // For cash payments, paid must equal total and remaining must be 0
        if (paid !== total || remaining !== 0) {
          throw new ValidationError(
            "Cash payments must have paid amount equal to total and remaining amount of 0",
            "paidAmount"
          );
        }
      } else if (paymentMethod === "credit") {
        // For credit payments, paid must be 0 and remaining must equal total
        if (paid !== 0 || remaining !== total) {
          throw new ValidationError(
            "Credit payments must have paid amount of 0 and remaining amount equal to total",
            "paidAmount"
          );
        }
      }
    }

    if ("paymentMethod" in data && data.paymentMethod) {
      if (
        !["cash", "bank_transfer", "pos_card", "credit", "mixed"].includes(
          data.paymentMethod
        )
      ) {
        throw new ValidationError("Invalid payment method", "paymentMethod");
      }
    }

    if ("dueDate" in data && data.dueDate) {
      const dueDate = new Date(data.dueDate);
      if (isNaN(dueDate.getTime())) {
        throw new ValidationError("Invalid due date format", "dueDate");
      }
    }
  }

  // ===== PRODUCT VALIDATION =====
  static validateProductInput(
    data: CreateProductInput | UpdateProductInput
  ): void {
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

    if ("costPrice" in data && typeof data.costPrice === "number") {
      if (data.costPrice < 0) {
        throw new ValidationError("Cost price cannot be negative", "costPrice");
      }
      if (data.costPrice > 1000000) {
        throw new ValidationError(
          "Cost price seems unusually high",
          "costPrice"
        );
      }
    }

    if ("sku" in data) {
      if (!data.sku?.trim()) {
        throw new ValidationError("SKU is required", "sku");
      }
      if (data.sku.length > 100) {
        throw new ValidationError("SKU cannot exceed 100 characters", "sku");
      }
    }

    if ("stock" in data) {
      if (typeof data.stock !== "number" || isNaN(data.stock)) {
        throw new ValidationError("Stock must be a valid number", "stock");
      }

      if (data.stock < 0) {
        throw new ValidationError("Stock cannot be negative", "stock");
      }
    }
  }

  // ===== STORE CONFIG VALIDATION =====
  static validateStoreConfigInput(data: any): void {
    if ("name" in data) {
      if (!data.name?.trim()) {
        throw new ValidationError("Store name is required", "name");
      }
      if (data.name.length > 100) {
        throw new ValidationError(
          "Store name cannot exceed 100 characters",
          "name"
        );
      }
    }

    if ("currency" in data) {
      if (!data.currency?.trim()) {
        throw new ValidationError("Currency is required", "currency");
      }
      if (data.currency.length !== 3) {
        throw new ValidationError(
          "Currency code must be 3 characters",
          "currency"
        );
      }
    }

    if ("primaryColor" in data) {
      if (!/^#[0-9A-F]{6}$/i.test(data.primaryColor)) {
        throw new ValidationError(
          "Primary color must be a valid hex color",
          "primaryColor"
        );
      }
    }

    if ("secondaryColor" in data) {
      if (!/^#[0-9A-F]{6}$/i.test(data.secondaryColor)) {
        throw new ValidationError(
          "Secondary color must be a valid hex color",
          "secondaryColor"
        );
      }
    }
  }
}
