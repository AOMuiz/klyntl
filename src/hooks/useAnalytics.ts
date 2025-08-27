import { useQuery } from "@tanstack/react-query";
import { DatabaseService } from "../services/database";
import { useDatabase } from "../services/database/hooks";
import { Analytics } from "../types/analytics";

export function useAnalytics() {
  const { db, isReady } = useDatabase();
  const databaseService = new DatabaseService();

  return useQuery({
    queryKey: ["analytics"],
    queryFn: async (): Promise<Analytics> => {
      if (!db || !isReady) throw new Error("Database not ready");
      await databaseService.initialize();
      return databaseService.getAnalytics();
    },
    enabled: isReady && !!db,
    staleTime: 5 * 60 * 1000, // Analytics can be stale for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep analytics in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch analytics on window focus
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Hook for more granular analytics queries if needed in the future
export function useCustomerAnalytics() {
  const { db, isReady } = useDatabase();
  const databaseService = new DatabaseService();

  return useQuery({
    queryKey: ["analytics", "customers"],
    queryFn: async () => {
      if (!db || !isReady) throw new Error("Database not ready");
      await databaseService.initialize();

      // This could be extended to get more detailed customer analytics
      const analytics = await databaseService.getAnalytics();
      return {
        totalCustomers: analytics.totalCustomers,
        topCustomers: analytics.topCustomers,
      };
    },
    enabled: isReady && !!db,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
  });
}

export function useRevenueAnalytics() {
  const { db, isReady } = useDatabase();
  const databaseService = new DatabaseService();

  return useQuery({
    queryKey: ["analytics", "revenue"],
    queryFn: async () => {
      if (!db || !isReady) throw new Error("Database not ready");
      await databaseService.initialize();

      const analytics = await databaseService.getAnalytics();
      return {
        totalRevenue: analytics.totalRevenue,
        totalTransactions: analytics.totalTransactions,
      };
    },
    enabled: isReady && !!db,
    staleTime: 3 * 60 * 1000, // Revenue data should be relatively fresh
    gcTime: 10 * 60 * 1000,
    retry: 3,
  });
}
