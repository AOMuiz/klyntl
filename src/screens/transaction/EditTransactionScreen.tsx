import { ActivityIndicator, Card, Text, useTheme } from "react-native-paper";

import TransactionForm from "@/components/forms/transaction/TransactionForm";
import ScreenContainer, {
  edgesHorizontal,
} from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import DebtIndicator from "@/components/ui/DebtIndicator";
import { useCustomers } from "@/hooks/useCustomers";
import { useTransaction } from "@/hooks/useTransactions";
import { SimpleTransactionCalculator } from "@/services/calculations/SimpleTransactionCalculator";
import { formatCurrency } from "@/utils/currency";
import { hp, wp } from "@/utils/responsive_dimensions_system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ScrollView, View } from "react-native";

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();

  const { data: transaction, isLoading, error } = useTransaction(id);
  const { customers } = useCustomers();

  useEffect(() => {
    if (error) {
      console.error("Failed to load transaction:", error);
      router.back();
    }
  }, [error, router]);

  if (isLoading) {
    return (
      <ScreenContainer>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <ThemedText style={{ marginTop: 16 }}>
            Loading transaction...
          </ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  if (!transaction) {
    return (
      <ScreenContainer>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ThemedText>Transaction not found</ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  const customer = customers?.find((c) => c.id === transaction.customerId);

  // Use SimpleTransactionCalculator as single source of truth for debt calculations
  const calculateCurrentDebtImpact = () => {
    const impact = SimpleTransactionCalculator.calculateDebtImpact(
      transaction.type,
      transaction.paymentMethod || "cash",
      transaction.amount,
      transaction.appliedToDebt
    );

    // Return signed value for debt impact (positive = increases debt, negative = decreases debt)
    return impact.isDecrease ? -impact.change : impact.change;
  };

  const currentDebtImpact = calculateCurrentDebtImpact();
  const currentCustomerDebt = customer?.outstandingBalance || 0;

  // Convert transaction to form data
  const initialData = {
    customerId: transaction.customerId,
    amount: transaction.amount.toString(),
    description: transaction.description || "",
    date: new Date(transaction.date),
    type: transaction.type,
    paymentMethod: transaction.paymentMethod,
    paidAmount: transaction.paidAmount?.toString() || "",
    remainingAmount: transaction.remainingAmount?.toString() || "",
    dueDate: transaction.dueDate ? new Date(transaction.dueDate) : null,
    appliedToDebt: transaction.appliedToDebt,
  };

  return (
    <ScreenContainer withPadding={false} edges={[...edgesHorizontal, "bottom"]}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Debt Change Preview */}
        <View style={{ padding: wp(20), paddingBottom: 0 }}>
          <Card style={{ borderRadius: wp(12), marginBottom: hp(16) }}>
            <Card.Content style={{ padding: wp(16) }}>
              <Text
                variant="titleMedium"
                style={{
                  fontWeight: "600",
                  marginBottom: hp(12),
                  color: theme.colors.onSurface,
                }}
              >
                Debt Impact Preview
              </Text>

              <View style={{ marginBottom: hp(12) }}>
                <Text
                  variant="bodyMedium"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    marginBottom: hp(4),
                  }}
                >
                  Current debt impact:
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <DebtIndicator
                    transaction={transaction}
                    debtImpact={currentDebtImpact}
                  />
                  <Text
                    variant="bodyLarge"
                    style={{
                      marginLeft: wp(12),
                      fontWeight: "600",
                      color: theme.colors.onSurface,
                    }}
                  >
                    {formatCurrency(Math.abs(currentDebtImpact))}
                  </Text>
                </View>
              </View>

              <View style={{ marginBottom: hp(8) }}>
                <Text
                  variant="bodyMedium"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    marginBottom: hp(4),
                  }}
                >
                  Current customer balance:
                </Text>
                <Text
                  variant="bodyLarge"
                  style={{
                    fontWeight: "600",
                    color:
                      currentCustomerDebt > 0
                        ? "#FF9500"
                        : currentCustomerDebt < 0
                        ? "#34C759"
                        : "#34C759",
                  }}
                >
                  {formatCurrency(currentCustomerDebt)}
                </Text>
              </View>

              <Text
                variant="bodySmall"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  fontStyle: "italic",
                }}
              >
                Edit the transaction below to see how it will affect the debt
              </Text>
            </Card.Content>
          </Card>
        </View>

        <TransactionForm
          customerId={transaction.customerId}
          initialData={initialData}
          transactionId={id}
        />
      </ScrollView>
    </ScreenContainer>
  );
}
