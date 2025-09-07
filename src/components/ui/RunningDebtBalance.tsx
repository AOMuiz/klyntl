import { ThemedText } from "@/components/ThemedText";
import { formatCurrency } from "@/utils/currency";
import { hp, wp } from "@/utils/responsive_dimensions_system";
import { StyleSheet, View } from "react-native";

interface RunningDebtBalanceProps {
  balance: number;
  isIncrease?: boolean;
}

export default function RunningDebtBalance({
  balance,
  isIncrease = false,
}: RunningDebtBalanceProps) {
  const getBalanceColor = () => {
    if (balance === 0) return "#34C759"; // Green for zero balance
    if (balance > 0) return "#FF9500"; // Orange for debt
    return "#34C759"; // Green for credit balance
  };

  const getBalanceText = () => {
    if (balance === 0) return "₦0.00";
    return formatCurrency(Math.abs(balance));
  };

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.label, { color: "#6B7280" }]} type="caption">
        Balance
      </ThemedText>
      <ThemedText
        style={[styles.amount, { color: getBalanceColor() }]}
        type="caption"
      >
        {balance < 0 ? "-" : balance > 0 ? "+" : ""}
        {getBalanceText()}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    minWidth: wp(70),
  },
  label: {
    fontSize: wp(10),
    fontWeight: "500",
    marginBottom: hp(2),
  },
  amount: {
    fontSize: wp(12),
    fontWeight: "700",
  },
});
