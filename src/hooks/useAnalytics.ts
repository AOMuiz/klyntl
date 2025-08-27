import { useQuery } from "@tanstack/react-query";
import { createDatabaseService } from "../services/database";
import { useDatabase } from "../services/database/hooks";
import { Analytics } from "../types/analytics";

export function useAnalytics() {
  const { db } = useDatabase();

  if (!db) {
    throw new Error("Database not available");
  }

  const databaseService = db ? createDatabaseService(db) : undefined;

  return useQuery({
    queryKey: ["analytics"],
    queryFn: async (): Promise<Analytics> => {
      if (!databaseService) throw new Error("Database not available");
      return databaseService.getAnalytics();
    },
    enabled: !!db,
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
    queryKey: ["analytics", "customers"],
    queryFn: async () => {
      if (!databaseService) throw new Error("Database not available");
      // This could be extended to get more detailed customer analytics
      const analytics = await databaseService.getAnalytics();
      return {
        totalCustomers: analytics.totalCustomers,
        topCustomers: analytics.topCustomers,
      };
    },
    enabled: !!db,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
  });
}

export function useRevenueAnalytics() {
  const { db } = useDatabase();
  const databaseService = db ? createDatabaseService(db) : undefined;

  return useQuery({
    queryKey: ["analytics", "revenue"],
    queryFn: async () => {
      if (!databaseService) throw new Error("Database not available");
      const analytics = await databaseService.getAnalytics();
      return {
        totalRevenue: analytics.totalRevenue,
        totalTransactions: analytics.totalTransactions,
      };
    },
    enabled: !!db,
    staleTime: 3 * 60 * 1000, // Revenue data should be relatively fresh
    gcTime: 10 * 60 * 1000,
    retry: 3,
  });
}
