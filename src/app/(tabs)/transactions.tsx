import ScreenContainer, {
  edgesHorizontal,
  edgesVertical,
} from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useCustomers } from "@/hooks/useCustomers";
import { useTransactions } from "@/hooks/useTransactions";
import { Transaction } from "@/types/transaction";
import { formatCurrency } from "@/utils/helpers";
import { fontSize, hp, wp } from "@/utils/responsive_dimensions_system";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
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

import { rs } from "react-native-full-responsive";

interface TransactionWithCustomer extends Transaction {
  customerName?: string;
}

type FilterType = "all" | "date" | "customer" | "status";

export default function TransactionsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  // Use React Query hooks instead of Zustand stores
  const transactionsQuery = useTransactions();
  const customersQuery = useCustomers();

  // Theme colors
  const colors = Colors[colorScheme ?? "light"];

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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    console.log({ date });

    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
        return "#E8F5E8"; // Light green
      case "refund":
        return "#FDEDEC"; // Light red
      case "payment":
        return "#E8F5E8"; // Light green
      default:
        return colors.surfaceVariant;
    }
  };

  const getTransactionIconColor = (type: string) => {
    switch (type) {
      case "sale":
        return colors.currencyPositive;
      case "refund":
        return colors.currencyNegative;
      case "payment":
        return colors.currencyPositive;
      default:
        return colors.text;
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case "sale":
        return colors.currencyPositive;
      case "refund":
        return colors.currencyNegative;
      case "payment":
        return colors.currencyPositive;
      default:
        return colors.text;
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
            style={[styles.filterModal, { backgroundColor: colors.surface }]}
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

  // Group transactions by time buckets for sectioned UI
  const grouped = (() => {
    const now = new Date();
    const todayKey = "Today";
    const yesterdayKey = "Yesterday";
    const thisMonthKey = "This Month";

    const sections: Record<string, TransactionWithCustomer[]> = {
      [todayKey]: [],
      [yesterdayKey]: [],
      [thisMonthKey]: [],
    };

    filteredTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .forEach((t) => {
        const d = new Date(t.date);
        const isToday = d.toDateString() === new Date().toDateString();
        const yesterday = new Date();
        yesterday.setDate(new Date().getDate() - 1);
        const isYesterday = d.toDateString() === yesterday.toDateString();
        const isThisMonth =
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear();

        if (isToday) sections[todayKey].push(t);
        else if (isYesterday) sections[yesterdayKey].push(t);
        else if (isThisMonth) sections[thisMonthKey].push(t);
      });

    return sections;
  })();

  const renderTransactionItem = ({
    item,
  }: {
    item: TransactionWithCustomer;
  }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/(modal)/transaction/edit/${item.id}`)}
      style={[styles.transactionCard, { backgroundColor: colors.background }]}
      accessibilityRole="button"
      accessibilityLabel={`Edit transaction ${item.customerName}`}
    >
      <View style={styles.transactionRow}>
        <View
          style={[
            styles.transactionIcon,
            { backgroundColor: getTransactionIconBackground(item.type) },
          ]}
        >
          <IconSymbol
            name={getTransactionIcon(item.type)}
            size={24}
            color={getTransactionIconColor(item.type)}
          />
        </View>

        <View style={styles.transactionInfo}>
          <ThemedText style={styles.customerName}>
            {item.customerName}
          </ThemedText>
          <ThemedText
            style={[styles.description, { color: colors.textSecondary }]}
          >
            {item.description}
          </ThemedText>
        </View>

        <View style={styles.transactionAmount}>
          <ThemedText
            style={[styles.amountText, { color: getAmountColor(item.type) }]}
          >
            {item.type === "refund" ? "- " : ""}
            {formatCurrency(item.amount)}
          </ThemedText>
          <ThemedText
            style={[styles.timeText, { color: colors.textSecondary }]}
          >
            {formatTime(item.date)}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSection = (title: string, items: TransactionWithCustomer[]) => {
    if (items.length === 0) return null;
    return (
      <View key={title} style={styles.section}>
        <ThemedText
          style={[styles.sectionHeader, { color: colors.textSecondary }]}
        >
          {title}
        </ThemedText>
        {items.map((item, index) => (
          <View key={item.id}>{renderTransactionItem({ item })}</View>
        ))}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconSymbol name="list.bullet" size={64} color={colors.tabIconDefault} />
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
        { backgroundColor: colors.background },
      ]}
      edges={[...edgesHorizontal, ...edgesVertical]}
      contentStyle={styles.content}
      scrollable={false}
      withPadding={false}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerRow}>
          <ThemedText type="title" style={styles.headerTitle}>
            Transactions
          </ThemedText>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAddTransaction}
          >
            <IconSymbol name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search input */}
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.surfaceVariant },
          ]}
        >
          <IconSymbol
            name="magnifyingglass"
            size={18}
            color={colors.textTertiary}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by customer or description"
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text }]}
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
                ? { backgroundColor: colors.secondary }
                : { backgroundColor: colors.surfaceVariant },
              isAllActive && { borderColor: colors.primary, borderWidth: 2 },
            ]}
            onPress={() => setActiveFilter("all")}
          >
            <ThemedText
              style={[
                styles.filterChipText,
                { color: statusFilter === "all" ? "#fff" : colors.text },
              ]}
            >
              All
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: colors.surfaceVariant },
              isDateActive && { borderColor: colors.primary, borderWidth: 2 },
            ]}
            onPress={() => setActiveFilter("date")}
          >
            <ThemedText style={[styles.filterChipText, { color: colors.text }]}>
              {getFilterLabel("date")}
            </ThemedText>
            <IconSymbol name="chevron.down" size={16} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: colors.surfaceVariant },
              isStatusActive && { borderColor: colors.primary, borderWidth: 2 },
            ]}
            onPress={() => setActiveFilter("status")}
          >
            <ThemedText style={[styles.filterChipText, { color: colors.text }]}>
              {getFilterLabel("status")}
            </ThemedText>
            <IconSymbol name="chevron.down" size={16} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: colors.surfaceVariant },
              isCustomerActive && {
                borderColor: colors.primary,
                borderWidth: 2,
              },
            ]}
            onPress={() => setActiveFilter("customer")}
          >
            <ThemedText style={[styles.filterChipText, { color: colors.text }]}>
              {getFilterLabel("customer")}
            </ThemedText>
            <IconSymbol name="chevron.down" size={16} color={colors.text} />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Transaction List */}
      {filteredTransactions.length === 0 && !loading ? (
        renderEmptyState()
      ) : (
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {renderSection("Today", grouped["Today"])}
          {renderSection("Yesterday", grouped["Yesterday"])}
          {renderSection("This Month", grouped["This Month"])}
        </ScrollView>
      )}

      {/* Filter Modal */}
      {renderFilterModal()}
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
    padding: rs(16),
    paddingBottom: rs(8),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: rs(16),
  },
  backButton: {
    padding: rs(8),
    marginLeft: rs(-8),
  },
  headerTitle: {
    flex: 1,
    // textAlign: "center",
    fontSize: fontSize(20),
    fontWeight: "600",
  },
  addButton: {
    padding: rs(10),
    borderRadius: rs(20),
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: rs(12),
    paddingHorizontal: rs(16),
    borderRadius: rs(24),
    marginBottom: rs(16),
  },
  searchInput: {
    flex: 1,
    fontSize: rs(14),
    paddingLeft: rs(12),
    paddingVertical: 0,
  },
  filtersContent: {
    paddingVertical: rs(4),
    paddingHorizontal: rs(2),
    alignItems: "center",
    gap: rs(8),
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: rs(8),
    paddingHorizontal: rs(16),
    borderRadius: rs(20),
    gap: rs(4),
  },
  filterChipText: {
    fontSize: rs(14),
    fontWeight: "500",
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: rs(16),
  },
  listContent: {
    paddingBottom: rs(20),
  },
  section: {
    marginBottom: rs(24),
  },
  sectionHeader: {
    fontSize: rs(14),
    fontWeight: "600",
    marginBottom: rs(12),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  transactionCard: {
    marginBottom: rs(1),
    paddingVertical: rs(16),
    paddingHorizontal: rs(0),
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  transactionIcon: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    justifyContent: "center",
    alignItems: "center",
    marginRight: rs(16),
  },
  transactionInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: rs(16),
    fontWeight: "600",
    marginBottom: rs(2),
  },
  description: {
    fontSize: rs(14),
  },
  transactionAmount: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: rs(16),
    fontWeight: "600",
    marginBottom: rs(2),
  },
  timeText: {
    fontSize: rs(12),
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: rs(32),
  },
  emptyTitle: {
    textAlign: "center",
    marginTop: rs(16),
    marginBottom: rs(8),
  },
  emptySubtitle: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: rs(24),
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
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
    borderRadius: rs(12),
    padding: rs(8),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.25,
    shadowRadius: rs(4),
    elevation: 5,
  },
  filterOption: {
    paddingVertical: rs(16),
    paddingHorizontal: rs(16),
    borderRadius: rs(8),
  },
  filterOptionText: {
    fontSize: rs(16),
  },
  // Legacy styles to maintain compatibility
  transactionCount: {
    marginTop: rs(4),
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
    marginTop: rs(2),
  },
  typeText: {
    marginTop: rs(2),
    fontSize: rs(12),
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
    elevation: 8,
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.25,
    shadowRadius: rs(4),
    backgroundColor: "#007AFF",
    display: "none", // Hide FAB since we have header button
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: rs(8),
    flexWrap: "wrap",
  },
  chip: {
    paddingVertical: rs(8),
    paddingHorizontal: rs(12),
    borderRadius: rs(16),
    marginRight: rs(8),
    marginBottom: rs(8),
  },
  chipText: {
    fontWeight: "500",
  },
  menu: {
    position: "absolute",
    top: rs(56),
    right: rs(16),
    borderRadius: rs(8),
    overflow: "hidden",
    elevation: 4,
    zIndex: 1000,
  },
  menuItem: {
    paddingVertical: rs(12),
    paddingHorizontal: rs(16),
    flexDirection: "row",
    alignItems: "center",
  },
  topAddButton: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    justifyContent: "center",
    alignItems: "center",
  },
});
