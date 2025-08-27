import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDatabaseService } from "../services/database";
import { useDatabase } from "../services/database/hooks";
import { UpdateStoreConfigInput } from "../types/store";

export function useStoreConfig() {
  const { db } = useDatabase();
  const queryClient = useQueryClient();
  const databaseService = db ? createDatabaseService(db) : undefined;

  const storeConfigQuery = useQuery({
    queryKey: ["store-config"],
    queryFn: async () => {
      if (!databaseService) throw new Error("Database not available");
      return databaseService.getStoreConfig();
    },
    enabled: !!db,
    staleTime: 5 * 60 * 1000, // Store config can be stale for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 3,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: UpdateStoreConfigInput) => {
      if (!databaseService) throw new Error("Database not available");
      await databaseService.updateStoreConfig(updates);
      return updates;
    },
    onSuccess: (updates) => {
      // Update the store config cache
      queryClient.setQueryData(["store-config"], (old: any) =>
        old ? { ...old, ...updates, updatedAt: new Date().toISOString() } : old
      );

      // Invalidate related queries if needed
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (error) => {
      console.error("Failed to update store config:", error);
    },
  });

  return {
    // Data
    storeConfig: storeConfigQuery.data,

    // Loading states
    isLoading: storeConfigQuery.isLoading,
    isFetching: storeConfigQuery.isFetching,

    // Error states
    error: storeConfigQuery.error,

    // Mutation states
    isUpdating: updateMutation.isPending,

    // Actions
    updateStoreConfig: updateMutation.mutate,

    // Success states
    updateSuccess: updateMutation.isSuccess,

    // Reset mutation state
    resetUpdateState: updateMutation.reset,

    // Utilities
    refetch: storeConfigQuery.refetch,
  };
}
