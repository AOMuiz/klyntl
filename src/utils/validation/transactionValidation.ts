import { PaymentMethod, TransactionType } from "@/types/transaction";

export const validateAmount = (amount: string) => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return "Please enter a valid amount greater than 0";
  }
  return true;
};

export const validateMixedPayment = (
  paymentMethod: PaymentMethod,
  paidAmount: string,
  totalAmount: string
) => {
  if (paymentMethod === "mixed") {
    if (!paidAmount) {
      return "Amount paid is required for mixed payments";
    }
    const numPaid = parseFloat(paidAmount);
    if (isNaN(numPaid) || numPaid <= 0) {
      return "Please enter a valid amount greater than 0";
    }
    const numTotal = parseFloat(totalAmount);
    if (numPaid >= numTotal) {
      return "Amount paid must be less than total amount";
    }
  }
  return true;
};

export const validateAppliedToDebt = (
  type: TransactionType,
  appliedToDebt: boolean | undefined
) => {
  if (type === "payment" && appliedToDebt === undefined) {
    return "Please specify how to apply this payment";
  }
  return true;
};
