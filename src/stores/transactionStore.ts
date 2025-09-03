import { create } from "zustand";
import { databaseService } from "../services/database/oldUnusedIndex";
import {
  CreateTransactionInput,
  Transaction,
  UpdateTransactionInput,
} from "../types/transaction";

// Helper function to invalidate analytics cache
const invalidateAnalyticsCache = () => {
  // Import analytics store dynamically to avoid circular dependency
  import("./analyticsStore").then(({ useAnalyticsStore }) => {
    const store = useAnalyticsStore.getState();
    store.reset(); // Reset analytics cache when transaction data changes
  });
};

interface TransactionStore {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchTransactions: (customerId?: string) => Promise<void>;
  getTransactionById: (id: string) => Promise<Transaction | null>;
  createTransaction: (transaction: CreateTransactionInput) => Promise<void>;
  updateTransaction: (
    id: string,
    updates: UpdateTransactionInput
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  transactions: [],
  loading: false,
  error: null,
};

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  ...initialState,

  fetchTransactions: async (customerId?: string) => {
    set({ loading: true, error: null });
    try {
      const transactions = customerId
        ? await databaseService.getTransactionsByCustomer(customerId)
        : await databaseService.getAllTransactions();
      set({ transactions, loading: false });
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      set({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch transactions",
      });
    }
  },

  getTransactionById: async (id: string) => {
    set({ error: null });
    try {
      const transaction = await databaseService.getTransactionById(id);
      return transaction;
    } catch (error) {
      console.error("Failed to get transaction:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to get transaction";
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  createTransaction: async (transactionData: CreateTransactionInput) => {
    set({ error: null });
    try {
      const newTransaction = await databaseService.createTransaction(
        transactionData
      );
      const { transactions } = get();
      set({ transactions: [newTransaction, ...transactions] });

      // Invalidate analytics cache since transaction data changed
      invalidateAnalyticsCache();
    } catch (error) {
      console.error("Failed to create transaction:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create transaction";
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  updateTransaction: async (id: string, updates: UpdateTransactionInput) => {
    set({ error: null });
    try {
      await databaseService.updateTransaction(id, updates);
      const { transactions } = get();
      const updatedTransactions = transactions.map((transaction) =>
        transaction.id === id ? { ...transaction, ...updates } : transaction
      );
      set({ transactions: updatedTransactions });
    } catch (error) {
      console.error("Failed to update transaction:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update transaction";
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  deleteTransaction: async (id: string) => {
    set({ error: null });
    try {
      await databaseService.deleteTransaction(id);
      const { transactions } = get();
      const filteredTransactions = transactions.filter(
        (transaction) => transaction.id !== id
      );
      set({ transactions: filteredTransactions });
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete transaction";
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));
