import { create } from "zustand";
import { databaseService } from "../services/database/oldUnusedIndex";
import { Analytics } from "../types/analytics";
import { Transaction } from "../types/transaction";

interface AnalyticsStore {
  analytics: Analytics | null;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  lastFetchTime: number;
  cacheTimeout: number; // Cache timeout in minutes

  // Actions
  fetchAnalytics: (forceRefresh?: boolean) => Promise<void>;
  fetchTransactions: (forceRefresh?: boolean) => Promise<void>;
  refreshAll: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  analytics: null,
  transactions: [],
  loading: false,
  error: null,
  lastFetchTime: 0,
  cacheTimeout: 5, // 5 minutes cache
};

export const useAnalyticsStore = create<AnalyticsStore>((set, get) => ({
  ...initialState,

  fetchAnalytics: async (forceRefresh: boolean = false) => {
    const { lastFetchTime, cacheTimeout, analytics } = get();
    const now = Date.now();
    const cacheExpired = now - lastFetchTime > cacheTimeout * 60 * 1000;

    // Skip fetch if we have cached data and cache hasn't expired (unless forced)
    if (!forceRefresh && analytics && !cacheExpired) {
      console.log("Using cached analytics data");
      return;
    }

    set({ loading: true, error: null });
    try {
      const analyticsData = await databaseService.getAnalytics();
      set({
        analytics: analyticsData,
        loading: false,
        lastFetchTime: now,
      });
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      set({
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch analytics",
      });
    }
  },

  fetchTransactions: async (forceRefresh: boolean = false) => {
    const { lastFetchTime, cacheTimeout, transactions } = get();
    const now = Date.now();
    const cacheExpired = now - lastFetchTime > cacheTimeout * 60 * 1000;

    // Skip fetch if we have cached data and cache hasn't expired (unless forced)
    if (!forceRefresh && transactions.length > 0 && !cacheExpired) {
      console.log("Using cached transaction data");
      return;
    }

    set({ loading: true, error: null });
    try {
      const transactionData = await databaseService.getAllTransactions();
      set({
        transactions: transactionData,
        loading: false,
        lastFetchTime: now,
      });
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

  refreshAll: async () => {
    set({ loading: true, error: null });
    try {
      const [analyticsData, transactionData] = await Promise.all([
        databaseService.getAnalytics(),
        databaseService.getAllTransactions(),
      ]);

      set({
        analytics: analyticsData,
        transactions: transactionData,
        loading: false,
        lastFetchTime: Date.now(),
      });
    } catch (error) {
      console.error("Failed to refresh analytics data:", error);
      set({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to refresh analytics data",
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));
