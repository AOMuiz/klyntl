import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDatabase } from "../services/database/hooks";
import { DatabaseService } from "../services/database/oldUnusedIndex";

// Hook for database utilities and operations
export function useDatabaseUtils() {
  const { db, isReady } = useDatabase();
  const queryClient = useQueryClient();
  const databaseService = new DatabaseService();

  // Clear all data mutation
  const clearDataMutation = useMutation({
    mutationFn: async () => {
      if (!db || !isReady) throw new Error("Database not ready");
      await databaseService.initialize();
      await databaseService.clearAllData();
    },
    onSuccess: () => {
      // Clear all React Query caches
      queryClient.clear();
    },
    onError: (error) => {
      console.error("Failed to clear database:", error);
    },
  });

  // Database health check
  const healthQuery = useQuery({
    queryKey: ["database", "health"],
    queryFn: async () => {
      if (!db || !isReady)
        return { healthy: false, message: "Database not ready" };

      try {
        await databaseService.initialize();
        // Simple health check - try to count customers
        const customers = await databaseService.getCustomers();
        return {
          healthy: true,
          message: "Database is healthy",
          customerCount: customers.length,
        };
      } catch (error) {
        return {
          healthy: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    enabled: isReady && !!db,
    staleTime: 30 * 1000, // Health check every 30 seconds
    retry: 1, // Don't retry health checks aggressively
  });

  return {
    // Health
    health: healthQuery.data,
    isHealthy: healthQuery.data?.healthy ?? false,
    healthError: healthQuery.error,

    // Utilities
    clearAllData: clearDataMutation.mutate,
    isClearing: clearDataMutation.isPending,
    clearSuccess: clearDataMutation.isSuccess,
    clearError: clearDataMutation.error,

    // Manual cache invalidation
    invalidateAll: () => queryClient.clear(),
    invalidateCustomers: () =>
      queryClient.invalidateQueries({ queryKey: ["customers"] }),
    invalidateTransactions: () =>
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
    invalidateAnalytics: () =>
      queryClient.invalidateQueries({ queryKey: ["analytics"] }),

    // Refresh health
    refreshHealth: healthQuery.refetch,
  };
}

// Hook for managing database connection state
export function useDatabaseConnection() {
  const { db, isReady, error: dbError } = useDatabase();

  return {
    isConnected: isReady && !!db,
    isConnecting: !isReady && !dbError,
    error: dbError,
    database: db,
  };
}
