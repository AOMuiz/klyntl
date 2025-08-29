import { useDatabase } from "@/services/database/hooks";
import { IProductRepository } from "@/services/database/repositories/interfaces/IProductRepository";

/**
 * Hook to access the product repository
 */
export function useProductRepository(): IProductRepository {
  const { repositories } = useDatabase();
  return repositories.products;
}
