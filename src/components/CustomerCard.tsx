import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Avatar, Card, Text } from "react-native-paper";
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
  const formatCurrency = (amount: number): string => {
    return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`Customer ${customer.name}`}
    >
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Avatar.Text
              size={48}
              label={getInitials(customer.name)}
              style={styles.avatar}
              testID={`${testID}-avatar`}
            />
            <View style={styles.info}>
              <Text
                variant="titleMedium"
                style={styles.name}
                testID={`${testID}-name`}
              >
                {customer.name}
              </Text>
              <Text
                variant="bodySmall"
                style={styles.phone}
                testID={`${testID}-phone`}
              >
                {customer.phone}
              </Text>
              <Text
                variant="bodySmall"
                style={styles.lastPurchase}
                testID={`${testID}-last-purchase`}
              >
                {formatLastPurchase(customer.lastPurchase)}
              </Text>
            </View>
            <View style={styles.amount}>
              <Text
                variant="titleSmall"
                style={styles.totalSpent}
                testID={`${testID}-total-spent`}
              >
                {formatCurrency(customer.totalSpent)}
              </Text>
              <Text variant="bodySmall" style={styles.label}>
                Total Spent
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    marginHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    backgroundColor: "#2E7D32",
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontWeight: "bold",
  },
  phone: {
    color: "#666",
    marginTop: 2,
  },
  lastPurchase: {
    color: "#999",
    marginTop: 2,
  },
  amount: {
    alignItems: "flex-end",
  },
  totalSpent: {
    fontWeight: "bold",
    color: "#2E7D32",
  },
  label: {
    color: "#666",
    marginTop: 2,
  },
});
