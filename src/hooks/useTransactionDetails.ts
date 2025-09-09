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

  // Load credit balance and payment history
  useEffect(() => {
    if (transaction && db && customerId) {
      const loadTransactionDetails = async () => {
        setIsLoadingDetails(true);
        try {
          const databaseService = createDatabaseService(db);

          // Get credit balance using service
          const balance = await databaseService.simplePayment.getCreditBalance(
            customerId
          );
          setCreditBalance(balance);

          // Get payment history using service
          const history = await databaseService.simplePayment.getPaymentHistory(
            customerId,
            10
          );
          setPaymentHistory(history);
        } catch (err) {
          console.error("Failed to load transaction details:", err);
        } finally {
          setIsLoadingDetails(false);
        }
      };

      loadTransactionDetails();
    }
  }, [transaction, db, customerId]);

  // Use the debt impact calculator from SimpleTransactionCalculator
  const calculateDebtImpact = (tx: any) => {
    const impact = SimpleTransactionCalculator.calculateDebtImpact(
      tx.type,
      tx.paymentMethod || "cash",
      tx.amount,
      tx.appliedToDebt
    );

    // Return the signed change value
    return impact.isDecrease ? -impact.change : impact.change;
  };

  // Compute running balance before/after this transaction
  const computeRunningBalances = () => {
    if (!allCustomerTxns || allCustomerTxns.length === 0) {
      const impact = calculateDebtImpact(transaction);
      return { before: 0, after: impact };
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
    const after = before + impact;
    return { before, after };
  };

  return {
    creditBalance,
    paymentHistory,
    isLoadingDetails,
    calculateDebtImpact,
    computeRunningBalances,
  };
};
