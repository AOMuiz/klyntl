import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Button, Card, Text, useTheme } from "react-native-paper";

import ScreenContainer, {
  edgesHorizontal,
} from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTransaction } from "@/hooks/useTransactions";
import { formatCurrency } from "@/utils/currency";
import { hp, wp } from "@/utils/responsive_dimensions_system";

export default function TransactionDetailsScreen() {
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
          <Text>Loading transaction...</Text>
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const onEdit = () => {
    router.push(`/(modal)/transaction/edit/${id}`);
  };

  const onShare = () => {
    Alert.alert("Share", "Implement share functionality");
  };

  return (
    <ScreenContainer withPadding={false} edges={[...edgesHorizontal, "bottom"]}>
      <ScrollView
        style={{ padding: wp(20) }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hp(32) }}
      >
        <View style={{ alignItems: "center", marginBottom: hp(16) }}>
          <IconSymbol
            name="doc.text.fill"
            size={40}
            color={theme.colors.primary}
          />
          <ThemedText style={{ marginTop: hp(8), fontWeight: "700" }}>
            Transaction Details
          </ThemedText>
        </View>

        <Card
          style={{
            borderRadius: wp(12),
            padding: wp(16),
            marginBottom: hp(12),
          }}
        >
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Invoice ID
          </Text>
          <Text variant="titleMedium" style={{ marginTop: hp(6) }}>
            #{transaction.id}
          </Text>

          <View style={{ marginTop: hp(12) }}>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Transaction Date
            </Text>
            <Text variant="bodyMedium" style={{ marginTop: hp(6) }}>
              {formatDate(transaction.date)}
            </Text>
          </View>

          <View style={{ marginTop: hp(12) }}>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Description
            </Text>
            <Text variant="bodyMedium" style={{ marginTop: hp(6) }}>
              {transaction.description}
            </Text>
          </View>

          {transaction.paymentMethod && (
            <View style={{ marginTop: hp(12) }}>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Payment Method
              </Text>
              <Text variant="bodyMedium" style={{ marginTop: hp(6) }}>
                {transaction.paymentMethod}
              </Text>
            </View>
          )}

          <View style={{ marginTop: hp(12) }}>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Total Amount Received
            </Text>
            <Text
              variant="titleMedium"
              style={{ marginTop: hp(6), color: theme.colors.primary }}
            >
              {formatCurrency(transaction.amount)}
            </Text>
          </View>

          <View style={{ marginTop: hp(12) }}>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Amount owed
            </Text>
            <Text variant="bodyMedium" style={{ marginTop: hp(6) }}>
              {transaction.remainingAmount
                ? formatCurrency(transaction.remainingAmount)
                : "₦ 0.00"}
            </Text>
          </View>

          <View
            style={{ marginTop: hp(12), flexDirection: "column", gap: hp(12) }}
          >
            <Button
              mode="contained"
              onPress={onShare}
              style={{ width: "100%", marginBottom: hp(8) }}
            >
              Share Receipt
            </Button>
            <Button mode="outlined" onPress={onEdit} style={{ width: "100%" }}>
              Update Transaction
            </Button>
          </View>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}
