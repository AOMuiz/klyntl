export interface Transaction {
  id: string;
  customerId: string;
  productId?: string;
  amount: number; // Amount in kobo (smallest currency unit)
  description?: string;
  date: string;
  type: "sale" | "payment" | "credit" | "refund";
  // Debt management fields
  paymentMethod?: "cash" | "bank_transfer" | "pos_card" | "credit" | "mixed";
  paidAmount?: number; // Amount paid immediately (in kobo)
  remainingAmount?: number; // Amount remaining as debt (in kobo)
  status?: "pending" | "completed" | "partial" | "cancelled";
  linkedTransactionId?: string; // Links payments to original sales/credits
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
  type: "sale" | "payment" | "credit" | "refund";
  // Debt management fields
  paymentMethod?: "cash" | "bank_transfer" | "pos_card" | "credit" | "mixed";
  paidAmount?: number; // Amount paid immediately (in kobo)
  remainingAmount?: number; // Amount remaining as debt (in kobo)
  linkedTransactionId?: string;
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
  type?: "sale" | "payment" | "credit" | "refund";
  // Debt management fields
  paymentMethod?: "cash" | "bank_transfer" | "pos_card" | "credit" | "mixed";
  paidAmount?: number; // Amount paid immediately (in kobo)
  remainingAmount?: number; // Amount remaining as debt (in kobo)
  status?: "pending" | "completed" | "partial" | "cancelled";
  linkedTransactionId?: string;
  dueDate?: string;
  currency?: string;
  exchangeRate?: number;
  metadata?: string;
  isDeleted?: boolean;
}
