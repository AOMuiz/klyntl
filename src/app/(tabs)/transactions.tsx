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
import SimpleTransactionCard from "@/components/ui/SimpleTransactionCard";

import { ExtendedKlyntlTheme, useKlyntlColors } from "@/constants/KlyntlTheme";
import { useTransactionData } from "@/hooks/business/useTransactionData";
import { useTransactionFilters } from "@/hooks/business/useTransactionFilters";
import { useCustomers } from "@/hooks/useCustomers";
import { useTransactions } from "@/hooks/useTransactions";
import { styles } from "@/screens/transaction/TransactionsScreen.styles";

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
} from "react-native";
import { useTheme } from "react-native-paper";

export default function TransactionsScreen() {
  const router = useRouter();
  const theme = useTheme<ExtendedKlyntlTheme>();
  const colors = useKlyntlColors(theme);

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
        🏪 Ready to record your first transaction?
      </ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        Track sales, payments, credits and refunds all in one place
      </ThemedText>
      <TouchableOpacity
        style={[
          {
            backgroundColor: colors.primary[500],
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 8,
            marginTop: 20,
          },
        ]}
        onPress={handleAddTransaction}
      >
        <ThemedText style={styles.addButtonText}>
          🚀 Record First Transaction
        </ThemedText>
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

    return (
      <SimpleTransactionCard
        key={`transaction-${transaction.id}`}
        transaction={transaction}
        customerName={customerName}
        onPress={() =>
          router.push(`/(modal)/transaction/view/${transaction.id}`)
        }
      />
    );
  };

  console.log({ transactions, filteredTransactions });

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
      useThemedView={true}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.paper.surface }]}>
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
