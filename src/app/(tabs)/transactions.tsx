import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useCustomers, useTransactions } from "@/services/database/context";
import { Customer } from "@/types/customer";
import { Transaction } from "@/types/transaction";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface TransactionWithCustomer extends Transaction {
  customerName?: string;
}

export default function TransactionsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { getTransactions } = useTransactions();
  const { getCustomers } = useCustomers();

  const [transactions, setTransactions] = useState<TransactionWithCustomer[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const [transactionList, customerList] = await Promise.all([
        getTransactions(),
        getCustomers(),
      ]);

      // Create a map of customer IDs to names for quick lookup
      const customerMap = new Map<string, string>();
      customerList.forEach((customer: Customer) => {
        customerMap.set(customer.id, customer.name);
      });

      // Add customer names to transactions
      const transactionsWithCustomers = transactionList.map(
        (transaction: Transaction) => ({
          ...transaction,
          customerName:
            customerMap.get(transaction.customerId) || "Unknown Customer",
        })
      );

      setTransactions(transactionsWithCustomers);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [getTransactions, getCustomers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  }, [loadTransactions]);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
  };

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
        return "#34C759";
      case "refund":
        return "#FF3B30";
      case "payment":
        return "#007AFF";
      default:
        return Colors[colorScheme ?? "light"].text;
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
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionIcon}>
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
          <ThemedText style={styles.transactionDate}>
            {formatDate(item.date)}
          </ThemedText>
          {item.description && (
            <ThemedText style={styles.description}>
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
          <ThemedText style={styles.typeText}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </ThemedText>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconSymbol
        name="list.bullet"
        size={64}
        color={Colors[colorScheme ?? "light"].tabIconDefault}
      />
      <ThemedText type="title" style={styles.emptyTitle}>
        No transactions yet
      </ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        Start recording your first transaction
      </ThemedText>
      <TouchableOpacity style={styles.addButton} onPress={handleAddTransaction}>
        <ThemedText style={styles.addButtonText}>Add Transaction</ThemedText>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <ThemedText type="title">Transactions</ThemedText>
      <ThemedText style={styles.transactionCount}>
        {transactions.length}{" "}
        {transactions.length === 1 ? "transaction" : "transactions"}
      </ThemedText>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content}>
        {renderHeader()}

        {transactions.length === 0 && !loading ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={transactions}
            renderItem={renderTransactionItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        <TouchableOpacity style={styles.fab} onPress={handleAddTransaction}>
          <IconSymbol name="plus" size={24} color="white" />
        </TouchableOpacity>
      </ThemedView>
    </SafeAreaView>
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
    padding: 16,
    paddingBottom: 8,
  },
  transactionCount: {
    marginTop: 4,
    opacity: 0.7,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  transactionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  customerName: {
    fontWeight: "600",
    fontSize: 16,
  },
  transactionDate: {
    opacity: 0.7,
    marginTop: 2,
  },
  description: {
    opacity: 0.8,
    marginTop: 4,
    fontStyle: "italic",
  },
  transactionAmount: {
    alignItems: "flex-end",
  },
  amountText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  typeText: {
    opacity: 0.7,
    marginTop: 2,
    fontSize: 12,
    textTransform: "uppercase",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    right: 16,
    bottom: 16,
    backgroundColor: "#007AFF",
    borderRadius: 28,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
