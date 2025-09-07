import { Transaction, TransactionWithCustomer } from "@/types/transaction";
import { getOrderedGroupKeys, groupByDatePeriods } from "@/utils/grouping";
import { useMemo } from "react";

export const useTransactionData = (
  transactions: Transaction[],
  customers: any[],
  searchQuery: string,
  statusFilter: string,
  dateFilter: string,
  debtStatusFilter: string
) => {
  // Filtering logic
  const filteredTransactions = transactions.filter((t) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const customer = customers.find((c) => c.id === t.customerId);
      const customerName = customer?.name?.toLowerCase() || "";
      const inName = customerName.includes(q);
      const inDesc = t.description?.toLowerCase().includes(q);
      if (!inName && !inDesc) return false;
    }

    // Status filter
    if (statusFilter !== "all" && t.type !== statusFilter) return false;

    // Debt status filter
    if (debtStatusFilter !== "all" && t.status !== debtStatusFilter)
      return false;

    // Date filter
    const txDate = new Date(t.date);
    const now = new Date();
    if (dateFilter === "today") {
      if (txDate.toDateString() !== new Date().toDateString()) return false;
    } else if (dateFilter === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      if (txDate.toDateString() !== yesterday.toDateString()) return false;
    } else if (dateFilter === "this_month") {
      if (
        txDate.getMonth() !== now.getMonth() ||
        txDate.getFullYear() !== now.getFullYear()
      )
        return false;
    }

    return true;
  });

  // Group transactions by time buckets for sectioned UI
  const grouped = groupByDatePeriods(filteredTransactions, {
    todayLabel: "Today",
    yesterdayLabel: "Yesterday",
    thisMonthLabel: "This Month",
    monthFormat: "long",
    yearFormat: "numeric",
  });

  // Get ordered section keys for consistent display
  const sectionKeys = getOrderedGroupKeys(grouped, [
    "Today",
    "Yesterday",
    "This Month",
  ]);

  // Create flattened data for FlashList with section headers
  const flashListData = useMemo(() => {
    const data: (
      | { type: "section"; title: string }
      | { type: "transaction"; item: TransactionWithCustomer }
    )[] = [];

    sectionKeys.forEach((sectionKey) => {
      const items = grouped[sectionKey];
      if (items.length > 0) {
        data.push({ type: "section", title: sectionKey });
        items.forEach((item) => {
          data.push({ type: "transaction", item });
        });
      }
    });

    return data;
  }, [grouped, sectionKeys]);

  return {
    filteredTransactions,
    flashListData,
  };
};
