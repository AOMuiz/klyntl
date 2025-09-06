import { PaymentMethod, TransactionType } from "@/types/transaction";

export interface TransactionFormData {
  customerId: string;
  amount: string;
  description: string;
  date: Date;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  paidAmount: string;
  remainingAmount: string;
  dueDate: Date | null;
  appliedToDebt?: boolean;
}

export interface TransactionFormProps {
  customerId?: string;
  initialData?: Partial<TransactionFormData>;
  transactionId?: string;
}
