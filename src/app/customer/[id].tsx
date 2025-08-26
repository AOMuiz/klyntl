import { useAppTheme } from "@/components/ThemeProvider";
import { useCustomerStore } from "@/stores/customerStore";
import { useTransactionStore } from "@/stores/transactionStore";
import { Customer } from "@/types/customer";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  Card,
  Divider,
  List,
  SegmentedButtons,
  Surface,
  Text,
} from "react-native-paper";

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getCustomerById, deleteCustomer, clearError } = useCustomerStore();
  const { fetchTransactions, transactions } = useTransactionStore();
  const { colors } = useAppTheme();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCustomerData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      clearError();

      // Load customer and transactions in parallel
      const [customerData] = await Promise.all([
        getCustomerById(id),
        fetchTransactions(id), // This updates the store's transactions state
      ]);

      setCustomer(customerData);
    } catch (error) {
      console.error("Failed to load customer data:", error);
      Alert.alert("Error", "Failed to load customer information");
    } finally {
      setLoading(false);
    }
  }, [id, getCustomerById, clearError, fetchTransactions]);

  useFocusEffect(
    useCallback(() => {
      // Only reload if customer might be stale (useful for when returning from edit screen)
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

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Surface style={styles.loadingContainer} elevation={0}>
          <Text variant="bodyLarge" style={{ color: colors.text }}>
            Loading customer details...
          </Text>
        </Surface>
      </SafeAreaView>
    );
  }

  if (!customer) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Surface style={styles.errorContainer} elevation={0}>
          <Text variant="bodyLarge" style={{ color: colors.text }}>
            Customer not found
          </Text>
          <Button
            mode="contained"
            onPress={() => router.back()}
            style={styles.backButton}
            contentStyle={styles.backButtonContent}
          >
            Go Back
          </Button>
        </Surface>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Surface style={styles.content} elevation={0}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Customer Header */}
          <Card
            style={[styles.customerHeader, { backgroundColor: colors.surface }]}
            elevation={3}
            mode="elevated"
          >
            <Card.Content style={styles.customerContent}>
              <Surface
                style={[
                  styles.customerAvatar,
                  { backgroundColor: colors.primary },
                ]}
                elevation={4}
              >
                <Text
                  variant="headlineMedium"
                  style={[styles.avatarText, { color: "#FFFFFF" }]}
                >
                  {customer.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </Text>
              </Surface>
              <View style={styles.customerInfo}>
                <Text
                  variant="headlineSmall"
                  style={{ color: colors.text, fontWeight: "700" }}
                >
                  {customer.name}
                </Text>
                <Text
                  variant="bodyLarge"
                  style={[
                    styles.customerPhone,
                    { color: colors.textSecondary },
                  ]}
                >
                  {customer.phone}
                </Text>
                {customer.email && (
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.customerEmail,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {customer.email}
                  </Text>
                )}
                {customer.address && (
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.customerAddress,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {customer.address}
                  </Text>
                )}
              </View>
            </Card.Content>
          </Card>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <Surface
              style={{ borderRadius: 20, overflow: "hidden" }}
              elevation={2}
            >
              <SegmentedButtons
                value=""
                onValueChange={() => {}}
                buttons={[
                  {
                    value: "call",
                    label: "Call",
                    icon: "phone",
                    onPress: handleCall,
                  },
                  {
                    value: "sms",
                    label: "SMS",
                    icon: "message",
                    onPress: handleSMS,
                  },
                  {
                    value: "whatsapp",
                    label: "WhatsApp",
                    icon: "whatsapp",
                    onPress: handleWhatsApp,
                  },
                ]}
                style={styles.segmentedButtons}
              />
            </Surface>
          </View>

          {/* Customer Stats */}
          <View style={styles.statsContainer}>
            <Card
              style={[styles.statCard, { backgroundColor: colors.surface }]}
              elevation={3}
              mode="elevated"
            >
              <Card.Content style={styles.statCardContent}>
                <Text
                  variant="headlineSmall"
                  style={[styles.statValue, { color: colors.primary }]}
                >
                  {formatCurrency(customer.totalSpent)}
                </Text>
                <Text
                  variant="bodySmall"
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Total Spent
                </Text>
              </Card.Content>
            </Card>
            <Card
              style={[styles.statCard, { backgroundColor: colors.surface }]}
              elevation={3}
              mode="elevated"
            >
              <Card.Content style={styles.statCardContent}>
                <Text
                  variant="headlineSmall"
                  style={[styles.statValue, { color: colors.primary }]}
                >
                  {transactions.length}
                </Text>
                <Text
                  variant="bodySmall"
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Transactions
                </Text>
              </Card.Content>
            </Card>
            <Card
              style={[styles.statCard, { backgroundColor: colors.surface }]}
              elevation={3}
              mode="elevated"
            >
              <Card.Content style={styles.statCardContent}>
                <Text
                  variant="titleMedium"
                  style={[styles.statValue, { color: colors.primary }]}
                >
                  {customer.lastPurchase
                    ? formatDate(customer.lastPurchase)
                    : "Never"}
                </Text>
                <Text
                  variant="bodySmall"
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Last Purchase
                </Text>
              </Card.Content>
            </Card>
          </View>

          {/* Recent Transactions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                variant="headlineSmall"
                style={[styles.sectionTitle, { color: colors.text }]}
              >
                Recent Transactions
              </Text>
              <Button
                mode="contained"
                icon="plus"
                onPress={handleAddTransaction}
                compact
                style={styles.addTransactionButton}
              >
                Add
              </Button>
            </View>

            {transactions.length === 0 ? (
              <Card
                style={[
                  styles.emptyTransactions,
                  { backgroundColor: colors.surface },
                ]}
                elevation={3}
                mode="elevated"
              >
                <Card.Content style={styles.emptyTransactionsContent}>
                  <Text
                    variant="titleMedium"
                    style={[styles.emptyText, { color: colors.textSecondary }]}
                  >
                    No transactions yet
                  </Text>
                  <Button
                    mode="contained"
                    onPress={handleAddTransaction}
                    style={styles.firstTransactionButton}
                    contentStyle={{
                      paddingVertical: 12,
                      paddingHorizontal: 32,
                    }}
                  >
                    Add First Transaction
                  </Button>
                </Card.Content>
              </Card>
            ) : (
              <Card
                style={[
                  styles.transactionsList,
                  { backgroundColor: colors.surface },
                ]}
                elevation={3}
                mode="elevated"
              >
                {transactions.slice(0, 5).map((transaction, index) => (
                  <View key={transaction.id}>
                    <List.Item
                      title={formatDate(transaction.date)}
                      description={
                        transaction.description ||
                        transaction.type.charAt(0).toUpperCase() +
                          transaction.type.slice(1)
                      }
                      right={() => (
                        <Text
                          variant="titleMedium"
                          style={[
                            styles.transactionAmount,
                            {
                              color:
                                transaction.type === "refund"
                                  ? colors.error
                                  : "#34C759",
                            },
                          ]}
                        >
                          {transaction.type === "refund" ? "-" : "+"}
                          {formatCurrency(transaction.amount)}
                        </Text>
                      )}
                      titleStyle={{
                        color: colors.text,
                        fontWeight: "600",
                        fontSize: 16,
                      }}
                      descriptionStyle={{
                        color: colors.textSecondary,
                        fontSize: 14,
                      }}
                      style={{ paddingVertical: 16, paddingHorizontal: 20 }}
                    />
                    {index < transactions.slice(0, 5).length - 1 && (
                      <Divider style={{ backgroundColor: colors.divider }} />
                    )}
                  </View>
                ))}
                {transactions.length > 5 && (
                  <>
                    <Divider style={{ backgroundColor: colors.divider }} />
                    <Button
                      mode="text"
                      onPress={() => {}} // TODO: Navigate to all transactions
                      style={styles.viewAllButton}
                      contentStyle={{ paddingVertical: 12 }}
                    >
                      View All Transactions
                    </Button>
                  </>
                )}
              </Card>
            )}
          </View>

          {/* Customer Details */}
          <View style={styles.section}>
            <Text
              variant="headlineSmall"
              style={[styles.sectionTitle, { color: colors.text }]}
            >
              Customer Details
            </Text>
            <Card
              style={[styles.detailsCard, { backgroundColor: colors.surface }]}
              elevation={3}
              mode="elevated"
            >
              <Card.Content style={{ padding: 20 }}>
                <View style={styles.detailRow}>
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.detailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Customer ID:
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={[styles.detailValue, { color: colors.text }]}
                  >
                    {customer.id}
                  </Text>
                </View>
                <Divider
                  style={{
                    backgroundColor: colors.divider,
                    marginVertical: 12,
                  }}
                />
                <View style={styles.detailRow}>
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.detailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Created:
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={[styles.detailValue, { color: colors.text }]}
                  >
                    {formatDate(customer.createdAt)}
                  </Text>
                </View>
                <Divider
                  style={{
                    backgroundColor: colors.divider,
                    marginVertical: 12,
                  }}
                />
                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.detailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Last Updated:
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={[styles.detailValue, { color: colors.text }]}
                  >
                    {formatDate(customer.updatedAt)}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </View>

          {/* Action Buttons */}
          <View style={styles.bottomActions}>
            <Button
              mode="contained"
              icon="pencil"
              onPress={handleEdit}
              style={[
                styles.editButton,
                { backgroundColor: colors.primary },
                // getResponsiveFontSize
              ]}
              contentStyle={styles.bottomButtonContent}
            >
              Edit Customer
            </Button>
            <Button
              mode="contained"
              icon="trash-can"
              onPress={handleDelete}
              style={[styles.deleteButton, { backgroundColor: colors.error }]}
              contentStyle={styles.bottomButtonContent}
            >
              Delete
            </Button>
          </View>
        </ScrollView>

        {/* FAB for adding transactions */}
        {/* <Portal>
          <FAB
            icon="plus"
            label="Add Transaction"
            onPress={handleAddTransaction}
            style={[styles.fab, { backgroundColor: colors.secondary, }]}
            mode="elevated"
          />
        </Portal> */}
      </Surface>
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
    marginTop: 24,
    borderRadius: 12,
  },
  backButtonContent: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  scrollView: {
    flex: 1,
  },
  customerHeader: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  customerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
  },
  customerAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  avatarText: {
    fontWeight: "700",
    letterSpacing: 0.5,
    fontSize: 24,
  },
  customerInfo: {
    flex: 1,
    justifyContent: "center",
  },
  customerPhone: {
    marginTop: 6,
    fontWeight: "500",
    fontSize: 16,
  },
  customerEmail: {
    marginTop: 4,
    fontSize: 14,
  },
  customerAddress: {
    marginTop: 4,
    lineHeight: 20,
    fontSize: 14,
  },
  actionButtonsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  segmentedButtons: {
    borderRadius: 12,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  statCardContent: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  statValue: {
    fontWeight: "700",
    marginBottom: 6,
    fontSize: 18,
  },
  statLabel: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 22,
  },
  addTransactionButton: {
    borderRadius: 20,
    minWidth: 80,
  },
  emptyTransactions: {
    borderRadius: 16,
    overflow: "hidden",
  },
  emptyTransactionsContent: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyText: {
    marginBottom: 20,
    textAlign: "center",
    fontSize: 16,
  },
  firstTransactionButton: {
    borderRadius: 12,
    paddingHorizontal: 32,
  },
  transactionsList: {
    borderRadius: 16,
    overflow: "hidden",
  },
  transactionAmount: {
    fontWeight: "700",
    fontSize: 16,
  },
  viewAllButton: {
    marginVertical: 8,
    borderRadius: 0,
  },
  detailsCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  detailValue: {
    fontWeight: "600",
    fontSize: 15,
    textAlign: "right",
    flex: 1,
    marginLeft: 20,
  },
  bottomActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 120, // Space for FAB
    gap: 16,
  },
  editButton: {
    flex: 2,
    borderRadius: 50,
  },
  deleteButton: {
    flex: 1,
    borderRadius: 50,
  },
  bottomButtonContent: {
    paddingVertical: 10,
  },
  fab: {
    position: "absolute",
    margin: 20,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
});
