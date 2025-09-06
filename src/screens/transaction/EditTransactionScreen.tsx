import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useTheme } from "react-native-paper";

import TransactionForm from "@/components/forms/transaction/TransactionForm";
import ScreenContainer from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import { useTransaction } from "@/hooks/useTransactions";

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();

  const { data: transaction, isLoading, error } = useTransaction(id);

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
    <TransactionForm
      customerId={transaction.customerId}
      initialData={initialData}
      transactionId={id}
    />
  );
}
