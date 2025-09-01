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
import { hp, wp } from "@/utils/responsive_dimensions_system";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { rs } from "react-native-full-responsive";

interface TransactionWithCustomer extends Transaction {
  customerName?: string;
}

export default function TransactionsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  // Use React Query hooks instead of Zustand stores
  const transactionsQuery = useTransactions();
  const customersQuery = useCustomers();

  // Theme colors
  const colors = Colors[colorScheme ?? "light"];

  const [refreshing, setRefreshing] = useState(false);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([transactionsQuery.refetch(), customersQuery.refetch()]);
    setRefreshing(false);
  }, [transactionsQuery, customersQuery]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "sale":
        return "plus.circle.fill";
      case "refund":
        return "minus.circle.fill";
      case "payment":
        return "arrow.down.circle.fill";
      default:
        return "circle.fill";
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "sale":
        return colors.currencyPositive;
      case "refund":
        return colors.currencyNegative;
      case "payment":
        return colors.secondary;
      default:
        return colors.text;
    }
  };

  const handleAddTransaction = () => {
    router.push("/transaction/add");
  };

  const renderTransactionItem = ({
    item,
  }: {
    item: TransactionWithCustomer;
  }) => (
    <View style={[styles.transactionCard, { backgroundColor: colors.surface }]}>
      <View style={styles.transactionHeader}>
        <View
          style={[
            styles.transactionIcon,
            { backgroundColor: colors.surfaceVariant },
          ]}
        >
          <IconSymbol
            name={getTransactionIcon(item.type)}
            size={24}
            color={getTransactionColor(item.type)}
          />
        </View>
        <View style={styles.transactionInfo}>
          <ThemedText style={styles.customerName}>
            {item.customerName}
          </ThemedText>
          <ThemedText
            style={[styles.transactionDate, { color: colors.textSecondary }]}
          >
            {formatDate(item.date)}
          </ThemedText>
          {item.description && (
            <ThemedText
              style={[styles.description, { color: colors.textTertiary }]}
            >
              {item.description}
            </ThemedText>
          )}
        </View>
        <View style={styles.transactionAmount}>
          <ThemedText
            style={[
              styles.amountText,
              { color: getTransactionColor(item.type) },
            ]}
          >
            {item.type === "refund" ? "-" : "+"}
            {formatCurrency(item.amount)}
          </ThemedText>
          <ThemedText
            style={[styles.typeText, { color: colors.textSecondary }]}
          >
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </ThemedText>
        </View>
      </View>
    </View>
  );

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

  const renderHeader = () => (
    <View style={styles.header}>
      <ThemedText type="title">Transactions</ThemedText>
      <ThemedText style={styles.transactionCount}>
        {transactionsWithCustomers.length}{" "}
        {transactionsWithCustomers.length === 1
          ? "transaction"
          : "transactions"}
      </ThemedText>
    </View>
  );

  return (
    <ScreenContainer
      containerStyle={styles.container}
      edges={[...edgesHorizontal, ...edgesVertical]}
      contentStyle={styles.content}
      scrollable={false}
      withPadding={false}
    >
      {renderHeader()}

      {transactionsWithCustomers.length === 0 && !loading ? (
        renderEmptyState()
      ) : (
        <FlashList
          data={transactionsWithCustomers}
          renderItem={renderTransactionItem}
          keyExtractor={(item: TransactionWithCustomer) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: colors.primary, shadowColor: colors.text },
        ]}
        onPress={handleAddTransaction}
      >
        <IconSymbol name="plus" size={24} color="white" />
      </TouchableOpacity>
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
  transactionCount: {
    marginTop: rs(4),
    opacity: 0.7,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: rs(100),
    paddingHorizontal: rs(16),
  },
  transactionCard: {
    borderRadius: rs(12),
    padding: rs(16),
    marginBottom: rs(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: rs(1) },
    shadowOpacity: 0.1,
    shadowRadius: rs(2),
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  transactionIcon: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    justifyContent: "center",
    alignItems: "center",
    marginRight: rs(12),
  },
  transactionInfo: {
    flex: 1,
  },
  customerName: {
    fontWeight: "600",
    fontSize: rs(16),
  },
  transactionDate: {
    marginTop: rs(2),
  },
  description: {
    marginTop: rs(4),
    fontStyle: "italic",
  },
  transactionAmount: {
    alignItems: "flex-end",
  },
  amountText: {
    fontWeight: "bold",
    fontSize: rs(16),
  },
  typeText: {
    marginTop: rs(2),
    fontSize: rs(12),
    textTransform: "uppercase",
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
  addButton: {
    paddingHorizontal: rs(24),
    paddingVertical: rs(12),
    borderRadius: rs(8),
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
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
  },
});
