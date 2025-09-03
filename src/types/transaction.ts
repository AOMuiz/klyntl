export interface Transaction {
  id: string;
  customerId: string;
  productId?: string;
  amount: number;
  description?: string;
  date: string;
  type: "sale" | "payment" | "refund";
}

export interface CreateTransactionInput {
  customerId: string;
  productId?: string;
  amount: number;
  description?: string;
  date: string;
  type: "sale" | "payment" | "refund";
}

export interface UpdateTransactionInput {
  productId?: string;
  amount?: number;
  description?: string;
  date?: string;
  type?: "sale" | "payment" | "refund";
}
