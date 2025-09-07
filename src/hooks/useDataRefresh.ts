import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants/queryKeys";

export function useDataRefresh() {
  const queryClient = useQueryClient();

  const refreshAllData = () => {
    // Invalidate all queries to force fresh data
    queryClient.invalidateQueries();
  };

  const refreshCustomers = () => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.customers.all(),
    });
  };

  const refreshTransactions = (customerId?: string) => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.transactions.all(),
    });
    if (customerId) {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.transactions.list(customerId),
      });
    }
  };

  const refreshAnalytics = () => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.analytics.all(),
    });
  };

  const refreshCustomerData = (customerId: string) => {
    // Refresh all data related to a specific customer
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.customers.detail(customerId),
    });
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.transactions.list(customerId),
    });
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.customerDebt.detail(customerId),
    });
  };

  return {
    refreshAllData,
    refreshCustomers,
    refreshTransactions,
    refreshAnalytics,
    refreshCustomerData,
  };
}
