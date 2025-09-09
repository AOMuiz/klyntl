import { ThemedText } from "@/components/ThemedText";
import { formatCurrency } from "@/utils/currency";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "react-native-paper";
import { IconSymbol } from "./IconSymbol";

interface SimpleTransactionCardProps {
  transaction: {
    id: string;
    type: string;
    amount: number;
    customerId: string;
    date: string;
    remainingAmount?: number;
    paymentMethod?: string;
    appliedToDebt?: boolean;
  };
  customerName: string;
  onPress: () => void;
}

export default function SimpleTransactionCard({
  transaction,
  customerName,
  onPress,
}: SimpleTransactionCardProps) {
  const theme = useTheme();
  const colors = theme.colors;

  // Simplified status calculation for Nigerian SMEs
  const getTransactionStatus = () => {
    const { type, remainingAmount, amount, appliedToDebt } = transaction;

    if (type === "payment") {
      return {
        icon: "checkmark.circle.fill" as const,
        iconColor: "#34C759",
        statusText: appliedToDebt ? "Payment Applied" : "Payment Received",
        statusColor: "#34C759",
        amount: `+${formatCurrency(amount)}`,
        amountColor: "#34C759",
      };
    }

    if (type === "sale") {
      const hasDebt = remainingAmount && remainingAmount > 0;
      return {
        icon: "cart.fill" as const,
        iconColor: hasDebt ? "#FF8F00" : "#34C759",
        statusText: hasDebt ? "Pending Payment" : "Paid",
        statusColor: hasDebt ? "#FF8F00" : "#34C759",
        amount: formatCurrency(amount),
        amountColor: colors.onSurface,
      };
    }

    if (type === "credit") {
      const hasDebt = remainingAmount && remainingAmount > 0;
      return {
        icon: "creditcard.fill" as const,
        iconColor: "#FF8F00",
        statusText: hasDebt
          ? `Due: ${formatCurrency(remainingAmount)}`
          : "Repaid",
        statusColor: hasDebt ? "#FF8F00" : "#34C759",
        amount: formatCurrency(amount),
        amountColor: colors.onSurface,
      };
    }

    if (type === "refund") {
      return {
        icon: "arrow.counterclockwise" as const,
        iconColor: "#FF3B30",
        statusText: "Refund",
        statusColor: "#FF3B30",
        amount: `-${formatCurrency(amount)}`,
        amountColor: "#FF3B30",
      };
    }

    return {
      icon: "doc.text" as const,
      iconColor: "#8E8E93",
      statusText: type.charAt(0).toUpperCase() + type.slice(1),
      statusColor: "#8E8E93",
      amount: formatCurrency(amount),
      amountColor: colors.onSurface,
    };
  };

  const statusInfo = getTransactionStatus();
  const transactionDate = new Date(transaction.date).toLocaleDateString(
    "en-NG",
    {
      day: "2-digit",
      month: "short",
    }
  );

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.outline,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`View ${customerName} transaction`}
    >
      {/* Left: Icon */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: statusInfo.iconColor + "20" },
        ]}
      >
        <IconSymbol
          name={statusInfo.icon}
          size={20}
          color={statusInfo.iconColor}
        />
      </View>

      {/* Center: Customer & Status */}
      <View style={styles.content}>
        <ThemedText
          style={[styles.customerName, { color: colors.onSurface }]}
          numberOfLines={1}
        >
          {customerName}
        </ThemedText>
        <ThemedText
          style={[styles.status, { color: statusInfo.statusColor }]}
          numberOfLines={1}
        >
          {statusInfo.statusText}
        </ThemedText>
      </View>

      {/* Right: Amount & Date */}
      <View style={styles.amountSection}>
        <ThemedText style={[styles.amount, { color: statusInfo.amountColor }]}>
          {statusInfo.amount}
        </ThemedText>
        <ThemedText style={[styles.date, { color: colors.onSurfaceVariant }]}>
          {transactionDate}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  status: {
    fontSize: 14,
    fontWeight: "500",
  },
  amountSection: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
  },
});
