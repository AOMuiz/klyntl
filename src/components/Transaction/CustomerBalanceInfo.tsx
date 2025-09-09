// Smart Balance Info Component

import { Colors } from "@/constants";
import { PaymentMethod, TransactionType } from "@/types/transaction";
import { formatCurrency } from "@/utils/helpers";
import { useColorScheme, View } from "react-native";
import { useTheme } from "react-native-paper";
import { ThemedText } from "../ThemedText";

export const CustomerBalanceInfo: React.FC<{
  customer: any;
  creditBalance: number;
  currentDebt: number;
  transactionType: TransactionType;
  amount: string;
  paymentMethod: PaymentMethod;
  appliedToDebt?: boolean;
}> = ({
  customer,
  creditBalance,
  currentDebt,
  transactionType,
  amount,
  paymentMethod,
  appliedToDebt,
}) => {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  if (!customer) return null;

  const amountNum = parseFloat(amount || "0");
  const hasDebt = currentDebt > 0;
  const hasCredit = creditBalance > 0;

  // Calculate impact
  let impactMessage = "";
  let impactColor = theme.colors.onSurfaceVariant;

  if (transactionType === "sale") {
    if (paymentMethod === "credit") {
      impactMessage = `+${formatCurrency(amountNum)} debt`;
      impactColor = Colors[isDark ? "dark" : "light"].warning;
    } else if (paymentMethod === "mixed" && amount) {
      impactMessage = "Partial payment - debt will increase";
      impactColor = Colors[isDark ? "dark" : "light"].warning;
    }
  } else if (transactionType === "payment" && appliedToDebt && amountNum > 0) {
    const debtReduction = Math.min(amountNum, currentDebt);
    const overpayment = Math.max(0, amountNum - currentDebt);

    if (overpayment > 0) {
      impactMessage = `Debt cleared + ${formatCurrency(overpayment)} credit`;
      impactColor = Colors[isDark ? "dark" : "light"].success;
    } else {
      impactMessage = `-${formatCurrency(debtReduction)} debt`;
      impactColor = Colors[isDark ? "dark" : "light"].success;
    }
  }

  return (
    <View
      style={{
        padding: 12,
        backgroundColor: theme.colors.surfaceVariant,
        borderRadius: 8,
        marginBottom: 16,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <ThemedText style={{ fontWeight: "600" }}>{customer.name}</ThemedText>
        <View style={{ alignItems: "flex-end" }}>
          {hasDebt && (
            <ThemedText
              style={{
                color: Colors[isDark ? "dark" : "light"].error,
                fontSize: 12,
              }}
            >
              Debt: {formatCurrency(currentDebt)}
            </ThemedText>
          )}
          {hasCredit && (
            <ThemedText
              style={{
                color: Colors[isDark ? "dark" : "light"].success,
                fontSize: 12,
              }}
            >
              Credit: {formatCurrency(creditBalance)}
            </ThemedText>
          )}
        </View>
      </View>

      {impactMessage && (
        <ThemedText
          style={{
            marginTop: 8,
            color: impactColor,
            fontWeight: "500",
            fontSize: 13,
          }}
        >
          Impact: {impactMessage}
        </ThemedText>
      )}
    </View>
  );
};
