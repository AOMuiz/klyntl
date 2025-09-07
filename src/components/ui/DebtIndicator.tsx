import { ThemedText } from "@/components/ThemedText";
import { formatCurrency } from "@/utils/currency";
import { hp, wp } from "@/utils/responsive_dimensions_system";
import { StyleSheet, View } from "react-native";
import { IconSymbol } from "./IconSymbol";

interface DebtIndicatorProps {
  transaction: {
    type: string;
    paymentMethod?: string;
    remainingAmount?: number;
    appliedToDebt?: boolean;
    amount: number;
  };
  debtImpact: number; // Positive = debt increase, negative = debt decrease
}

export default function DebtIndicator({
  transaction,
  debtImpact,
}: DebtIndicatorProps) {
  const getDebtInfo = () => {
    const { type, paymentMethod } = transaction;

    if (debtImpact === 0) {
      return {
        icon: "checkmark.circle.fill",
        color: "#34C759",
        text: "No Debt Impact",
        bgColor: "#E8F5E8",
      };
    }

    if (debtImpact > 0) {
      // Debt increase
      if (type === "sale" && paymentMethod === "credit") {
        return {
          icon: "arrow.up.circle.fill",
          color: "#FF9500",
          text: `+${formatCurrency(debtImpact)}`,
          bgColor: "#FFF3E0",
        };
      } else if (type === "sale" && paymentMethod === "mixed") {
        return {
          icon: "arrow.up.circle.fill",
          color: "#FF9500",
          text: `+${formatCurrency(debtImpact)}`,
          bgColor: "#FFF3E0",
        };
      } else if (type === "credit") {
        return {
          icon: "plus.circle.fill",
          color: "#FF3B30",
          text: `+${formatCurrency(debtImpact)}`,
          bgColor: "#FFEBEE",
        };
      }
    } else {
      // Debt decrease
      if (type === "payment" && transaction.appliedToDebt) {
        return {
          icon: "arrow.down.circle.fill",
          color: "#34C759",
          text: formatCurrency(Math.abs(debtImpact)),
          bgColor: "#E8F5E8",
        };
      } else if (type === "refund") {
        return {
          icon: "minus.circle.fill",
          color: "#FF3B30",
          text: formatCurrency(Math.abs(debtImpact)),
          bgColor: "#FFEBEE",
        };
      }
    }

    return {
      icon: "circle.fill",
      color: "#8E8E93",
      text: formatCurrency(Math.abs(debtImpact)),
      bgColor: "#F2F2F7",
    };
  };

  const debtInfo = getDebtInfo();

  return (
    <View style={[styles.container, { backgroundColor: debtInfo.bgColor }]}>
      <IconSymbol name={debtInfo.icon} size={14} color={debtInfo.color} />
      <ThemedText
        style={[styles.text, { color: debtInfo.color }]}
        type="caption"
      >
        {debtInfo.text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(6),
    paddingVertical: hp(3),
    borderRadius: wp(8),
    gap: wp(4),
  },
  text: {
    fontSize: wp(11),
    fontWeight: "500",
  },
});
