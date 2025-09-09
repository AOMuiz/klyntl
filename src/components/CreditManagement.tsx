import { ExtendedKlyntlTheme, useKlyntlColors } from "@/constants/KlyntlTheme";
import { createDatabaseService } from "@/services/database";
import { useDatabase } from "@/services/database/hooks";
import { Customer } from "@/types/customer";
import { formatCurrency } from "@/utils/currency";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  Divider,
  List,
  Text,
  useTheme,
} from "react-native-paper";

interface CreditManagementProps {
  customer: Customer;
  onClose?: () => void;
}

interface CreditHistoryItem {
  id: string;
  type: string;
  amount: number;
  created_at: string;
  metadata?: any;
}

export const CreditManagement: React.FC<CreditManagementProps> = ({
  customer,
  onClose,
}) => {
  const { db } = useDatabase();
  const theme = useTheme<ExtendedKlyntlTheme>();
  const colors = useKlyntlColors(theme);
  const databaseService = db ? createDatabaseService(db) : undefined;

  const [creditBalance, setCreditBalance] = useState(0);
  const [creditSummary, setCreditSummary] = useState({
    currentBalance: 0,
    totalEarned: 0,
    totalUsed: 0,
    lastActivity: null as string | null,
  });
  const [creditHistory, setCreditHistory] = useState<CreditHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCreditData = useCallback(async () => {
    if (!databaseService) return;

    try {
      setLoading(true);
      const [balance, summary, history] = await Promise.all([
        databaseService.payment.getCreditBalance(customer.id),
        // SimplePaymentService doesn't have getCreditSummary - use a simple summary
        Promise.resolve({
          currentBalance: customer.creditBalance || 0,
          totalEarned: customer.creditBalance || 0, // Simplified - not tracked separately
          totalUsed: 0, // Simplified - not tracked in SimplePaymentService
          lastActivity: null, // Simplified - not tracked in SimplePaymentService
        }),
        databaseService.payment.getPaymentHistory(customer.id),
      ]);

      setCreditBalance(balance);
      setCreditSummary(summary);
      setCreditHistory(history);
    } catch (error) {
      console.error("Failed to load credit data:", error);
      Alert.alert("Error", "Failed to load credit information");
    } finally {
      setLoading(false);
    }
  }, [databaseService, customer.id, customer.creditBalance]);

  useEffect(() => {
    loadCreditData();
  }, [loadCreditData]);

  const getHistoryItemIcon = (type: string) => {
    switch (type) {
      case "over_payment":
        return "plus-circle";
      case "credit_used":
      case "credit_applied_to_sale":
        return "minus-circle";
      default:
        return "circle";
    }
  };

  const getHistoryItemColor = (type: string) => {
    switch (type) {
      case "over_payment":
        return colors.success[600];
      case "credit_used":
      case "credit_applied_to_sale":
        return colors.error[600];
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getHistoryItemTitle = (type: string) => {
    switch (type) {
      case "over_payment":
        return "Credit Earned";
      case "credit_used":
        return "Credit Used";
      case "credit_applied_to_sale":
        return "Applied to Purchase";
      case "payment_applied":
        return "Payment Applied";
      default:
        return type.replace("_", " ").toUpperCase();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading credit information...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Credit Balance Card */}
      <Card style={styles.balanceCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.customerName}>
            {customer.name}
          </Text>
          <View style={styles.balanceContainer}>
            <Text variant="headlineMedium" style={styles.balanceAmount}>
              {formatCurrency(creditBalance)}
            </Text>
            <Text variant="bodyLarge" style={styles.balanceLabel}>
              Available Credit
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Credit Summary */}
      <Card style={styles.summaryCard}>
        <Card.Title title="Credit Summary" />
        <Card.Content>
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium">Total Earned</Text>
            <Text variant="bodyMedium" style={{ color: colors.success[600] }}>
              {formatCurrency(creditSummary.totalEarned)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium">Total Used</Text>
            <Text variant="bodyMedium" style={{ color: colors.error[600] }}>
              {formatCurrency(creditSummary.totalUsed)}
            </Text>
          </View>
          {creditSummary.lastActivity && (
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium">Last Activity</Text>
              <Text variant="bodySmall">
                {formatDate(creditSummary.lastActivity)}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Credit History */}
      <Card style={styles.historyCard}>
        <Card.Title title="Credit History" />
        <Card.Content style={styles.historyContent}>
          {creditHistory.length === 0 ? (
            <Text variant="bodyMedium" style={styles.noHistory}>
              No credit activity yet
            </Text>
          ) : (
            creditHistory.map((item, index) => (
              <React.Fragment key={item.id}>
                <List.Item
                  title={getHistoryItemTitle(item.type)}
                  description={formatDate(item.created_at)}
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon={getHistoryItemIcon(item.type)}
                      color={getHistoryItemColor(item.type)}
                    />
                  )}
                  right={() => (
                    <Text
                      variant="bodyMedium"
                      style={{
                        color: getHistoryItemColor(item.type),
                        fontWeight: "bold",
                      }}
                    >
                      {item.type === "over_payment" ? "+" : "-"}
                      {formatCurrency(item.amount)}
                    </Text>
                  )}
                />
                {index < creditHistory.length - 1 && <Divider />}
              </React.Fragment>
            ))
          )}
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <Button
          mode="outlined"
          onPress={loadCreditData}
          style={styles.refreshButton}
        >
          Refresh
        </Button>
        {onClose && (
          <Button mode="contained" onPress={onClose} style={styles.closeButton}>
            Close
          </Button>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  balanceCard: {
    marginBottom: 16,
    elevation: 4,
  },
  customerName: {
    textAlign: "center",
    marginBottom: 16,
  },
  balanceContainer: {
    alignItems: "center",
  },
  balanceAmount: {
    fontWeight: "bold",
    color: "#059669", // Success color
  },
  balanceLabel: {
    color: "#6B7280", // Gray color
    marginTop: 4,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  historyCard: {
    marginBottom: 16,
  },
  historyContent: {
    paddingVertical: 0,
  },
  noHistory: {
    textAlign: "center",
    color: "#6B7280",
    fontStyle: "italic",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  refreshButton: {
    flex: 1,
    marginRight: 8,
  },
  closeButton: {
    flex: 1,
    marginLeft: 8,
  },
});
