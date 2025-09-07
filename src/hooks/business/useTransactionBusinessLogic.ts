import { QUERY_KEYS } from "@/constants/queryKeys";
import { createDatabaseService } from "@/services/database";
import { useDatabase } from "@/services/database/hooks";
import {
  PaymentMethod,
  TransactionStatus,
  TransactionType,
} from "@/types/transaction";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const databaseService = db ? createDatabaseService(db) : undefined;

  // Get current customer debt from backend
  const { data: currentCustomerDebt = 0 } = useQuery({
    queryKey: QUERY_KEYS.customerDebt.detail(customerId),
    queryFn: async () => {
      if (!customerId || !db || !databaseService) return 0;

      try {
        return await databaseService.customers.getOutstandingBalance(
          customerId
        );
      } catch (error) {
        console.error("Failed to get customer debt:", error);
        return 0;
      }
    },
    enabled: !!customerId && !!db && !!databaseService,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  // Use PaymentService for debt calculations
  const calculateNewDebt = () => {
    if (!databaseService?.payment || !amount) return currentCustomerDebt;

    if (type === "payment" && appliedToDebt) {
      const paymentAmount = parseFloat(amount || "0");
      if (paymentAmount <= 0) return currentCustomerDebt;

      // Use PaymentService logic for debt calculation
      return Math.max(0, currentCustomerDebt - paymentAmount);
    }
    return currentCustomerDebt;
  };

  const shouldShowDebtPreview = () => {
    return type === "payment" && appliedToDebt === true && amount;
  };

  const shouldShowFutureServiceNote = () => {
    return type === "payment" && appliedToDebt === false;
  };

  // Enhanced transaction data formatting with PaymentService validation
  const formatTransactionData = (data: any) => {
    // Validate and parse amount
    const parsedAmount = parseFloat(data.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error("Invalid amount provided");
    }

    // Handle credit transactions differently - no payment received
    let finalPaymentMethod: PaymentMethod;
    let paidAmount: number | undefined;
    let remainingAmount: number | undefined;

    if (data.type === "credit") {
      // For credit transactions, no payment is received
      finalPaymentMethod = "credit";
      paidAmount = 0; // Fixed: Credit transactions should have 0 paid amount
      remainingAmount = parsedAmount; // Full amount becomes outstanding debt
    } else {
      finalPaymentMethod = data.paymentMethod;

      // Set paidAmount and remainingAmount based on payment method
      if (finalPaymentMethod === "cash") {
        // For cash payments, automatically set paidAmount to full amount
        paidAmount = parsedAmount;
        remainingAmount = 0;
      } else if (finalPaymentMethod === "mixed") {
        paidAmount = data.paidAmount ? parseFloat(data.paidAmount) : 0;
        remainingAmount = data.remainingAmount
          ? parseFloat(data.remainingAmount)
          : parsedAmount;
      } else if (finalPaymentMethod === "credit") {
        paidAmount = 0;
        remainingAmount = parsedAmount;
      } else {
        // For other payment methods (bank_transfer, pos_card, etc.)
        paidAmount = parsedAmount;
        remainingAmount = 0;
      }
    }

    // Use PaymentService to calculate proper transaction status
    let calculatedStatus: TransactionStatus = "pending";
    if (databaseService?.payment) {
      calculatedStatus = databaseService.payment.calculateTransactionStatus(
        data.type,
        finalPaymentMethod,
        parsedAmount,
        paidAmount || 0,
        remainingAmount || 0
      ) as TransactionStatus;
    }

    return {
      customerId: data.customerId,
      amount: parsedAmount,
      description: data.description?.trim() || undefined,
      date: format(data.date, "yyyy-MM-dd"),
      type: data.type,
      paymentMethod: finalPaymentMethod,
      paidAmount: paidAmount,
      remainingAmount: remainingAmount,
      dueDate: data.dueDate ? format(data.dueDate, "yyyy-MM-dd") : undefined,
      appliedToDebt: data.appliedToDebt,
      status: calculatedStatus, // Now properly typed as TransactionStatus
    };
  };

  // Function to invalidate customer debt queries
  const invalidateCustomerDebt = (customerIdToInvalidate?: string) => {
    const targetCustomerId = customerIdToInvalidate || customerId;
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.customerDebt.detail(targetCustomerId),
    });
  };

  // Function to invalidate all customer-related queries
  const invalidateCustomerRelatedQueries = (
    customerIdToInvalidate?: string
  ) => {
    const targetCustomerId = customerIdToInvalidate || customerId;

    // Invalidate customer debt
    invalidateCustomerDebt(targetCustomerId);

    // Invalidate customer details
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.customers.detail(targetCustomerId),
    });

    // Invalidate customer lists (to update totals)
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.customers.all(),
    });

    // Invalidate transaction lists for this customer
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.transactions.list(targetCustomerId),
    });

    // Invalidate all transactions (for global lists)
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.transactions.all(),
    });

    // Invalidate analytics
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.analytics.all(),
    });
  };

  return {
    currentCustomerDebt,
    calculateNewDebt,
    shouldShowDebtPreview,
    shouldShowFutureServiceNote,
    formatTransactionData,
    invalidateCustomerDebt,
    invalidateCustomerRelatedQueries,
  };
};
