import { formatCurrency } from "@/utils/currency";
import { getCustomerInitials } from "@/utils/helpers";
import { wp } from "@/utils/responsive_dimensions_system";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Avatar, Card, Text, useTheme } from "react-native-paper";
import { ExtendedKlyntlTheme, useKlyntlColors } from "../constants/KlyntlTheme";
import { Customer } from "../types/customer";

interface CustomerCardProps {
  customer: Customer;
  onPress: () => void;
  onLongPress?: () => void;
  testID?: string;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onPress,
  onLongPress,
  testID,
}) => {
  const theme = useTheme<ExtendedKlyntlTheme>();
  const colors = useKlyntlColors(theme);
  const router = useRouter();

  const formatLastPurchase = (date?: string): string => {
    if (!date) return "No purchases yet";

    const purchaseDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - purchaseDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getTotalSpentColor = (amount: number) => {
    if (amount === 0) return theme.colors.onSurfaceVariant;
    if (amount < 10000) return colors.warning[600];
    if (amount < 50000) return colors.primary[600];
    return colors.success[600];
  };

  const getSpendingTier = (amount: number) => {
    if (amount === 0) return null;
    if (amount < 10000) return "New";
    if (amount < 50000) return "Regular";
    return "VIP";
  };

  const spendingTier = getSpendingTier(customer.totalSpent);

  const handleCreditManagement = () => {
    router.push({
      pathname: "/customer/credit-management",
      params: { customerId: customer.id },
    });
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`Customer ${customer.name}`}
      style={styles.container}
    >
      <Card
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        elevation={0}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <Avatar.Text
                size={56}
                label={getCustomerInitials(customer.name)}
                style={[
                  styles.avatar,
                  { backgroundColor: colors.primary[100] },
                ]}
                labelStyle={[
                  styles.avatarLabel,
                  { color: colors.primary[700] },
                ]}
                testID={`${testID}-avatar`}
              />
              {spendingTier && (
                <View
                  style={[
                    styles.tierBadge,
                    {
                      backgroundColor: getTotalSpentColor(customer.totalSpent),
                    },
                  ]}
                >
                  <Text style={styles.tierText}>{spendingTier}</Text>
                </View>
              )}
            </View>

            <View style={styles.info}>
              <Text
                variant="titleMedium"
                style={[styles.name, { color: theme.colors.onSurface }]}
                testID={`${testID}-name`}
              >
                {customer.name}
              </Text>
              <Text
                variant="bodyMedium"
                style={[styles.phone, { color: theme.colors.onSurfaceVariant }]}
                testID={`${testID}-phone`}
              >
                {customer.phone}
              </Text>
              <Text
                variant="bodySmall"
                style={[
                  styles.lastPurchase,
                  { color: theme.colors.onSurfaceVariant },
                ]}
                testID={`${testID}-last-purchase`}
              >
                {formatLastPurchase(customer.lastPurchase)}
              </Text>
            </View>

            <View style={styles.amount}>
              <Text
                variant="titleMedium"
                style={[
                  styles.totalSpent,
                  { color: getTotalSpentColor(customer.totalSpent) },
                ]}
                testID={`${testID}-total-spent`}
              >
                {formatCurrency(customer.totalSpent, { short: true })}
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
              >
                Total Spent
              </Text>
              {customer.outstandingBalance > 0 && (
                <Text
                  variant="bodySmall"
                  style={[styles.debt, { color: colors.error[600] }]}
                  testID={`${testID}-outstanding`}
                >
                  {formatCurrency(customer.outstandingBalance, { short: true })}{" "}
                  owed
                </Text>
              )}
              {customer.creditBalance > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Text
                    variant="bodySmall"
                    style={[styles.credit, { color: colors.success[600] }]}
                    testID={`${testID}-credit`}
                  >
                    {formatCurrency(customer.creditBalance, { short: true })}{" "}
                    credit
                  </Text>
                  <TouchableOpacity
                    onPress={handleCreditManagement}
                    style={styles.creditButton}
                    accessibilityLabel="Manage credit"
                  >
                    <Text style={styles.creditButtonText}>Manage</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  cardContent: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  avatar: {
    elevation: 0,
  },
  avatarLabel: {
    fontSize: wp(18),
    fontWeight: "600",
  },
  tierBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: wp(32),
    alignItems: "center",
  },
  tierText: {
    color: "white",
    fontSize: wp(8),
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  info: {
    flex: 1,
  },
  name: {
    fontWeight: "600",
    marginBottom: 4,
    fontSize: wp(16),
  },
  phone: {
    marginBottom: 2,
    fontSize: 14,
  },
  lastPurchase: {
    fontSize: 12,
    opacity: 0.8,
  },
  amount: {
    alignItems: "flex-end",
  },
  totalSpent: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
    opacity: 0.7,
  },
  debt: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  credit: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  creditButton: {
    backgroundColor: "#059669",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  creditButtonText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
});
