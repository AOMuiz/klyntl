import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDatabaseService } from "../services/database";
import { useDatabase } from "../services/database/hooks";
import {
  CreateTransactionInput,
  Transaction,
  UpdateTransactionInput,
} from "../types/transaction";

export function useTransactions(customerId?: string) {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  const transactionsQuery = useQuery({
    queryKey: ["transactions", customerId],
    queryFn: async () => {
      if (!db) throw new Error("Database not available");
      const databaseService = createDatabaseService(db);

      return customerId
        ? databaseService.getTransactionsByCustomer(customerId)
        : databaseService.getAllTransactions();
    },
    enabled: !!db,
    staleTime: 1 * 60 * 1000, // Transaction data should be fresh for 1 minute
    gcTime: 3 * 60 * 1000, // Keep in cache for 3 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateTransactionInput) => {
      if (!db) throw new Error("Database not available");
      const databaseService = createDatabaseService(db);
      return databaseService.createTransaction(data);
    },
    onSuccess: (newTransaction) => {
      // Update transactions cache
      queryClient.setQueryData(
        ["transactions", customerId],
        (old: Transaction[]) =>
          old ? [newTransaction, ...old] : [newTransaction]
      );

      // Invalidate customer data since totals changed
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });

      // If creating for specific customer, also invalidate all transactions
      if (!customerId) {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
      }
    },
    onError: (error) => {
      console.error("Failed to create transaction:", error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdateTransactionInput;
    }) => {
      if (!db) throw new Error("Database not available");
      const databaseService = createDatabaseService(db);
      await databaseService.updateTransaction(id, updates);
      return { id, updates };
    },
    onSuccess: ({ id, updates }) => {
      queryClient.setQueryData(
        ["transactions", customerId],
        (old: Transaction[]) =>
          old?.map((txn) => (txn.id === id ? { ...txn, ...updates } : txn))
      );

      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (error) => {
      console.error("Failed to update transaction:", error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!db) throw new Error("Database not available");
      const databaseService = createDatabaseService(db);
      await databaseService.deleteTransaction(id);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(
        ["transactions", customerId],
        (old: Transaction[]) => old?.filter((txn) => txn.id !== deletedId)
      );

      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (error) => {
      console.error("Failed to delete transaction:", error);
    },
  });

  return {
    // Data
    transactions: transactionsQuery.data || [],

    // Loading states
    isLoading: transactionsQuery.isLoading,
    isFetching: transactionsQuery.isFetching,

    // Error states
    error: transactionsQuery.error,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Actions
    createTransaction: createMutation.mutate,
    updateTransaction: updateMutation.mutate,
    deleteTransaction: deleteMutation.mutate,

    // Success states
    createSuccess: createMutation.isSuccess,
    updateSuccess: updateMutation.isSuccess,
    deleteSuccess: deleteMutation.isSuccess,

    // Reset mutation states
    resetCreateState: createMutation.reset,
    resetUpdateState: updateMutation.reset,
    resetDeleteState: deleteMutation.reset,

    // Utilities
    refetch: transactionsQuery.refetch,
  };
}

// Hook for getting a single transaction
export function useTransaction(id?: string) {
  const { db } = useDatabase();

  return useQuery({
    queryKey: ["transactions", "detail", id],
    queryFn: async () => {
      if (!db || !id)
        throw new Error("Database not available or no ID provided");
      const databaseService = createDatabaseService(db);
      return databaseService.getTransactionById(id);
    },
    enabled: !!db && !!id,
    staleTime: 5 * 60 * 1000, // Individual transaction data can be stale for 5 minutes
    retry: 3,
  });
}
