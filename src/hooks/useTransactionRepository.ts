import { useDatabase } from "@/services/database/hooks";
import { ITransactionRepository } from "@/services/database/repositories/interfaces/ITransactionRepository";

/**
 * Hook to access the transaction repository
 */
export function useTransactionRepository(): ITransactionRepository {
  const { repositories } = useDatabase();
  return repositories.transactions;
}
