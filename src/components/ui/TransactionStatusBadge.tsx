import { ThemedText } from "@/components/ThemedText";
import { hp, wp } from "@/utils/responsive_dimensions_system";
import { StyleSheet, View } from "react-native";

interface TransactionStatusBadgeProps {
  transaction: {
    type: string;
    paymentMethod?: string;
    remainingAmount?: number;
    appliedToDebt?: boolean;
  };
  amount: number;
}

export default function TransactionStatusBadge({
  transaction,
  amount,
}: TransactionStatusBadgeProps) {
  const getStatusInfo = () => {
    const { type, paymentMethod, remainingAmount, appliedToDebt } = transaction;

    // Payment transactions
    if (type === "payment") {
      if (appliedToDebt) {
        return {
          label: "Payment Applied",
          color: "#34C759", // Green
          bgColor: "#E8F5E8",
        };
      } else {
        return {
          label: "Future Service",
          color: "#007AFF", // Blue
          bgColor: "#E3F2FD",
        };
      }
    }

    // Sale transactions
    if (type === "sale") {
      if (paymentMethod === "cash") {
        return {
          label: "Paid in Full",
          color: "#34C759", // Green
          bgColor: "#E8F5E8",
        };
      } else if (paymentMethod === "credit") {
        return {
          label: "Credit Sale",
          color: "#FF9500", // Orange
          bgColor: "#FFF3E0",
        };
      } else if (paymentMethod === "mixed") {
        if (remainingAmount && remainingAmount > 0) {
          return {
            label: "Partial Payment",
            color: "#FF9500", // Orange
            bgColor: "#FFF3E0",
          };
        } else {
          return {
            label: "Paid in Full",
            color: "#34C759", // Green
            bgColor: "#E8F5E8",
          };
        }
      }
    }

    // Credit transactions
    if (type === "credit") {
      return {
        label: "Credit Issued",
        color: "#FF3B30", // Red
        bgColor: "#FFEBEE",
      };
    }

    // Refund transactions
    if (type === "refund") {
      return {
        label: "Refund",
        color: "#FF3B30", // Red
        bgColor: "#FFEBEE",
      };
    }

    return {
      label: type.charAt(0).toUpperCase() + type.slice(1),
      color: "#8E8E93", // Gray
      bgColor: "#F2F2F7",
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: statusInfo.bgColor, borderColor: statusInfo.color },
      ]}
    >
      <ThemedText
        style={[styles.badgeText, { color: statusInfo.color }]}
        type="caption"
      >
        {statusInfo.label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: wp(8),
    paddingVertical: hp(4),
    borderRadius: wp(12),
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: wp(12),
    fontWeight: "600",
  },
});
