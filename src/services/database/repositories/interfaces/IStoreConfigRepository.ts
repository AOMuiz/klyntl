import { StoreConfig } from "@/types/store";
import { IBaseRepository } from "./IBaseRepository";

export interface IStoreConfigRepository extends IBaseRepository<StoreConfig> {
  getActiveConfig(): Promise<StoreConfig | null>;
  updateConfigSettings(
    id: string,
    settings: Partial<StoreConfig>
  ): Promise<void>;
}
