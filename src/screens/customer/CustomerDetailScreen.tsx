import { useAppTheme } from "@/components/ThemeProvider";
import { useCustomers } from "@/hooks/useCustomers";
import { useTransactions } from "@/hooks/useTransactions";
import { Customer } from "@/types/customer";
import { getCustomerInitials } from "@/utils/helpers";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Linking, SafeAreaView, ScrollView, View } from "react-native";
import {
  Button,
  Card,
  Divider,
  List,
  SegmentedButtons,
  Surface,
  Text,
} from "react-native-paper";
import { styles } from "./CustomerDetailScreen.styles";

interface CustomerDetailScreenProps {
  customerId: string;
}

export default function CustomerDetailScreen({
  customerId,
}: CustomerDetailScreenProps) {
  const router = useRouter();

  // Use React Query hooks
  const customersQuery = useCustomers();
  const transactionsQuery = useTransactions(customerId);
  const { deleteCustomer } = useCustomers();

  const { colors } = useAppTheme();

  const [customer, setCustomer] = useState<Customer | null>(null);

  // Get data from React Query
  const customers = customersQuery.customers;
  const transactions = transactionsQuery.transactions ?? [];
  const loading = customersQuery.isLoading || transactionsQuery.isLoading;
  // Find customer when data is available
  useEffect(() => {
    if (customerId && customers.length > 0) {
      const foundCustomer = customers.find((c) => c.id === customerId);
      if (foundCustomer) {
        setCustomer(foundCustomer);
      } else {
        Alert.alert("Error", "Customer not found", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    }
  }, [customerId, customers, router]);

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
    router.push(`/transaction/add?customerId=${customerId}`);
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
            elevation={1}
            mode="elevated"
          >
            <Card.Content style={styles.customerContent}>
              <Surface
                style={[
                  styles.customerAvatar,
                  { backgroundColor: colors.primary },
                ]}
                elevation={2}
              >
                <Text
                  variant="headlineMedium"
                  style={[styles.avatarText, { color: "#FFFFFF" }]}
                >
                  {getCustomerInitials(customer.name)}
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
              elevation={1}
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
              elevation={1}
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
              elevation={1}
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
              elevation={1}
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
                      paddingVertical: 10,
                      paddingHorizontal: 30,
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
              style={[styles.editButton, { backgroundColor: colors.primary }]}
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
      </Surface>
    </SafeAreaView>
  );
}
