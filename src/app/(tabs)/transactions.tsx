import ScreenContainer, {
  edgesHorizontal,
  edgesVertical,
} from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import { TransactionFilterChips } from "@/components/Transaction/TransactionFilterChips";
import { TransactionHeader } from "@/components/Transaction/TransactionHeader";
import { TransactionResultsInfo } from "@/components/Transaction/TransactionResultsInfo";
import { TransactionSearchBar } from "@/components/Transaction/TransactionSearchBar";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { ExtendedKlyntlTheme, useKlyntlColors } from "@/constants/KlyntlTheme";
import { useTransactionData } from "@/hooks/business/useTransactionData";
import { useTransactionFilters } from "@/hooks/business/useTransactionFilters";
import { useCustomers } from "@/hooks/useCustomers";
import { useTransactions } from "@/hooks/useTransactions";
import { styles } from "@/screens/transaction/TransactionsScreen.styles";
import { TransactionFilterType } from "@/types/transaction";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/helpers";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useTheme } from "react-native-paper";

// Utility functions

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

export const getTransactionIconBackground = (type: string, colors: any) => {
  switch (type) {
    case "sale":
      return colors.success[100];
    case "refund":
      return colors.warning[100];
    case "payment":
      return "#E8F5E8"; // Light green
    case "credit":
      return "#E3F2FD"; // Light blue
    default:
      return colors.paper.surfaceVariant;
  }
};

export const getTransactionIconColor = (type: string, colors: any) => {
  switch (type) {
    case "sale":
      return colors.success;
    case "refund":
      return colors.warning;
    case "payment":
      return "#4CAF50"; // Green
    case "credit":
      return "#2196F3"; // Blue
    default:
      return colors.paper.onSurface;
  }
};

export const getAmountColor = (type: string, colors: any) => {
  switch (type) {
    case "sale":
      return "#2E7D32"; // Dark green
    case "refund":
      return colors.warning;
    case "payment":
      return "#2E7D32"; // Dark green
    case "credit":
      return "#1976D2"; // Dark blue
    default:
      return colors.paper.onSurface;
  }
};

export const getPaymentMethodStyle = (
  paymentMethod: string,
  isDark: boolean
) => {
  const paymentMethodConfig = {
    cash: {
      color: Colors[isDark ? "dark" : "light"].success,
      backgroundColor: Colors[isDark ? "dark" : "light"].success + "20",
    },
    bank_transfer: {
      color: Colors[isDark ? "dark" : "light"].secondary,
      backgroundColor: Colors[isDark ? "dark" : "light"].secondary + "20",
    },
    credit: {
      color: Colors[isDark ? "dark" : "light"].warning,
      backgroundColor: Colors[isDark ? "dark" : "light"].warning + "20",
    },
    pos_card: {
      color: Colors[isDark ? "dark" : "light"].primary,
      backgroundColor: Colors[isDark ? "dark" : "light"].primary + "20",
    },
    mixed: {
      color: Colors[isDark ? "dark" : "light"].accent,
      backgroundColor: Colors[isDark ? "dark" : "light"].accent + "20",
    },
  };

  return (
    paymentMethodConfig[paymentMethod as keyof typeof paymentMethodConfig] || {
      color: "#1976D2",
      backgroundColor: "#E3F2FD",
    }
  );
};

const getStatusBadge = (status?: string, dueDate?: string, colors?: any) => {
  if (!status || status === "completed") {
    // Check if overdue
    if (dueDate && status !== "completed") {
      const today = new Date();
      const due = new Date(dueDate);
      if (due < today) {
        return {
          color: colors.error,
          backgroundColor: "#FFEBEE",
          text: "Overdue",
        };
      }
    }
    return null;
  }

  const statusConfig = {
    pending: {
      color: "#FF8F00",
      backgroundColor: "#FFF3E0",
      text: "PENDING",
    },
    partial: {
      color: colors.accent,
      backgroundColor: colors.accent + "20",
      text: "PARTIAL",
    },
    cancelled: {
      color: colors.error,
      backgroundColor: "#FFEBEE",
      text: "CANCELLED",
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  return (
    config || {
      color: colors.paper.onSurface,
      backgroundColor: colors.paper.surfaceVariant,
      text: status.toUpperCase(),
    }
  );
};

export const getFilterLabel = (
  filterType: TransactionFilterType,
  dateFilter: string,
  statusFilter: string,
  customers: any[]
) => {
  switch (filterType) {
    case "date":
      if (dateFilter === "all") return "Date";
      if (dateFilter === "today") return "Today";
      if (dateFilter === "yesterday") return "Yesterday";
      if (dateFilter === "this_month") return "This Month";
      return "Date";
    case "status":
      return statusFilter === "all"
        ? "Status"
        : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);
    default:
      return "All";
  }
};

// Custom hooks for better separation of concerns

export default function TransactionsScreen() {
  const router = useRouter();
  const theme = useTheme<ExtendedKlyntlTheme>();
  const colors = useKlyntlColors(theme);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Use React Query hooks instead of Zustand stores
  const transactionsQuery = useTransactions();
  const customersQuery = useCustomers();

  const [refreshing, setRefreshing] = useState(false);

  // New UI state for search + filters
  const {
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
  } = useTransactionFilters();

  // Extract data from queries
  const transactions = transactionsQuery.transactions;
  const customers = customersQuery.customers;

  const { filteredTransactions, flashListData } = useTransactionData(
    transactions,
    customers,
    searchQuery,
    statusFilter,
    dateFilter,
    debtStatusFilter
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([transactionsQuery.refetch(), customersQuery.refetch()]);
    setRefreshing(false);
  }, [transactionsQuery, customersQuery]);

  const handleAddTransaction = () => {
    router.push("/(modal)/transaction/add");
  };

  const renderFilterModal = () => {
    if (!activeFilter) return null;

    let options: { label: string; value: string }[] = [];
    let onSelect: (value: string) => void = () => {};

    switch (activeFilter) {
      case "all":
        return null;
      case "date":
        options = [
          { label: "All", value: "all" },
          { label: "Today", value: "today" },
          { label: "Yesterday", value: "yesterday" },
          { label: "This Month", value: "this_month" },
        ];
        onSelect = (value) => {
          setDateFilter(value);
          setActiveFilter(null);
        };
        break;
      case "status":
        options = [
          { label: "All", value: "all" },
          { label: "Sale", value: "sale" },
          { label: "Payment", value: "payment" },
          { label: "Credit", value: "credit" },
          { label: "Refund", value: "refund" },
        ];
        onSelect = (value) => {
          setStatusFilter(value);
          setActiveFilter(null);
        };
        break;
      case "debtStatus":
        options = [
          { label: "All Status", value: "all" },
          { label: "Completed", value: "completed" },
          { label: "Pending", value: "pending" },
          { label: "Partial", value: "partial" },
          { label: "Cancelled", value: "cancelled" },
        ];
        onSelect = (value) => {
          setDebtStatusFilter(value);
          setActiveFilter(null);
        };
        break;
    }

    return (
      <Modal
        visible={true}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveFilter(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setActiveFilter(null)}
        >
          <View
            style={[
              styles.filterModal,
              { backgroundColor: colors.paper.surface },
            ]}
          >
            <ScrollView>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.filterOption}
                  onPress={() => onSelect(option.value)}
                >
                  <ThemedText style={styles.filterOptionText}>
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconSymbol
        name="list.bullet"
        size={64}
        color={colors.paper.onSurfaceVariant}
      />
      <ThemedText type="title" style={styles.emptyTitle}>
        No transactions yet
      </ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        Start recording your first transaction
      </ThemedText>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={handleAddTransaction}
      >
        <ThemedText style={styles.addButtonText}>Add Transaction</ThemedText>
      </TouchableOpacity>
    </View>
  );

  const renderFlashListItem = ({
    item,
    index,
  }: {
    item: (typeof flashListData)[0];
    index: number;
  }) => {
    if (item.type === "section") {
      return (
        <ThemedText
          key={`section-${index}`}
          style={[
            styles.sectionHeader,
            { color: colors.paper.onSurfaceVariant },
          ]}
        >
          {item.title.toUpperCase()}
        </ThemedText>
      );
    }

    const transaction = item.item;
    const customer = customers.find((c) => c.id === transaction.customerId);
    const customerName = customer?.name || "Unknown Customer";
    const statusBadge = getStatusBadge(
      transaction.status,
      transaction.dueDate,
      colors
    );
    const hasDebtInfo =
      transaction.type === "credit" &&
      (transaction.paidAmount || transaction.remainingAmount);

    return (
      <TouchableOpacity
        key={`transaction-${transaction.id}`}
        activeOpacity={0.7}
        onPress={() =>
          router.push(`/(modal)/transaction/view/${transaction.id}`)
        }
        style={[
          styles.transactionCard,
          {
            backgroundColor: colors.paper.surface,
            borderColor: colors.paper.outline,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Edit transaction ${customerName}`}
      >
        <View style={styles.transactionRow}>
          <View
            style={[
              styles.transactionIcon,
              {
                backgroundColor: getTransactionIconBackground(
                  transaction.type,
                  colors
                ),
              },
            ]}
          >
            <IconSymbol
              name={getTransactionIcon(transaction.type)}
              size={20}
              color={getTransactionIconColor(transaction.type, colors)}
            />
          </View>

          <View style={styles.transactionInfo}>
            <View style={styles.customerRow}>
              <ThemedText
                style={[styles.customerName, { color: colors.paper.onSurface }]}
                numberOfLines={1}
              >
                {customerName}
              </ThemedText>
            </View>

            <ThemedText
              style={[
                styles.description,
                { color: colors.paper.onSurfaceVariant },
              ]}
            >
              {transaction.description ||
                `${
                  transaction.type.charAt(0).toUpperCase() +
                  transaction.type.slice(1)
                } transaction`}
            </ThemedText>

            {/* Debt information for credit transactions */}
            {hasDebtInfo && (
              <View style={styles.debtInfo}>
                {transaction.paidAmount && transaction.paidAmount > 0 && (
                  <ThemedText style={[styles.debtText, { color: "#4CAF50" }]}>
                    Paid: {formatCurrency(transaction.paidAmount)}
                  </ThemedText>
                )}
                {transaction.remainingAmount &&
                  transaction.remainingAmount > 0 && (
                    <ThemedText style={[styles.debtText, { color: "#FF8F00" }]}>
                      Due: {formatCurrency(transaction.remainingAmount)}
                    </ThemedText>
                  )}
              </View>
            )}

            {/* Payment method for transactions that have it */}
            {transaction.paymentMethod &&
              transaction.paymentMethod !== "cash" &&
              (() => {
                const style = getPaymentMethodStyle(
                  transaction.paymentMethod!,
                  isDark
                );
                return (
                  <ThemedText
                    type="button"
                    style={[
                      styles.paymentMethod,
                      {
                        color: style.color,
                        backgroundColor: style.backgroundColor,
                      },
                    ]}
                  >
                    {transaction.paymentMethod!.replace("_", " ").toUpperCase()}
                  </ThemedText>
                );
              })()}
          </View>

          <View style={styles.transactionAmount}>
            {statusBadge && (
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusBadge.backgroundColor },
                ]}
              >
                <ThemedText
                  style={[styles.statusText, { color: statusBadge.color }]}
                >
                  {statusBadge.text}
                </ThemedText>
              </View>
            )}
            <ThemedText
              style={[
                styles.amountText,
                { color: getAmountColor(transaction.type, colors) },
              ]}
            >
              {transaction.type === "refund" ? "- " : ""}
              {formatCurrency(transaction.amount, { short: true })}
            </ThemedText>
            <ThemedText
              style={[
                styles.timeText,
                { color: colors.paper.onSurfaceVariant },
              ]}
            >
              {formatDate(transaction.date)}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer
      containerStyle={[
        styles.container,
        { backgroundColor: colors.paper.background },
      ]}
      edges={[...edgesHorizontal, ...edgesVertical]}
      contentStyle={styles.content}
      scrollable={false}
      withPadding={false}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.accent }]}>
        <TransactionHeader
          colors={colors}
          handleAddTransaction={handleAddTransaction}
        />

        <TransactionSearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          colors={colors}
        />

        <TransactionFilterChips
          statusFilter={statusFilter}
          dateFilter={dateFilter}
          debtStatusFilter={debtStatusFilter}
          customers={customers}
          colors={colors}
          resetAllFilters={resetAllFilters}
          setActiveFilter={setActiveFilter}
        />
      </View>

      {/* Transaction List */}
      <View style={styles.listContainer}>
        <FlashList
          data={flashListData}
          renderItem={renderFlashListItem}
          keyExtractor={(item) =>
            item.type === "section"
              ? `section-${item.title}`
              : `transaction-${item.item.id}`
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Filter Modal */}
      {renderFilterModal()}

      <TransactionResultsInfo
        filteredTransactions={filteredTransactions}
        transactions={transactions}
        colors={colors}
      />
    </ScreenContainer>
  );
}
