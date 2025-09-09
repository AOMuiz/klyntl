import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Alert, ScrollView, Share, TouchableOpacity, View } from "react-native";
import { Button, Card, Text, useTheme } from "react-native-paper";

import ScreenContainer, {
  edgesHorizontal,
} from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useCustomer } from "@/hooks/useCustomers";
import { useTransactionDetails } from "@/hooks/useTransactionDetails";
import { useTransaction, useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/utils/currency";
import { hp, wp } from "@/utils/responsive_dimensions_system";

export default function TransactionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();

  const { data: transaction, isLoading, error } = useTransaction(id);

  // Load customer + all transactions for running balance calculation
  const customerId = transaction?.customerId;
  const { data: customer } = useCustomer(customerId);
  const txnsQuery = useTransactions(customerId);
  const allCustomerTxns = txnsQuery.transactions || [];

  // Use the transaction details hook for data access and calculations
  const {
    creditBalance,
    paymentHistory,
    isLoadingDetails,
    computeRunningBalances,
  } = useTransactionDetails({
    transaction,
    customerId,
    allCustomerTxns,
  });

  useEffect(() => {
    if (error) {
      console.error("Failed to load transaction:", error);
      router.back();
    }
  }, [error, router]);

  if (isLoading || isLoadingDetails) {
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

  // Compute running balance before/after this transaction using all customer txns
  const {
    before: runningBefore,
    after: runningAfter,
    rawAfter,
    creditCreated,
  } = computeRunningBalances();

  // Prefer authoritative persistedOutstanding when available from DB
  let displayBefore = runningBefore;
  let displayAfter = runningAfter;
  let displayCreditCreated = creditCreated;

  // Keep backward-compatible names used elsewhere in this file
  const balanceBefore = displayBefore;
  const balanceAfter = displayAfter;

  console.log({
    runningBefore,
    runningAfter,
    rawAfter,
    creditCreated,
    balanceBefore,
    balanceAfter,
    displayCreditCreated,
  });

  const onCopyInvoice = async () => {
    try {
      // Try direct clipboard first
      if (Clipboard && Clipboard.setStringAsync) {
        await Clipboard.setStringAsync(transaction.id);
        Alert.alert("Copied", "Invoice ID copied to clipboard");
        return;
      }
      // Fallback to share sheet
      await Share.share({ message: `Invoice: #${transaction.id}` });
    } catch (err) {
      console.error("Failed to copy/share invoice id", err);
      Alert.alert("Error", "Failed to copy or share invoice ID");
    }
  };

  const buildReceiptText = () => {
    const lines: string[] = [];
    lines.push("Klyntl Receipt");
    lines.push(`Invoice: #${transaction.id}`);
    lines.push(`Date: ${formatDate(transaction.date)}`);
    if (customer)
      lines.push(`Customer: ${customer.name} (${customer.phone || "-"})`);
    lines.push("");
    lines.push(`Description: ${transaction.description || "-"}`);
    lines.push(`Payment method: ${transaction.paymentMethod || "-"}`);
    if (transaction.paidAmount)
      lines.push(`Paid: ${formatCurrency(transaction.paidAmount)}`);
    if (transaction.remainingAmount)
      lines.push(`Remaining: ${formatCurrency(transaction.remainingAmount)}`);
    lines.push(`Total: ${formatCurrency(transaction.amount)}`);
    lines.push("");

    // Net balance display (debt - credit) for clarity
    const netBefore = balanceBefore - (creditBalance || 0);
    const netAfter = balanceAfter - (creditBalance || 0);

    if (netBefore < 0) {
      lines.push(
        `Net balance before: ${formatCurrency(Math.abs(netBefore))} Credit`
      );
    } else if (netBefore > 0) {
      lines.push(`Net balance before: ${formatCurrency(netBefore)} Owed`);
    } else {
      lines.push(`Net balance before: ₦0 (Balanced)`);
    }

    if (netAfter < 0) {
      lines.push(
        `Net balance after: ${formatCurrency(Math.abs(netAfter))} Credit`
      );
    } else if (netAfter > 0) {
      lines.push(`Net balance after: ${formatCurrency(netAfter)} Owed`);
    } else {
      lines.push(`Net balance after: ₦0 (Balanced)`);
    }

    // Try to include metadata if present
    if (transaction.metadata) {
      try {
        parsedMetadata = JSON.parse(transaction.metadata);
        if (parsedMetadata.transactionRef)
          lines.push(`Ref: ${parsedMetadata.transactionRef}`);
        if (parsedMetadata.cardLast4)
          lines.push(`Card: **** **** **** ${parsedMetadata.cardLast4}`);
        if (parsedMetadata.bankRef)
          lines.push(`Bank ref: ${parsedMetadata.bankRef}`);
      } catch (err) {
        // not JSON, include raw and log parse error
        console.warn("Failed to parse transaction.metadata", err);
        parsedMetadata = { raw: transaction.metadata };
      }
    }

    return lines.join("\n");
  };

  const onShare = async () => {
    try {
      const message = buildReceiptText();
      await Share.share({ title: `Receipt #${transaction.id}`, message });
    } catch (e) {
      console.error("Share failed", e);
      Alert.alert("Error", "Failed to open share sheet");
    }
  };

  // Parse metadata safely for display
  let parsedMetadata: any = null;
  if (transaction.metadata) {
    try {
      parsedMetadata = JSON.parse(transaction.metadata);
    } catch (err) {
      console.warn(
        "Failed to parse transaction.metadata in parsedMetadata",
        err
      );
      parsedMetadata = { raw: transaction.metadata };
    }
  }

  const safeFormat = (val: any) => {
    const n = Number(val || 0);
    try {
      return formatCurrency(n);
    } catch {
      return String(val ?? "-");
    }
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
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Invoice ID
              </Text>
              <Text variant="titleMedium" style={{ marginTop: hp(6) }}>
                #{transaction.id}
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: wp(8) }}>
              <Button mode="outlined" onPress={onCopyInvoice} compact>
                Copy
              </Button>
            </View>
          </View>

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

          {transaction.description ? (
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
          ) : null}

          {customer && (
            <View style={{ marginTop: hp(12) }}>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Customer
              </Text>
              <TouchableOpacity
                onPress={() => router.push(`/customer/${customer.id}`)}
              >
                <Text
                  variant="bodyMedium"
                  style={{ marginTop: hp(6), color: theme.colors.primary }}
                >
                  {customer.name} {customer.phone ? `· ${customer.phone}` : ""}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {transaction.type && (
            <View style={{ marginTop: hp(12) }}>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Transaction Type
              </Text>
              <Text variant="bodyMedium" style={{ marginTop: hp(6) }}>
                {transaction.type}
              </Text>
            </View>
          )}

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
              Total Amount
            </Text>
            <Text
              variant="titleMedium"
              style={{ marginTop: hp(6), color: theme.colors.primary }}
            >
              {formatCurrency(transaction.amount)}
            </Text>
          </View>

          {/* Credit Balance Display - only show if there's actual usable credit */}
          {(() => {
            const currentDebt = customer?.outstandingBalance || 0;
            const currentCredit = customer?.creditBalance || 0;
            const usableCredit = Math.max(0, currentCredit - currentDebt);

            if (usableCredit > 0) {
              return (
                <View style={{ marginTop: hp(12) }}>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Available Credit Balance
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={{ marginTop: hp(6), color: theme.colors.primary }}
                  >
                    💳 Usable Credit: {formatCurrency(usableCredit)}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      marginTop: hp(4),
                      fontStyle: "italic",
                    }}
                  >
                    (Money customer can use for future purchases)
                  </Text>
                </View>
              );
            } else if (currentCredit > 0 && currentDebt > 0) {
              return (
                <View style={{ marginTop: hp(12) }}>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Credit Status
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={{ marginTop: hp(6), color: theme.colors.onSurface }}
                  >
                    💳 {formatCurrency(currentCredit)} prepaid credit is
                    offsetting debt
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      marginTop: hp(4),
                      fontStyle: "italic",
                    }}
                  >
                    (No additional credit available for new purchases)
                  </Text>
                </View>
              );
            }
            return null;
          })()}

          {/* Payment Breakdown with Nigerian SME-friendly messages */}
          <View style={{ marginTop: hp(12) }}>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Payment Details
            </Text>
            <View style={{ marginTop: hp(6) }}>
              <Text variant="bodyMedium">
                💰 Money Received: {formatCurrency(transaction.paidAmount || 0)}
              </Text>
              <Text variant="bodyMedium">
                ⏳ Still Owing:{" "}
                {formatCurrency(transaction.remainingAmount || 0)}
              </Text>
              {transaction.paymentMethod === "mixed" && (
                <Text variant="bodyMedium" style={{ marginTop: hp(4) }}>
                  🔄 Mixed Payment: Cash & Credit Used
                </Text>
              )}
              {transaction.paymentMethod === "credit" && (
                <Text variant="bodyMedium" style={{ marginTop: hp(4) }}>
                  📝 Credit Sale: Customer will pay later
                </Text>
              )}
            </View>
          </View>

          <View style={{ marginTop: hp(12) }}>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Transaction Impact on Customer Account
            </Text>
            <View style={{ marginTop: hp(6) }}>
              {(() => {
                // Calculate net balances (debt - credit) for clearer display
                const currentDebt = customer?.outstandingBalance || 0;
                const currentCredit = customer?.creditBalance || 0;
                const netBefore = balanceBefore - (creditBalance || 0);
                const netAfter = balanceAfter - (creditBalance || 0);

                return (
                  <>
                    <Text variant="bodyMedium">
                      � Net balance before:{" "}
                      {netBefore < 0
                        ? `💳 Customer had ${formatCurrency(
                            Math.abs(netBefore)
                          )} credit`
                        : netBefore > 0
                        ? `💰 Customer owed ${formatCurrency(netBefore)}`
                        : `✅ Account was balanced (₦0)`}
                    </Text>
                    <Text variant="bodyMedium">
                      📈 Net balance after:{" "}
                      {netAfter < 0
                        ? `💳 Customer has ${formatCurrency(
                            Math.abs(netAfter)
                          )} credit`
                        : netAfter > 0
                        ? `� Customer owes ${formatCurrency(netAfter)}`
                        : `✅ Account is balanced (₦0)`}
                    </Text>

                    {/* Show breakdown only if both debt and credit exist */}
                    {currentDebt > 0 && currentCredit > 0 && (
                      <View
                        style={{
                          marginTop: hp(8),
                          paddingTop: hp(8),
                          borderTopWidth: 1,
                          borderTopColor: theme.colors.outline,
                        }}
                      >
                        <Text
                          variant="bodySmall"
                          style={{ color: theme.colors.onSurfaceVariant }}
                        >
                          Current Account Breakdown:
                        </Text>
                        <Text
                          variant="bodySmall"
                          style={{ color: theme.colors.error }}
                        >
                          📊 Debt: {formatCurrency(currentDebt)}
                        </Text>
                        <Text variant="bodySmall" style={{ color: "#4CAF50" }}>
                          � Prepaid Credit: {formatCurrency(currentCredit)}
                        </Text>
                        <Text
                          variant="bodySmall"
                          style={{ color: theme.colors.primary }}
                        >
                          🏆 Net Result:{" "}
                          {formatCurrency(
                            Math.abs(currentDebt - currentCredit)
                          )}{" "}
                          {currentDebt > currentCredit
                            ? "owed"
                            : currentDebt < currentCredit
                            ? "credit"
                            : "(balanced)"}
                        </Text>
                      </View>
                    )}

                    <Text
                      variant="bodySmall"
                      style={{
                        color:
                          netAfter > netBefore
                            ? theme.colors.error
                            : netAfter < netBefore
                            ? "#4CAF50"
                            : theme.colors.onSurfaceVariant,
                        marginTop: hp(4),
                      }}
                    >
                      {netAfter > netBefore
                        ? `📈 This transaction increased net debt by ${formatCurrency(
                            netAfter - netBefore
                          )}`
                        : netAfter < netBefore
                        ? `📉 This transaction reduced net debt by ${formatCurrency(
                            netBefore - netAfter
                          )}`
                        : netAfter === 0
                        ? "✅ This transaction balanced the account"
                        : "⚖️ Net balance unchanged"}
                    </Text>
                  </>
                );
              })()}
            </View>
          </View>

          {parsedMetadata && (
            <View style={{ marginTop: hp(12) }}>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Payment Metadata
              </Text>
              <View style={{ marginTop: hp(6) }}>
                {parsedMetadata.transactionRef && (
                  <Text variant="bodyMedium">
                    Ref: {parsedMetadata.transactionRef}
                  </Text>
                )}
                {parsedMetadata.cardLast4 && (
                  <Text variant="bodyMedium">
                    Card: **** **** **** {parsedMetadata.cardLast4}
                  </Text>
                )}
                {parsedMetadata.bankRef && (
                  <Text variant="bodyMedium">
                    Bank Ref: {parsedMetadata.bankRef}
                  </Text>
                )}
                {parsedMetadata.raw && (
                  <Text variant="bodyMedium">{parsedMetadata.raw}</Text>
                )}
              </View>
            </View>
          )}

          {/* Payment History */}
          {paymentHistory.length > 0 && (
            <View style={{ marginTop: hp(12) }}>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Recent Payment Activity
              </Text>
              <View style={{ marginTop: hp(6) }}>
                {paymentHistory.slice(0, 5).map((record: any, i: number) => (
                  <Text key={`payment-${i}`} variant="bodyMedium">
                    {record.type} · {safeFormat(record.amount)} ·{" "}
                    {new Date(record.created_at).toLocaleDateString()}
                  </Text>
                ))}
              </View>
            </View>
          )}

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
