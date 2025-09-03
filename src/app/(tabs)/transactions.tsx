import ScreenContainer, {
  edgesHorizontal,
  edgesVertical,
} from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
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
} from "react-native";
import { Text, useTheme } from "react-native-paper";

interface TransactionWithCustomer extends Transaction {
  customerName?: string;
}

type FilterType = "all" | "date" | "customer" | "status";

export default function TransactionsScreen() {
  const router = useRouter();
  const theme = useTheme<ExtendedKlyntlTheme>();
  const colors = useKlyntlColors(theme);

  // Use React Query hooks instead of Zustand stores
  const transactionsQuery = useTransactions();
  const customersQuery = useCustomers();

  const [refreshing, setRefreshing] = useState(false);

  // New UI state for search + filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Filter modal state
  const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);

  // Extract data from queries
  const transactions = transactionsQuery.transactions;
  const customers = customersQuery.customers;
  const loading = transactionsQuery.isLoading || customersQuery.isLoading;

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
      default:
        return "circle.fill";
    }
  };

  const getTransactionIconBackground = (type: string) => {
    switch (type) {
      case "sale":
        return colors.custom.successContainer;
      case "refund":
        return colors.custom.warningContainer;
      case "payment":
        return colors.custom.successContainer;
      default:
        return colors.paper.surfaceVariant;
    }
  };

  const getTransactionIconColor = (type: string) => {
    switch (type) {
      case "sale":
        return colors.custom.success;
      case "refund":
        return colors.custom.warning;
      case "payment":
        return colors.custom.success;
      default:
        return colors.paper.onSurface;
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case "sale":
        return colors.custom.success;
      case "refund":
        return colors.custom.warning;
      case "payment":
        return colors.custom.success;
      default:
        return colors.paper.onSurface;
    }
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
          { label: "Refund", value: "refund" },
        ];
        onSelect = (value) => {
          setStatusFilter(value);
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
  }: {
    item: (typeof flashListData)[0];
  }) => {
    if (item.type === "section") {
      return (
        <ThemedText
          style={[
            styles.sectionHeader,
            { color: colors.paper.onSurfaceVariant },
          ]}
        >
          {item.title}
        </ThemedText>
      );
    }

    const transaction = item.item;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() =>
          router.push(`/(modal)/transaction/edit/${transaction.id}`)
        }
        style={[
          styles.transactionCard,
          {
            backgroundColor: colors.paper.background,
            borderColor: colors.neutral["gray200"],
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
              size={24}
              color={getTransactionIconColor(transaction.type)}
            />
          </View>

          <View style={styles.transactionInfo}>
            <ThemedText
              style={[styles.customerName, { color: colors.paper.onSurface }]}
            >
              {transaction.customerName}
            </ThemedText>
            <ThemedText
              style={[
                styles.description,
                { color: colors.paper.onSurfaceVariant },
              ]}
            >
              {transaction.description}
            </ThemedText>
          </View>

          <View style={styles.transactionAmount}>
            <ThemedText
              style={[
                styles.amountText,
                { color: getAmountColor(transaction.type) },
              ]}
            >
              {transaction.type === "refund" ? "- " : ""}
              {formatCurrency(transaction.amount)}
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
  const isAllActive =
    statusFilter === "all" && dateFilter === "all" && customerFilter === "all";
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
            style={[styles.addButton, { backgroundColor: colors.primary[600] }]}
            onPress={handleAddTransaction}
          >
            <IconSymbol name="plus" size={20} color="#fff" />
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
            size={18}
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
              statusFilter === "all"
                ? { backgroundColor: colors.secondary[600] }
                : { backgroundColor: colors.paper.surfaceVariant },
              (statusFilter === "all" || isAllActive) && {
                borderColor: colors.primary[600],
                borderWidth: 1,
              },
            ]}
            onPress={() => {
              // Make "All" reset all filters and close any active filter modal
              setStatusFilter("all");
              setCustomerFilter("all");
              setDateFilter("all");
              setActiveFilter(null);
            }}
          >
            <ThemedText
              style={[
                styles.filterChipText,
                {
                  color:
                    statusFilter === "all" ? "#fff" : colors.paper.onSurface,
                },
              ]}
            >
              All
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: colors.paper.surfaceVariant },
              isDateActive && { borderColor: colors.primary, borderWidth: 2 },
            ]}
            onPress={() => setActiveFilter("date")}
          >
            <ThemedText
              style={[styles.filterChipText, { color: colors.paper.onSurface }]}
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
              { backgroundColor: colors.paper.surfaceVariant },
              isStatusActive && { borderColor: colors.primary, borderWidth: 2 },
            ]}
            onPress={() => setActiveFilter("status")}
          >
            <ThemedText
              style={[styles.filterChipText, { color: colors.paper.onSurface }]}
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
              { backgroundColor: colors.paper.surfaceVariant },
              isCustomerActive && {
                borderColor: colors.primary,
                borderWidth: 2,
              },
            ]}
            onPress={() => setActiveFilter("customer")}
          >
            <ThemedText
              style={[styles.filterChipText, { color: colors.paper.onSurface }]}
            >
              {getFilterLabel("customer")}
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

      {/* Results Info Text */}
      <Text
        variant="bodyMedium"
        style={{ color: colors.paper.onSurfaceVariant }}
      >
        Showing {filteredTransactions.length} of {transactions.length}{" "}
        transactions
        {filteredTransactions.length < transactions.length && " (filtered)"}
      </Text>
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
    padding: hp(16),
    paddingBottom: hp(8),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(16),
  },
  backButton: {
    padding: hp(8),
    marginLeft: wp(-8),
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize(25),
    fontWeight: "600",
  },
  addButton: {
    padding: wp(12),
    borderRadius: wp(24),
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: fontSize(14),
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(14),
    paddingHorizontal: wp(18),
    borderRadius: wp(28),
    marginBottom: hp(20),
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize(16),
    paddingLeft: wp(12),
    paddingVertical: 0,
  },
  filtersContent: {
    paddingVertical: hp(4),
    paddingHorizontal: wp(2),
    alignItems: "center",
    gap: wp(8),
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(10),
    paddingHorizontal: wp(16),
    borderRadius: wp(24),
    gap: wp(6),
  },
  filterChipText: {
    fontSize: fontSize(14),
    fontWeight: "500",
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: wp(16),
  },
  listContent: {
    paddingBottom: hp(20),
  },
  section: {
    marginBottom: hp(24),
  },
  sectionHeader: {
    fontSize: fontSize(14),
    fontWeight: "600",
    marginBottom: hp(16),
    textTransform: "uppercase",
    letterSpacing: 0.8,
    opacity: 0.8,
  },
  transactionCard: {
    marginBottom: hp(8),
    paddingVertical: hp(16),
    paddingHorizontal: wp(16),
    borderRadius: wp(12),
    borderColor: "#eee",
    borderWidth: 1.5,
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  transactionIcon: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(24),
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(16),
  },
  transactionInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: fontSize(16),
    fontWeight: "600",
    marginBottom: hp(4),
  },
  description: {
    fontSize: fontSize(14),
    lineHeight: hp(20),
  },
  transactionAmount: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: fontSize(18),
    fontWeight: "700",
    marginBottom: hp(4),
  },
  timeText: {
    fontSize: fontSize(12),
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
  // Legacy styles to maintain compatibility
  transactionCount: {
    marginTop: hp(4),
    opacity: 0.7,
  },
  list: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  transactionDate: {
    marginTop: hp(2),
  },
  typeText: {
    marginTop: hp(2),
    fontSize: fontSize(12),
    textTransform: "uppercase",
  },
  fab: {
    position: "absolute",
    width: wp(56),
    height: hp(56),
    alignItems: "center",
    justifyContent: "center",
    right: wp(16),
    bottom: hp(60),
    borderRadius: wp(28),
    backgroundColor: "#007AFF",
    display: "none", // Hide FAB since we have header button
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: hp(8),
    flexWrap: "wrap",
  },
  chip: {
    paddingVertical: hp(8),
    paddingHorizontal: hp(12),
    borderRadius: hp(16),
    marginRight: hp(8),
    marginBottom: hp(8),
  },
  chipText: {
    fontWeight: "500",
  },
  menu: {
    position: "absolute",
    top: hp(56),
    right: wp(16),
    borderRadius: wp(8),
    overflow: "hidden",
    zIndex: 1000,
  },
  menuItem: {
    paddingVertical: hp(12),
    paddingHorizontal: wp(16),
    flexDirection: "row",
    alignItems: "center",
  },
  topAddButton: {
    width: wp(40),
    height: hp(40),
    borderRadius: wp(20),
    justifyContent: "center",
    alignItems: "center",
  },
});
