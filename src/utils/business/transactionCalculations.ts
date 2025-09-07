import { PaymentMethod, TransactionType } from "@/types/transaction";

export const getTransactionTypeDescriptions = (): Record<string, string> => ({
  sale: "Record a customer purchase or sale transaction",
  payment:
    "Record payment received from customer (can be applied to debt or saved for future service)",
  credit: "Issue credit or loan to customer (no immediate payment required)",
  refund: "Process a refund or return money to customer",
});

export const getPaymentMethodDescriptions = (): Record<string, string> => ({
  cash: "Full payment received in cash immediately",
  bank_transfer: "Payment received via bank transfer or online banking",
  pos_card: "Payment received via debit/credit card (POS terminal)",
  credit:
    "Payment deferred - customer will pay later (adds to outstanding balance)",
  mixed: "Partial payment now, remaining amount added to customer's debt",
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
        paidAmount: "0", // Fixed: Credit means no payment received, so paidAmount should be 0
        remainingAmount: currentAmount, // Full amount becomes debt
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
