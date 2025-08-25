import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useCustomers, useTransactions } from "@/services/database/context";
import { Customer } from "@/types/customer";
import { Transaction } from "@/types/transaction";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getCustomerById, deleteCustomer } = useCustomers();
  const { getTransactions } = useTransactions();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCustomerData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [customerData, customerTransactions] = await Promise.all([
        getCustomerById(id),
        getTransactions(id),
      ]);

      setCustomer(customerData);
      setTransactions(customerTransactions);
    } catch (error) {
      console.error("Failed to load customer data:", error);
      Alert.alert("Error", "Failed to load customer information");
    } finally {
      setLoading(false);
    }
  }, [id, getCustomerById, getTransactions]);

  useFocusEffect(
    useCallback(() => {
      loadCustomerData();
    }, [loadCustomerData])
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

  const handleCall = () => {
    if (customer?.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    }
  };

  const handleSMS = () => {
    if (customer?.phone) {
      Linking.openURL(`sms:${customer.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (customer?.phone) {
      const phoneNumber = customer.phone.replace(/\+/g, "").replace(/\s/g, "");
      Linking.openURL(`whatsapp://send?phone=${phoneNumber}`);
    }
  };

  const handleEdit = () => {
    if (customer) {
      router.push(`/customer/edit/${customer.id}`);
    }
  };

  const handleDelete = () => {
    if (!customer) return;

    Alert.alert(
      "Delete Customer",
      `Are you sure you want to delete ${customer.name}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCustomer(customer.id);
              Alert.alert("Success", "Customer deleted successfully");
              router.back();
            } catch (error) {
              console.error("Failed to delete customer:", error);
              Alert.alert("Error", "Failed to delete customer");
            }
          },
        },
      ]
    );
  };

  const handleAddTransaction = () => {
    router.push(`/transaction/add?customerId=${id}`);
  };

  const renderTransactionItem = (transaction: Transaction) => (
    <View key={transaction.id} style={styles.transactionItem}>
      <View style={styles.transactionInfo}>
        <ThemedText style={styles.transactionDate}>
          {formatDate(transaction.date)}
        </ThemedText>
        {transaction.description && (
          <ThemedText style={styles.transactionDescription}>
            {transaction.description}
          </ThemedText>
        )}
        <ThemedText style={styles.transactionType}>
          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
        </ThemedText>
      </View>
      <ThemedText
        style={[
          styles.transactionAmount,
          { color: transaction.type === "refund" ? "#FF3B30" : "#34C759" },
        ]}
      >
        {transaction.type === "refund" ? "-" : "+"}
        {formatCurrency(transaction.amount)}
      </ThemedText>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText>Loading customer details...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (!customer) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.errorContainer}>
          <ThemedText>Customer not found</ThemedText>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Customer Header */}
          <View style={styles.customerHeader}>
            <View style={styles.customerAvatar}>
              <ThemedText style={styles.avatarText}>
                {customer.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </ThemedText>
            </View>
            <View style={styles.customerInfo}>
              <ThemedText type="title">{customer.name}</ThemedText>
              <ThemedText style={styles.customerPhone}>
                {customer.phone}
              </ThemedText>
              {customer.email && (
                <ThemedText style={styles.customerEmail}>
                  {customer.email}
                </ThemedText>
              )}
              {customer.address && (
                <ThemedText style={styles.customerAddress}>
                  {customer.address}
                </ThemedText>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <IconSymbol name="phone.fill" size={20} color="white" />
              <ThemedText style={styles.actionButtonText}>Call</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleSMS}>
              <IconSymbol name="message.fill" size={20} color="white" />
              <ThemedText style={styles.actionButtonText}>SMS</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleWhatsApp}
            >
              <IconSymbol name="bubble.left.fill" size={20} color="white" />
              <ThemedText style={styles.actionButtonText}>WhatsApp</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Customer Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>
                {formatCurrency(customer.totalSpent)}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Total Spent</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>
                {transactions.length}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Transactions</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>
                {customer.lastPurchase
                  ? formatDate(customer.lastPurchase)
                  : "Never"}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Last Purchase</ThemedText>
            </View>
          </View>

          {/* Recent Transactions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">Recent Transactions</ThemedText>
              <TouchableOpacity
                style={styles.addTransactionButton}
                onPress={handleAddTransaction}
              >
                <IconSymbol name="plus" size={16} color="white" />
                <ThemedText style={styles.addTransactionText}>Add</ThemedText>
              </TouchableOpacity>
            </View>

            {transactions.length === 0 ? (
              <View style={styles.emptyTransactions}>
                <ThemedText style={styles.emptyText}>
                  No transactions yet
                </ThemedText>
                <TouchableOpacity
                  style={styles.firstTransactionButton}
                  onPress={handleAddTransaction}
                >
                  <ThemedText style={styles.firstTransactionText}>
                    Add First Transaction
                  </ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.transactionsList}>
                {transactions.slice(0, 5).map(renderTransactionItem)}
                {transactions.length > 5 && (
                  <TouchableOpacity style={styles.viewAllButton}>
                    <ThemedText style={styles.viewAllText}>
                      View All Transactions
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Customer Details */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Customer Details
            </ThemedText>
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Customer ID:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {customer.id}
                </ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Created:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {formatDate(customer.createdAt)}
                </ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>
                  Last Updated:
                </ThemedText>
                <ThemedText style={styles.detailValue}>
                  {formatDate(customer.updatedAt)}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <IconSymbol name="pencil" size={16} color="white" />
              <ThemedText style={styles.editButtonText}>
                Edit Customer
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <IconSymbol name="trash.fill" size={16} color="white" />
              <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  backButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  backButtonText: {
    color: "white",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  customerHeader: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  customerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  customerInfo: {
    flex: 1,
  },
  customerPhone: {
    marginTop: 4,
    opacity: 0.8,
  },
  customerEmail: {
    marginTop: 2,
    opacity: 0.7,
  },
  customerAddress: {
    marginTop: 2,
    opacity: 0.7,
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#007AFF",
  },
  statLabel: {
    marginTop: 4,
    opacity: 0.7,
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  addTransactionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#34C759",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addTransactionText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyTransactions: {
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    opacity: 0.7,
    marginBottom: 16,
  },
  firstTransactionButton: {
    backgroundColor: "#34C759",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  firstTransactionText: {
    color: "white",
    fontWeight: "600",
  },
  transactionsList: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    overflow: "hidden",
  },
  transactionItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDate: {
    fontWeight: "600",
  },
  transactionDescription: {
    opacity: 0.7,
    marginTop: 2,
  },
  transactionType: {
    opacity: 0.6,
    marginTop: 4,
    fontSize: 12,
    textTransform: "uppercase",
  },
  transactionAmount: {
    fontWeight: "bold",
    fontSize: 16,
  },
  viewAllButton: {
    padding: 16,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  viewAllText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  detailsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  detailLabel: {
    opacity: 0.7,
  },
  detailValue: {
    fontWeight: "600",
  },
  bottomActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 8,
    gap: 6,
  },
  editButtonText: {
    color: "white",
    fontWeight: "600",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF3B30",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 6,
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "600",
  },
});
