/**
 * Centralized query keys for React Query
 * This file contains all query key definitions to ensure consistency
 * and avoid typos across the application
 */

export const QUERY_KEYS = {
  // Transaction queries
  transactions: {
    all: () => ["transactions"] as const,
    list: (customerId?: string) => ["transactions", customerId] as const,
    detail: (id?: string) => ["transactions", "detail", id] as const,
  },

  // Customer queries
  customers: {
    all: () => ["customers"] as const,
    list: (params?: {
      searchQuery?: string;
      filters?: any;
      sort?: any;
      pageSize?: number;
    }) => ["customers", params] as const,
    count: (params?: { searchQuery?: string; filters?: any }) =>
      ["customers", "count", params] as const,
    detail: (id?: string) => ["customer", id] as const,
    byPhone: (phone?: string) => ["customers", "phone", phone] as const,
  },

  // Customer debt queries
  customerDebt: {
    detail: (customerId: string) => ["customer-debt", customerId] as const,
  },

  // Analytics queries
  analytics: {
    all: () => ["analytics"] as const,
  },
} as const;

/**
 * Type-safe query key types for better TypeScript support
 */
export type TransactionQueryKeys = typeof QUERY_KEYS.transactions;
export type CustomerQueryKeys = typeof QUERY_KEYS.customers;
export type CustomerDebtQueryKeys = typeof QUERY_KEYS.customerDebt;
export type AnalyticsQueryKeys = typeof QUERY_KEYS.analytics;
