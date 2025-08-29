import { useDatabase } from "@/services/database/hooks";
import { IStoreConfigRepository } from "@/services/database/repositories/interfaces/IStoreConfigRepository";

/**
 * Hook to access the store configuration repository
 */
export function useStoreConfigRepository(): IStoreConfigRepository {
  const { repositories } = useDatabase();
  return repositories.storeConfig;
}
