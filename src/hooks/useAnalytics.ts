import { useQuery } from "@tanstack/react-query";
import { createDatabaseService } from "../services/database";
import { useDatabase } from "../services/database/hooks";
import {
  Analytics,
  BusinessInsight,
  CustomerAnalytics,
  PurchaseBehaviorAnalytics,
  RevenueAnalytics,
} from "../types/analytics";

export function useAnalytics() {
  const { db } = useDatabase();
  const databaseService = db ? createDatabaseService(db) : undefined;

  return useQuery({
    queryKey: ["analytics", db ? "main" : "default"],
    queryFn: async (): Promise<Analytics> => {
      return databaseService!.getAnalytics();
    },
    enabled: Boolean(databaseService),
    staleTime: 5 * 60 * 1000, // Analytics can be stale for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep analytics in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch analytics on window focus
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Hook for more granular analytics queries if needed in the future
export function useCustomerAnalytics() {
  const { db } = useDatabase();
  const databaseService = db ? createDatabaseService(db) : undefined;

  return useQuery({
    queryKey: ["analytics", "customers", db ? "main" : "default"],
    queryFn: async () => {
      const analytics = await databaseService!.getAnalytics();
      return {
        totalCustomers: analytics.totalCustomers,
        topCustomers: analytics.topCustomers,
      };
    },
    enabled: Boolean(databaseService),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
  });
}

export function useRevenueAnalytics() {
  const { db } = useDatabase();
  const databaseService = db ? createDatabaseService(db) : undefined;

  return useQuery({
    queryKey: ["analytics", "revenue", db ? "main" : "default"],
    queryFn: async () => {
      const analytics = await databaseService!.getAnalytics();
      return {
        totalRevenue: analytics.totalRevenue,
        totalTransactions: analytics.totalTransactions,
        totalOutstandingDebts: analytics.totalOutstandingDebts,
      };
    },
    enabled: Boolean(databaseService),
    staleTime: 3 * 60 * 1000, // Revenue data should be relatively fresh
    gcTime: 10 * 60 * 1000,
    retry: 3,
  });
}

// Enhanced Analytics Hooks

export function useEnhancedRevenueAnalytics(days: number = 30) {
  const { db } = useDatabase();
  const databaseService = db ? createDatabaseService(db) : undefined;

  return useQuery({
    queryKey: ["analytics", "enhanced-revenue", days, db ? "main" : "default"],
    queryFn: async (): Promise<RevenueAnalytics> => {
      return databaseService!.getRevenueAnalytics(days);
    },
    enabled: Boolean(databaseService),
    staleTime: 5 * 60 * 1000, // Revenue analytics can be stale for 5 minutes
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    retry: 3,
  });
}

export function useEnhancedCustomerAnalytics(days?: number) {
  const { db } = useDatabase();
  const databaseService = db ? createDatabaseService(db) : undefined;

  return useQuery({
    queryKey: [
      "analytics",
      "enhanced-customers",
      days,
      db ? "main" : "default",
    ],
    queryFn: async (): Promise<CustomerAnalytics> => {
      return databaseService!.getCustomerAnalytics(days);
    },
    enabled: Boolean(databaseService),
    staleTime: 10 * 60 * 1000, // Customer analytics can be stale for 10 minutes
    gcTime: 20 * 60 * 1000, // Keep in cache for 20 minutes
    retry: 3,
  });
}

export function usePurchaseBehaviorAnalytics() {
  const { db } = useDatabase();
  const databaseService = db ? createDatabaseService(db) : undefined;

  return useQuery({
    queryKey: ["analytics", "purchase-behavior", db ? "main" : "default"],
    queryFn: async (): Promise<PurchaseBehaviorAnalytics> => {
      return databaseService!.getPurchaseBehaviorAnalytics();
    },
    enabled: Boolean(databaseService),
    staleTime: 15 * 60 * 1000, // Purchase behavior can be stale for 15 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes (longer for behavioral data)
    retry: 3,
  });
}

export function useBusinessInsights() {
  const { db } = useDatabase();
  const databaseService = db ? createDatabaseService(db) : undefined;

  return useQuery({
    queryKey: ["analytics", "business-insights", db ? "main" : "default"],
    queryFn: async (): Promise<BusinessInsight[]> => {
      return databaseService!.getBusinessInsights();
    },
    enabled: Boolean(databaseService),
    staleTime: 10 * 60 * 1000, // Insights should be relatively fresh
    gcTime: 20 * 60 * 1000,
    retry: 3,
  });
}
