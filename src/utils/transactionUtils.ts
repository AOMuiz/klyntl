import { TransactionFilterType } from "@/types/transaction";

export const getTransactionIcon = (type: string) => {
  switch (type) {
    case "sale":
      return "arrow.down.circle.fill";
    case "refund":
      return "arrow.up.circle.fill";
    case "payment":
      return "arrow.down.circle.fill";
    case "credit":
      return "creditcard.fill";
    default:
      return "circle.fill";
  }
};

export const getTransactionColor = (type: string, colors: any) => {
  switch (type) {
    case "sale":
      return colors.success;
    case "refund":
      return colors.error;
    case "payment":
      return colors.primary;
    case "credit":
      return colors.warning;
    default:
      return colors.onSurface;
  }
};

export const getFilterLabel = (
  filter: TransactionFilterType,
  statusFilter: string,
  dateFilter: string,
  debtStatusFilter: string,
  customerFilter: string,
  customers: any[]
) => {
  switch (filter) {
    case "status":
      return `Status: ${statusFilter}`;
    case "date":
      return `Date: ${dateFilter}`;
    case "debtStatus":
      return `Debt: ${debtStatusFilter}`;
    case "customer":
      const customer = customers?.find((c) => c.id === customerFilter);
      return `Customer: ${customer?.name || "Unknown"}`;
    default:
      return "";
  }
};

export const getStatusColor = (status: string, colors: any) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return colors.success;
    case "pending":
      return colors.warning;
    case "partial":
      return colors.info;
    case "cancelled":
      return colors.error;
    default:
      return colors.onSurface;
  }
};

export const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "checkmark.circle.fill";
    case "pending":
      return "clock.fill";
    case "partial":
      return "circle.lefthalf.fill";
    case "cancelled":
      return "xmark.circle.fill";
    default:
      return "circle.fill";
  }
};

export const getPaymentMethodLabel = (method: string) => {
  switch (method?.toLowerCase()) {
    case "cash":
      return "Cash";
    case "credit":
      return "Credit";
    case "mixed":
      return "Mixed";
    case "bank_transfer":
      return "Bank Transfer";
    case "pos_card":
      return "POS/Card";
    default:
      return method || "Unknown";
  }
};

export const getPaymentMethodIcon = (method: string) => {
  switch (method?.toLowerCase()) {
    case "cash":
      return "banknote.fill";
    case "credit":
      return "creditcard.fill";
    case "mixed":
      return "banknote.fill";
    case "bank_transfer":
      return "building.columns.fill";
    case "pos_card":
      return "creditcard.and.123";
    default:
      return "questionmark.circle.fill";
  }
};
