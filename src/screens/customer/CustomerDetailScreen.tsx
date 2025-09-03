import ScreenContainer, {
  edgesHorizontal,
} from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import { ExtendedKlyntlTheme, useKlyntlColors } from "@/constants/KlyntlTheme";
import { useContactActions } from "@/hooks/useContactActions";
import { useCustomer, useCustomers } from "@/hooks/useCustomers";
import { useTransactions } from "@/hooks/useTransactions";
import { getCustomerInitials } from "@/utils/helpers";
import { hp, wp } from "@/utils/responsive_dimensions_system";
import { useRouter } from "expo-router";
import { Alert, ScrollView, View } from "react-native";
import {
  Button,
  Card,
  Divider,
  List,
  SegmentedButtons,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./CustomerDetailScreen.styles";

interface CustomerDetailScreenProps {
  customerId: string;
}

export default function CustomerDetailScreen({
  customerId,
}: CustomerDetailScreenProps) {
  const router = useRouter();

  // Use dedicated customer hook for individual customer lookup
  const customerQuery = useCustomer(customerId);
  const transactionsQuery = useTransactions(customerId);
  const { deleteCustomer } = useCustomers();

  const theme = useTheme<ExtendedKlyntlTheme>();
  const colors = useKlyntlColors(theme);

  // Get data from React Query
  const customer = customerQuery.data;
  const transactions = transactionsQuery.transactions ?? [];
  const loading = customerQuery.isLoading || transactionsQuery.isLoading;
  const error = customerQuery.error || transactionsQuery.error;

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

  // useContactActions hook
  const { handleCall, handleSMS, handleWhatsApp } = useContactActions(
    customer?.phone ?? null
  );

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
              deleteCustomer(customer.id);
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
        style={[styles.container, { backgroundColor: colors.paper.background }]}
      >
        <Surface style={styles.loadingContainer} elevation={0}>
          <Text
            variant="bodyLarge"
            style={{ color: colors.paper.onBackground }}
          >
            Loading customer details...
          </Text>
        </Surface>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.paper.background }]}
      >
        <Surface style={styles.errorContainer} elevation={0}>
          <Text
            variant="bodyLarge"
            style={{ color: colors.paper.onBackground }}
          >
            {error instanceof Error && error.message === "Customer not found"
              ? "Customer not found"
              : "Error loading customer details"}
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

  if (!customer) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.paper.background }]}
      >
        <Surface style={styles.errorContainer} elevation={0}>
          <Text
            variant="bodyLarge"
            style={{ color: colors.paper.onBackground }}
          >
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
    <ScreenContainer withPadding={false} edges={[...edgesHorizontal, "bottom"]}>
      <Surface style={styles.content} elevation={0}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Customer Header */}
          <Card
            style={[
              styles.customerHeader,
              {
                backgroundColor: colors.primary[50],
                borderWidth: 1,
                borderColor: colors.primary[100],
              },
            ]}
            elevation={0}
            mode="elevated"
          >
            <Card.Content style={styles.customerContent}>
              <Surface
                style={[
                  styles.customerAvatar,
                  {
                    backgroundColor: colors.primary[600],
                  },
                ]}
                elevation={0}
              >
                <Text
                  variant="headlineMedium"
                  style={[styles.avatarText, { color: colors.paper.onPrimary }]}
                >
                  {getCustomerInitials(customer.name)}
                </Text>
              </Surface>
              <View style={styles.customerInfo}>
                <ThemedText
                  type="h2"
                  style={{
                    color: colors.paper.onBackground,
                    fontWeight: "700",
                  }}
                >
                  {customer.name}
                </ThemedText>
                <ThemedText
                  style={[styles.customerPhone, { color: colors.neutral[600] }]}
                >
                  {customer.phone}
                </ThemedText>
                {customer.email && (
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.customerEmail,
                      { color: colors.neutral[600] },
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
                      { color: colors.neutral[600] },
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
            <View
              style={{
                borderRadius: wp(40),
                overflow: "hidden",
              }}
            >
              <Surface elevation={1}>
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
          </View>

          {/* Customer Stats */}
          <View style={styles.statsContainer}>
            <Card
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.paper.surface,
                  borderWidth: 1,
                  borderColor: colors.primary[100],
                },
              ]}
              elevation={0}
              mode="elevated"
            >
              <Card.Content style={styles.statCardContent}>
                <Text
                  variant="headlineSmall"
                  style={[
                    styles.statValue,
                    {
                      color: colors.primary[600],
                      textShadowColor: colors.primary[100],
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 1,
                    },
                  ]}
                >
                  {formatCurrency(customer.totalSpent)}
                </Text>
                <Text
                  variant="bodySmall"
                  style={[styles.statLabel, { color: colors.neutral[600] }]}
                >
                  Total Spent
                </Text>
              </Card.Content>
            </Card>
            <Card
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.paper.surface,
                  borderWidth: 1,
                  borderColor: colors.secondary[100],
                },
              ]}
              elevation={0}
              mode="elevated"
            >
              <Card.Content style={styles.statCardContent}>
                <Text
                  variant="headlineSmall"
                  style={[
                    styles.statValue,
                    {
                      color: colors.secondary[600],
                      textShadowColor: colors.secondary[100],
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 1,
                    },
                  ]}
                >
                  {transactions.length}
                </Text>
                <Text
                  variant="bodySmall"
                  style={[styles.statLabel, { color: colors.neutral[600] }]}
                >
                  Transactions
                </Text>
              </Card.Content>
            </Card>
            <Card
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.paper.surface,
                  borderWidth: 1,
                  borderColor: colors.accent[100],
                },
              ]}
              elevation={0}
              mode="elevated"
            >
              <Card.Content style={styles.statCardContent}>
                <Text
                  variant="titleMedium"
                  style={[
                    styles.statValue,
                    {
                      color: colors.accent[600],
                      textShadowColor: colors.accent[100],
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 1,
                    },
                  ]}
                >
                  {customer.lastPurchase
                    ? formatDate(customer.lastPurchase)
                    : "Never"}
                </Text>
                <Text
                  variant="bodySmall"
                  style={[styles.statLabel, { color: colors.neutral[600] }]}
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
                style={[
                  styles.sectionTitle,
                  { color: colors.paper.onBackground },
                ]}
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
                  {
                    backgroundColor: colors.neutral[50],
                    borderWidth: 2,
                    borderColor: colors.primary[100],
                    borderStyle: "dashed",
                  },
                ]}
                mode="elevated"
                elevation={0}
              >
                <Card.Content style={styles.emptyTransactionsContent}>
                  <Text
                    variant="titleMedium"
                    style={[styles.emptyText, { color: colors.neutral[600] }]}
                  >
                    No transactions yet
                  </Text>
                  <Button
                    mode="contained"
                    onPress={handleAddTransaction}
                    style={styles.firstTransactionButton}
                    contentStyle={{
                      paddingVertical: hp(10),
                      paddingHorizontal: hp(32),
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
                  {
                    backgroundColor: colors.paper.surface,
                    borderWidth: 1,
                    borderColor: colors.primary[100],
                  },
                ]}
                mode="elevated"
                elevation={0}
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
                        color: colors.paper.onBackground,
                        fontWeight: "600",
                        fontSize: 16,
                      }}
                      descriptionStyle={{
                        color: colors.neutral[600],
                        fontSize: 14,
                      }}
                      style={{ paddingVertical: 16, paddingHorizontal: 20 }}
                    />
                    {index < transactions.slice(0, 5).length - 1 && (
                      <Divider
                        style={{ backgroundColor: colors.paper.outline }}
                      />
                    )}
                  </View>
                ))}
                {transactions.length > 5 && (
                  <>
                    <Divider
                      style={{ backgroundColor: colors.paper.outline }}
                    />
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
              style={[
                styles.sectionTitle,
                { color: colors.paper.onBackground },
              ]}
            >
              Customer Details
            </Text>
            <Card
              style={[
                styles.detailsCard,
                {
                  backgroundColor: colors.paper.surface,
                  borderWidth: 1,
                  borderColor: colors.primary[100],
                },
              ]}
              mode="elevated"
              elevation={0}
            >
              <Card.Content style={{ padding: 20 }}>
                <View style={styles.detailRow}>
                  <Text
                    variant="bodyMedium"
                    style={[styles.detailLabel, { color: colors.neutral[600] }]}
                  >
                    Customer ID:
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.detailValue,
                      { color: colors.paper.onBackground },
                    ]}
                  >
                    {customer.id}
                  </Text>
                </View>
                <Divider
                  style={{
                    backgroundColor: colors.paper.outline,
                    marginVertical: 12,
                  }}
                />
                <View style={styles.detailRow}>
                  <Text
                    variant="bodyMedium"
                    style={[styles.detailLabel, { color: colors.neutral[600] }]}
                  >
                    Created:
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.detailValue,
                      { color: colors.paper.onBackground },
                    ]}
                  >
                    {formatDate(customer.createdAt)}
                  </Text>
                </View>
                <Divider
                  style={{
                    backgroundColor: colors.paper.outline,
                    marginVertical: 12,
                  }}
                />
                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                  <Text
                    variant="bodyMedium"
                    style={[styles.detailLabel, { color: colors.neutral[600] }]}
                  >
                    Last Updated:
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.detailValue,
                      { color: colors.paper.onBackground },
                    ]}
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
                {
                  backgroundColor: colors.primary[600],
                  elevation: 2,
                },
              ]}
              contentStyle={styles.bottomButtonContent}
              labelStyle={{
                color: colors.paper.onPrimary,
                fontWeight: "600",
                fontSize: 16,
              }}
            >
              Edit Customer
            </Button>
            <Button
              mode="outlined"
              icon="trash-can"
              onPress={handleDelete}
              style={[
                styles.deleteButton,
                {
                  borderColor: colors.error[600],
                  borderWidth: 2,
                },
              ]}
              contentStyle={styles.bottomButtonContent}
              labelStyle={{
                color: colors.error[600],
                fontWeight: "600",
                fontSize: 16,
              }}
            >
              Delete
            </Button>
          </View>
        </ScrollView>
      </Surface>
    </ScreenContainer>
  );
}
