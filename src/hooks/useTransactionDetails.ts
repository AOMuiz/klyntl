import { SimpleTransactionCalculator } from "@/services/calculations/SimpleTransactionCalculator";
import { createDatabaseService } from "@/services/database";
import { useDatabase } from "@/services/database/hooks";
import { useEffect, useState } from "react";

interface UseTransactionDetailsProps {
  transaction: any;
  customerId?: string;
  allCustomerTxns: any[];
}

export const useTransactionDetails = ({
  transaction,
  customerId,
  allCustomerTxns,
}: UseTransactionDetailsProps) => {
  const { db } = useDatabase();
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Load credit balance and payment history using centralized services only
  useEffect(() => {
    if (transaction && db && customerId) {
      const loadTransactionDetails = async () => {
        setIsLoadingDetails(true);
        try {
          const databaseService = createDatabaseService(db);

          // Use SimplePaymentService as single source of truth - no direct SQL queries
          const balance = await databaseService.simplePayment.getCreditBalance(
            customerId
          );
          setCreditBalance(balance);

          // Get payment history using SimplePaymentService - no direct SQL queries
          const history = await databaseService.simplePayment.getPaymentHistory(
            customerId,
            10
          );
          setPaymentHistory(history);
        } catch (err) {
          console.error("Failed to load transaction details:", err);
          // Set safe fallback values for Nigerian SME context
          setCreditBalance(0);
          setPaymentHistory([]);
        } finally {
          setIsLoadingDetails(false);
        }
      };

      loadTransactionDetails();
    }
  }, [transaction, db, customerId]);

  // Use SimpleTransactionCalculator as single source of truth for debt calculations
  const calculateDebtImpact = (tx: any) => {
    const impact = SimpleTransactionCalculator.calculateDebtImpact(
      tx.type,
      tx.paymentMethod || "cash",
      tx.amount,
      tx.appliedToDebt
    );

    // Return the signed change value for Nigerian SME context
    // Positive = customer owes more, Negative = customer owes less
    return impact.isDecrease ? -impact.change : impact.change;
  };

  // Compute running balance before/after this transaction
  // Returns clamped values and creditCreated to avoid showing negative outstanding
  const computeRunningBalances = () => {
    if (!allCustomerTxns || allCustomerTxns.length === 0) {
      const impact = calculateDebtImpact(transaction);
      const rawAfter = impact;
      const after = Math.max(0, rawAfter);
      const creditCreated = Math.max(0, -rawAfter);
      return { before: 0, after, rawAfter, creditCreated };
    }

    // Sort ascending by date so accumulation progresses forward in time
    const sorted = [...allCustomerTxns].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let running = 0;
    let before = 0;
    for (const tx of sorted) {
      if (tx.id === transaction.id) {
        before = running;
        break;
      }
      running += calculateDebtImpact(tx);
    }

    const impact = calculateDebtImpact(transaction);
    const rawAfter = before + impact;

    // Clamp to avoid negative outstanding; excess becomes creditCreated
    const after = Math.max(0, rawAfter);
    const creditCreated = Math.max(0, -rawAfter);

    return { before, after, rawAfter, creditCreated };
  };

  return {
    creditBalance,
    paymentHistory,
    isLoadingDetails,
    calculateDebtImpact,
    computeRunningBalances,
  };
};
