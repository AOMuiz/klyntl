import ScreenContainer, {
  edgesHorizontal,
  edgesVertical,
} from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { ExtendedKlyntlTheme, useKlyntlColors } from "@/constants/KlyntlTheme";
import { useCustomers } from "@/hooks/useCustomers";
import { useTransactions } from "@/hooks/useTransactions";
import { Transaction } from "@/types/transaction";
import { formatCurrency } from "@/utils/currency";
import { getOrderedGroupKeys, groupByDatePeriods } from "@/utils/grouping";
import { fontSize, hp, wp } from "@/utils/responsive_dimensions_system";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { Text, useTheme } from "react-native-paper";

interface TransactionWithCustomer extends Transaction {
  customerName?: string;
}

type FilterType = "all" | "date" | "customer" | "status" | "debtStatus";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [debtStatusFilter, setDebtStatusFilter] = useState<string>("all");

  // Filter modal state
  const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);

  // Extract data from queries
  const transactions = transactionsQuery.transactions;
  const customers = customersQuery.customers;

  // Create a computed value for transactions with customer names
  const transactionsWithCustomers: TransactionWithCustomer[] = transactions.map(
    (transaction: Transaction) => {
      const customer = customers.find((c) => c.id === transaction.customerId);
      return {
        ...transaction,
        customerName: customer?.name || "Unknown Customer",
      };
    }
  );

  // Filtering logic
  const filteredTransactions = transactionsWithCustomers.filter((t) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inName = t.customerName?.toLowerCase().includes(q);
      const inDesc = t.description?.toLowerCase().includes(q);
      if (!inName && !inDesc) return false;
    }

    // Status filter
    if (statusFilter !== "all" && t.type !== statusFilter) return false;

    // Customer filter
    if (customerFilter !== "all" && t.customerId !== customerFilter)
      return false;

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([transactionsQuery.refetch(), customersQuery.refetch()]);
    setRefreshing(false);
  }, [transactionsQuery, customersQuery]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTransactionIcon = (type: string) => {
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

  const getTransactionIconBackground = (type: string) => {
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

  const getTransactionIconColor = (type: string) => {
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

  const getAmountColor = (type: string, status?: string) => {
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

  const getPaymentMethodStyle = (paymentMethod: string) => {
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
      paymentMethodConfig[
        paymentMethod as keyof typeof paymentMethodConfig
      ] || {
        color: "#1976D2",
        backgroundColor: "#E3F2FD",
      }
    );
  };

  const getStatusBadge = (status?: string, dueDate?: string) => {
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

  const handleAddTransaction = () => {
    router.push("/(modal)/transaction/add");
  };

  const getFilterLabel = (filterType: FilterType) => {
    switch (filterType) {
      case "date":
        if (dateFilter === "all") return "Date";
        if (dateFilter === "today") return "Today";
        if (dateFilter === "yesterday") return "Yesterday";
        if (dateFilter === "this_month") return "This Month";
        return "Date";
      case "customer":
        if (customerFilter === "all") return "Customer";
        return (
          customers.find((c) => c.id === customerFilter)?.name ?? "Customer"
        );
      case "status":
        return statusFilter === "all"
          ? "Status"
          : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);
      default:
        return "All";
    }
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
      case "customer":
        options = [
          { label: "All", value: "all" },
          ...customers.map((c) => ({ label: c.name, value: c.id })),
        ];
        onSelect = (value) => {
          setCustomerFilter(value);
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
    const statusBadge = getStatusBadge(transaction.status, transaction.dueDate);
    const hasDebtInfo =
      transaction.type === "credit" &&
      (transaction.paidAmount || transaction.remainingAmount);

    return (
      <TouchableOpacity
        key={`transaction-${transaction.id}`}
        activeOpacity={0.7}
        onPress={() =>
          router.push(`/(modal)/transaction/edit/${transaction.id}`)
        }
        style={[
          styles.transactionCard,
          {
            backgroundColor: colors.paper.surface,
            borderColor: colors.paper.outline,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Edit transaction ${transaction.customerName}`}
      >
        <View style={styles.transactionRow}>
          <View
            style={[
              styles.transactionIcon,
              {
                backgroundColor: getTransactionIconBackground(transaction.type),
              },
            ]}
          >
            <IconSymbol
              name={getTransactionIcon(transaction.type)}
              size={20}
              color={getTransactionIconColor(transaction.type)}
            />
          </View>

          <View style={styles.transactionInfo}>
            <View style={styles.customerRow}>
              <ThemedText
                style={[styles.customerName, { color: colors.paper.onSurface }]}
                numberOfLines={1}
              >
                {transaction.customerName}
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
                const style = getPaymentMethodStyle(transaction.paymentMethod!);
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
                { color: getAmountColor(transaction.type, transaction.status) },
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

  // Which chips are currently active (used to show a colored border)
  const isDateActive = dateFilter !== "all";
  const isCustomerActive = customerFilter !== "all";
  const isStatusActive = statusFilter !== "all";

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
      <View
        style={[styles.header, { backgroundColor: colors.paper.background }]}
      >
        <View style={styles.headerRow}>
          <ThemedText
            type="title"
            style={[styles.headerTitle, { color: colors.paper.onSurface }]}
          >
            Transactions
          </ThemedText>

          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddTransaction}
          >
            <IconSymbol name="plus" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Search input */}
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.paper.surfaceVariant },
          ]}
        >
          <IconSymbol
            name="magnifyingglass"
            size={20}
            color={colors.paper.onSurfaceVariant}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by customer or description"
            placeholderTextColor={colors.paper.onSurfaceVariant}
            style={[styles.searchInput, { color: colors.paper.onSurface }]}
            returnKeyType="search"
          />
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              statusFilter === "all" ? styles.activeChip : styles.inactiveChip,
            ]}
            onPress={() => {
              // Make "All" reset all filters and close any active filter modal
              setStatusFilter("all");
              setCustomerFilter("all");
              setDateFilter("all");
              setDebtStatusFilter("all");
              setActiveFilter(null);
            }}
          >
            <ThemedText
              style={[
                styles.filterChipText,
                statusFilter === "all"
                  ? styles.activeChipText
                  : styles.inactiveChipText,
              ]}
            >
              All
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              styles.inactiveChip,
              isDateActive && styles.activeFilterChip,
            ]}
            onPress={() => setActiveFilter("date")}
          >
            <ThemedText
              style={[styles.filterChipText, styles.inactiveChipText]}
            >
              {getFilterLabel("date")}
            </ThemedText>
            <IconSymbol
              name="chevron.down"
              size={16}
              color={colors.paper.onSurface}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              styles.inactiveChip,
              isStatusActive && styles.activeFilterChip,
            ]}
            onPress={() => setActiveFilter("status")}
          >
            <ThemedText
              style={[styles.filterChipText, styles.inactiveChipText]}
            >
              {getFilterLabel("status")}
            </ThemedText>
            <IconSymbol
              name="chevron.down"
              size={16}
              color={colors.paper.onSurface}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              styles.inactiveChip,
              isCustomerActive && styles.activeFilterChip,
            ]}
            onPress={() => setActiveFilter("customer")}
          >
            <ThemedText
              style={[styles.filterChipText, styles.inactiveChipText]}
            >
              {getFilterLabel("customer")}
            </ThemedText>
            <IconSymbol
              name="chevron.down"
              size={16}
              color={colors.paper.onSurface}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              styles.inactiveChip,
              debtStatusFilter !== "all" && styles.activeFilterChip,
            ]}
            onPress={() => setActiveFilter("debtStatus")}
          >
            <ThemedText
              style={[styles.filterChipText, styles.inactiveChipText]}
            >
              {debtStatusFilter === "all"
                ? "Debt Status"
                : debtStatusFilter.charAt(0).toUpperCase() +
                  debtStatusFilter.slice(1)}
            </ThemedText>
            <IconSymbol
              name="chevron.down"
              size={16}
              color={colors.paper.onSurface}
            />
          </TouchableOpacity>
        </ScrollView>
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

      {/* Results Info Text - Hidden when empty */}
      {filteredTransactions.length > 0 && (
        <View style={styles.resultsInfo}>
          <Text
            variant="bodySmall"
            style={{ color: colors.paper.onSurfaceVariant }}
          >
            Showing {filteredTransactions.length} of {transactions.length}{" "}
            transactions
            {filteredTransactions.length < transactions.length && " (filtered)"}
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: wp(20),
    paddingTop: hp(20),
    paddingBottom: hp(12),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(24),
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize(32),
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  addButton: {
    width: wp(50),
    height: wp(50),
    borderRadius: wp(28),
    backgroundColor: "#34C759", // iOS green
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: fontSize(16),
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(16),
    paddingHorizontal: wp(20),
    borderRadius: wp(12),
    marginBottom: hp(20),
    borderWidth: 1,
    borderColor: "#E5E5E7",
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize(16),
    paddingLeft: wp(12),
    paddingVertical: 0,
    fontWeight: "400",
  },
  filtersContent: {
    paddingVertical: hp(8),
    alignItems: "center",
    gap: wp(12),
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(12),
    paddingHorizontal: wp(20),
    borderRadius: wp(24),
    gap: wp(8),
    borderWidth: 1,
    borderColor: "transparent",
  },
  activeChip: {
    backgroundColor: "#34C759", // iOS green
  },
  inactiveChip: {
    backgroundColor: "#F2F2F7", // Light gray
    borderColor: "#E5E5E7",
  },
  activeFilterChip: {
    borderColor: "#34C759",
    borderWidth: 2,
  },
  filterChipText: {
    fontSize: fontSize(13),
    fontWeight: "600",
  },
  activeChipText: {
    color: "white",
  },
  inactiveChipText: {
    color: "#1C1C1E",
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: wp(20),
  },
  listContent: {
    paddingBottom: hp(40),
    paddingTop: hp(8),
  },
  sectionHeader: {
    fontSize: fontSize(13),
    fontWeight: "700",
    marginBottom: hp(12),
    marginTop: hp(20),
    letterSpacing: 1.0,
    opacity: 0.7,
    paddingHorizontal: wp(4),
  },
  transactionCard: {
    marginBottom: hp(12),
    paddingVertical: hp(16),
    paddingHorizontal: wp(20),
    borderRadius: wp(16),
    borderWidth: 1,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(16),
  },
  transactionIcon: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(22),
    justifyContent: "center",
    alignItems: "center",
  },
  transactionInfo: {
    flex: 1,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: hp(4),
  },
  customerName: {
    fontSize: fontSize(17),
    fontWeight: "600",
    flex: 1,
    lineHeight: hp(22),
  },
  statusBadge: {
    paddingHorizontal: wp(8),
    paddingVertical: hp(2),
    borderRadius: wp(12),
    marginLeft: wp(8),
    alignSelf: "center",
  },
  statusText: {
    fontSize: fontSize(9),
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  debtInfo: {
    marginTop: hp(8),
    gap: hp(4),
  },
  debtText: {
    fontSize: fontSize(12),
    fontWeight: "500",
    lineHeight: hp(18),
  },
  paymentMethod: {
    fontSize: fontSize(10),
    fontWeight: "500",
    letterSpacing: 0.5,
    marginTop: hp(6),
    paddingHorizontal: wp(6),
    paddingVertical: hp(2),
    borderRadius: wp(8),
    alignSelf: "flex-start",
  },
  description: {
    fontSize: fontSize(13),
    lineHeight: hp(20),
    marginBottom: hp(4),
    opacity: 0.8,
    fontWeight: "400",
  },
  transactionAmount: {
    gap: hp(3),
    alignItems: "flex-end",
    justifyContent: "center",
  },
  amountText: {
    fontSize: fontSize(17),
    fontWeight: "700",
    // marginBottom: hp(2),
    lineHeight: hp(22),
  },
  timeText: {
    fontSize: fontSize(12),
    fontWeight: "500",
    opacity: 0.7,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: wp(32),
  },
  emptyTitle: {
    textAlign: "center",
    marginTop: hp(20),
    marginBottom: hp(12),
    fontSize: fontSize(20),
    fontWeight: "600",
  },
  emptySubtitle: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: hp(32),
    fontSize: fontSize(16),
    lineHeight: hp(24),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  filterModal: {
    width: "80%",
    maxHeight: "60%",
    borderRadius: wp(12),
    padding: wp(8),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: hp(2) },
    shadowOpacity: 0.25,
    shadowRadius: wp(4),
    elevation: 5,
  },
  filterOption: {
    paddingVertical: hp(16),
    paddingHorizontal: wp(16),
    borderRadius: wp(8),
  },
  filterOptionText: {
    fontSize: fontSize(16),
  },
  resultsInfo: {
    paddingHorizontal: wp(16),
    paddingVertical: hp(8),
    alignItems: "center",
  },
});
