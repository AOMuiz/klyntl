export type TransactionType = "sale" | "payment" | "credit" | "refund";
// "credit_loan"

export type TransactionStatus =
  | "pending"
  | "completed"
  | "partial"
  | "cancelled";

export type PaymentMethod =
  | "cash"
  | "bank_transfer"
  | "pos_card"
  | "credit" // update later to "credit_debt"
  | "mixed"; //update later to  mixed_payment;

export interface Transaction {
  id: string;
  customerId: string;
  productId?: string;
  amount: number; // Amount in kobo (smallest currency unit)
  description?: string;
  date: string;
  type: TransactionType;
  // Debt management fields
  paymentMethod?: PaymentMethod;
  paidAmount?: number; // Amount paid immediately (in kobo)
  remainingAmount?: number; // Amount remaining as debt (in kobo)
  status?: TransactionStatus;
  linkedTransactionId?: string; // Links payments to original sales/credits
  appliedToDebt?: boolean; // For payments - whether it was applied to existing debt
  dueDate?: string; // For credit transactions
  currency?: string; // Default 'NGN'
  exchangeRate?: number; // For multi-currency support
  metadata?: string; // JSON string for additional data
  isDeleted?: boolean;
}

export interface CreateTransactionInput {
  customerId: string;
  productId?: string;
  amount: number; // Amount in kobo
  description?: string;
  date: string;
  type: TransactionType;
  // Debt management fields
  paymentMethod?: PaymentMethod;
  paidAmount?: number; // Amount paid immediately (in kobo)
  remainingAmount?: number; // Amount remaining as debt (in kobo)
  linkedTransactionId?: string;
  appliedToDebt?: boolean; // For payments - whether it was applied to existing debt
  dueDate?: string;
  currency?: string;
  exchangeRate?: number;
  metadata?: string;
}

export interface UpdateTransactionInput {
  productId?: string;
  amount?: number; // Amount in kobo
  description?: string;
  date?: string;
  type?: TransactionType;
  // Debt management fields
  paymentMethod?: PaymentMethod;
  paidAmount?: number; // Amount paid immediately (in kobo)
  remainingAmount?: number; // Amount remaining as debt (in kobo)
  status?: TransactionStatus;
  linkedTransactionId?: string;
  appliedToDebt?: boolean; // For payments - whether it was applied to existing debt
  dueDate?: string;
  currency?: string;
  exchangeRate?: number;
  metadata?: string;
  isDeleted?: boolean;
}
