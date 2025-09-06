import { createDatabaseService } from "@/services/database";
import { useDatabase } from "@/services/database/hooks";
import { PaymentMethod, TransactionType } from "@/types/transaction";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface UseTransactionBusinessLogicProps {
  customerId: string;
  amount: string;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  appliedToDebt?: boolean;
}

export const useTransactionBusinessLogic = ({
  customerId,
  amount,
  type,
  paymentMethod,
  appliedToDebt,
}: UseTransactionBusinessLogicProps) => {
  const { db } = useDatabase();

  // Get current customer debt from backend
  const { data: currentCustomerDebt = 0 } = useQuery({
    queryKey: ["customer-debt", customerId],
    queryFn: async () => {
      if (!customerId || !db) return 0;

      try {
        const databaseService = createDatabaseService(db);
        return await databaseService.customers.getOutstandingBalance(
          customerId
        );
      } catch (error) {
        console.error("Failed to get customer debt:", error);
        return 0;
      }
    },
    enabled: !!customerId && !!db,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  const calculateNewDebt = () => {
    if (type === "payment" && appliedToDebt && amount) {
      return Math.max(0, currentCustomerDebt - parseFloat(amount || "0"));
    }
    return currentCustomerDebt;
  };

  const shouldShowDebtPreview = () => {
    return type === "payment" && appliedToDebt === true && amount;
  };

  const shouldShowFutureServiceNote = () => {
    return type === "payment" && appliedToDebt === false;
  };

  const formatTransactionData = (data: any) => {
    // Handle credit transactions differently - no payment received
    let finalPaymentMethod: PaymentMethod;
    let paidAmount: number | undefined;
    let remainingAmount: number | undefined;

    if (data.type === "credit") {
      // For credit transactions, no payment is received
      finalPaymentMethod = "credit";
      paidAmount = 0;
      remainingAmount = parseFloat(data.amount);
    } else {
      finalPaymentMethod = data.paymentMethod;
      paidAmount = data.paidAmount ? parseFloat(data.paidAmount) : undefined;
      remainingAmount = data.remainingAmount
        ? parseFloat(data.remainingAmount)
        : undefined;
    }

    return {
      customerId: data.customerId,
      amount: parseFloat(data.amount),
      description: data.description.trim() || undefined,
      date: format(data.date, "yyyy-MM-dd"),
      type: data.type,
      paymentMethod: finalPaymentMethod,
      paidAmount: paidAmount,
      remainingAmount: remainingAmount,
      dueDate: data.dueDate ? format(data.dueDate, "yyyy-MM-dd") : undefined,
      appliedToDebt: data.appliedToDebt,
    };
  };

  return {
    currentCustomerDebt,
    calculateNewDebt,
    shouldShowDebtPreview,
    shouldShowFutureServiceNote,
    formatTransactionData,
  };
};
