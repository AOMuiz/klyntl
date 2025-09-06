import { PaymentMethod, TransactionType } from "@/types/transaction";

export const getTransactionTypeDescriptions = (): Record<string, string> => ({
  sale: "Sale: The customer is making a purchase.",
  payment: "Payment: The customer is paying for a previous purchase or debt.",
  credit:
    "Credit: Issuing a loan or credit to the customer (no payment method required).",
  refund: "Refund: Money is being returned to the customer.",
});

export const getPaymentMethodDescriptions = (): Record<string, string> => ({
  cash: "Cash: Full payment received in cash.",
  bank_transfer: "Bank Transfer: Payment received via bank transfer.",
  pos_card: "POS Card: Payment received via card (POS).",
  credit: "Credit: Payment is deferred, customer owes an outstanding balance.",
  mixed: "Mixed: Partial payment received, with some amount left as credit.",
});

export const calculateRemainingAmount = (
  totalAmount: string,
  paidAmount: string
): string => {
  const total = parseFloat(totalAmount);
  const paid = parseFloat(paidAmount);
  const remaining = Math.max(0, total - paid);
  return remaining.toString();
};

export const getDefaultValuesForTransactionType = (
  type: TransactionType,
  currentAmount: string
) => {
  switch (type) {
    case "credit":
      return {
        paidAmount: currentAmount,
        remainingAmount: "0",
        appliedToDebt: false,
        paymentMethod: "credit" as PaymentMethod,
      };
    case "refund":
      return {
        paidAmount: "0",
        remainingAmount: currentAmount,
        appliedToDebt: true,
        paymentMethod: "cash" as PaymentMethod,
      };
    default:
      return {
        paidAmount: "",
        remainingAmount: "",
        appliedToDebt: true,
        paymentMethod: "cash" as PaymentMethod,
      };
  }
};
