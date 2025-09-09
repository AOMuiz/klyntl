import { PaymentMethod, TransactionType } from "@/types/transaction";

export const getTransactionTypeDescriptions = (): Record<string, string> => ({
  sale: "🛒 Customer bought goods/services - Record what they purchased",
  payment:
    "💰 Customer gave you money - Can pay off debt or prepay for future purchases",
  credit:
    "📝 Customer borrowed goods/money - They will pay later (creates debt)",
  refund:
    "↩️ Return money to customer - For returns, cancellations, or overpayments",
});

export const getPaymentMethodDescriptions = (): Record<string, string> => ({
  cash: "💵 Customer paid full amount in cash right now",
  bank_transfer: "🏦 Customer sent money via bank transfer or mobile banking",
  pos_card: "💳 Customer paid with debit/credit card using POS machine",
  credit: "📝 Customer will pay later - No money received yet (creates debt)",
  mixed: "🔄 Customer paid some cash now, owes the rest (partial payment)",
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
