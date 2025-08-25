export interface Transaction {
  id: string;
  customerId: string;
  amount: number;
  description?: string;
  date: string;
  type: "sale" | "payment" | "refund";
}

export interface CreateTransactionInput {
  customerId: string;
  amount: number;
  description?: string;
  date: string;
  type: "sale" | "payment" | "refund";
}
