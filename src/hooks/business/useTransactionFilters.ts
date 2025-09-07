import { TransactionFilterType } from "@/types/transaction";
import { useState } from "react";

export const useTransactionFilters = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [debtStatusFilter, setDebtStatusFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] =
    useState<TransactionFilterType | null>(null);

  const resetAllFilters = () => {
    setStatusFilter("all");
    setDateFilter("all");
    setDebtStatusFilter("all");
    setActiveFilter(null);
  };

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    dateFilter,
    setDateFilter,
    debtStatusFilter,
    setDebtStatusFilter,
    activeFilter,
    setActiveFilter,
    resetAllFilters,
  };
};
