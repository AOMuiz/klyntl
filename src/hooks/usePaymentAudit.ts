import { createDatabaseService } from "@/services/database";
import { useDatabase } from "@/services/database/hooks";
import { useQuery } from "@tanstack/react-query";

// Lightweight hook to read payment_audit for a customer
export function usePaymentAudit(customerId?: string) {
  const { db } = useDatabase();
  const databaseService = db ? createDatabaseService(db) : undefined;

  return useQuery({
    queryKey: ["paymentAudit", customerId],
    queryFn: async () => {
      if (!customerId) return [];

      // Always use the DatabaseService payment API - no direct DB queries
      if (databaseService?.payment?.getPaymentHistory) {
        try {
          return await databaseService.payment.getPaymentHistory(customerId);
        } catch (err) {
          console.warn("Failed to load payment_audit via service:", err);
          return [];
        }
      }

      // If service is not available, return empty array rather than direct DB query
      console.warn("Payment service not available for audit history");
      return [];
    },
    enabled: !!customerId && !!databaseService,
    staleTime: 60 * 1000,
  });
}

// Enhanced hook for comprehensive payment status of a specific transaction
// @deprecated - SimplePaymentService doesn't track per-transaction status
// Use the transaction's status field directly instead
export function useTransactionPaymentStatus(transactionId?: string) {
  const { db } = useDatabase();

  return useQuery({
    queryKey: ["transactionPaymentStatus", transactionId],
    queryFn: async () => {
      if (!transactionId || !db) return null;

      // Simplified approach: get transaction status directly from transaction table
      try {
        const result = await db.getFirstAsync<{
          status: string;
          paidAmount: number;
          remainingAmount: number;
          amount: number;
        }>(
          "SELECT status, paidAmount, remainingAmount, amount FROM transactions WHERE id = ?",
          [transactionId]
        );

        return result
          ? {
              status: result.status,
              paidAmount: result.paidAmount,
              remainingAmount: result.remainingAmount,
              totalAmount: result.amount,
              percentagePaid:
                result.amount > 0
                  ? (result.paidAmount / result.amount) * 100
                  : 0,
            }
          : null;
      } catch (error) {
        console.warn("Failed to get transaction payment status:", error);
        return null;
      }
    },
    enabled: !!transactionId && !!db,
    staleTime: 30 * 1000,
  });
}

// Hook for customer's debt summary
export function useCustomerDebtStatus(customerId?: string) {
  const { db } = useDatabase();
  const databaseService = db ? createDatabaseService(db) : undefined;

  return useQuery({
    queryKey: ["customerDebtStatus", customerId],
    queryFn: async () => {
      if (!customerId) return null;

      // Use service layer for data access
      if (databaseService?.customers && databaseService?.transactions) {
        try {
          // Get customer details via service
          const customer = await databaseService.customers.findById(customerId);
          if (!customer) return null;

          // Get transactions via service
          const transactions =
            await databaseService.transactions.findByCustomerId(customerId);

          // Filter for pending/partial debts
          const pendingDebts = transactions
            .filter(
              (tx: any) =>
                (tx.type === "sale" || tx.type === "credit") &&
                (tx.remainingAmount || 0) > 0 &&
                tx.status !== "cancelled"
            )
            .sort(
              (a: any, b: any) =>
                new Date(a.date).getTime() - new Date(b.date).getTime()
            );

          // Get recent payments
          const recentPayments = transactions
            .filter((tx: any) => tx.type === "payment")
            .sort(
              (a: any, b: any) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            )
            .slice(0, 5);

          // Calculate overdue amounts
          const now = new Date();
          const overdueDebts = pendingDebts.filter((debt: any) => {
            if (!debt.dueDate) return false;
            return new Date(debt.dueDate) < now;
          });

          const totalOverdue = overdueDebts.reduce(
            (sum: number, debt: any) => sum + (debt.remainingAmount || 0),
            0
          );

          return {
            customerId,
            outstandingBalance: customer.outstandingBalance || 0,
            creditBalance: customer.creditBalance || 0,
            totalDebts: pendingDebts.length,
            overdueAmount: totalOverdue,
            overdueCount: overdueDebts.length,
            pendingDebts,
            recentPayments,
            hasOutstandingDebt: (customer.outstandingBalance || 0) > 0,
            hasCredit: (customer.creditBalance || 0) > 0,
          };
        } catch (err) {
          console.warn("Failed to load customer debt status via service:", err);
          return null;
        }
      }

      console.warn("Database service not available for customer debt status");
      return null;
    },
    enabled: !!customerId && !!databaseService,
    staleTime: 60 * 1000,
  });
}

// Hook for payment processing operations
export function usePaymentOperations() {
  const { db } = useDatabase();
  const databaseService = db ? createDatabaseService(db) : undefined;

  const processPayment = async (
    customerId: string,
    paymentAmount: number,
    applyToDebt: boolean = true
  ) => {
    if (!databaseService?.payment?.handlePaymentAllocation) {
      throw new Error("Payment service not available");
    }
    return databaseService.payment.handlePaymentAllocation(
      customerId,
      paymentAmount,
      applyToDebt
    );
  };

  const processMixedPayment = async (
    customerId: string,
    cashAmount: number
  ) => {
    if (!databaseService?.payment?.processPayment) {
      throw new Error("Payment service not available");
    }
    // SimplePaymentService doesn't have mixed payment handling - use processPayment
    return databaseService.payment.processPayment({
      customerId,
      amount: cashAmount,
      paymentMethod: "cash",
      description: "Mixed payment (cash portion)",
    });
  };

  const applyCreditToSale = async (
    customerId: string,
    saleAmount: number,
    saleTxId: string
  ) => {
    if (!databaseService?.payment?.applyCreditToSale) {
      throw new Error("Payment service not available");
    }
    return databaseService.payment.applyCreditToSale(
      customerId,
      saleAmount,
      saleTxId
    );
  };

  const cancelTransaction = async (transactionId: string, reason?: string) => {
    // SimplePaymentService doesn't have cancel functionality - transactions are handled by TransactionRepository
    throw new Error(
      "Transaction cancellation should be handled through the transaction service, not payment service"
    );
  };

  return {
    processPayment,
    processMixedPayment,
    applyCreditToSale,
    cancelTransaction,
  };
}
