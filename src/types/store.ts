export interface StoreConfig {
  id: string;
  storeName: string;
  description?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateStoreConfigInput {
  storeName?: string;
  description?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  currency?: string;
  isActive?: boolean;
}
