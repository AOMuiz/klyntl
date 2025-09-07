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
import { usePaymentAudit } from "@/hooks/usePaymentAudit";
import { useTransaction, useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/utils/currency";
import { hp, wp } from "@/utils/responsive_dimensions_system";

export default function TransactionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();

  const { data: transaction, isLoading, error } = useTransaction(id);
  // Load payment audit records for this transaction (if any) — call hook unconditionally
  const { data: auditHistory } = usePaymentAudit(transaction?.customerId);

  // Load customer + all transactions for running balance calculation
  const customerId = transaction?.customerId;
  const { data: customer } = useCustomer(customerId);
  const txnsQuery = useTransactions(customerId);
  const allCustomerTxns = txnsQuery.transactions || [];

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

  // Debt impact helper (same logic used elsewhere)
  const calculateDebtImpact = (tx: any) => {
    const { type, paymentMethod, remainingAmount, appliedToDebt, amount } = tx;
    switch (type) {
      case "sale":
        if (paymentMethod === "credit") return amount;
        if (paymentMethod === "mixed") return remainingAmount || 0;
        return 0;
      case "payment":
        if (appliedToDebt) return -amount;
        return 0;
      case "credit":
        return amount;
      case "refund":
        return -amount;
      default:
        return 0;
    }
  };

  // Compute running balance before/after this transaction using all customer txns
  const computeRunningBalances = () => {
    if (!allCustomerTxns || allCustomerTxns.length === 0) {
      const impact = calculateDebtImpact(transaction);
      return { before: 0, after: impact };
    }

    // Sort ascending by date so accumulation progresses forward in time
    const sorted = [...allCustomerTxns].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let running = 0;
    let before = 0;
    for (const tx of sorted) {
      if (tx.id === transaction.id) {
        before = running;
        // after will be before + impact
        break;
      }
      running += calculateDebtImpact(tx);
    }

    const impact = calculateDebtImpact(transaction);
    const after = before + impact;
    return { before, after };
  };

  const { before: balanceBefore, after: balanceAfter } =
    computeRunningBalances();

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
    lines.push(`Balance before: ${formatCurrency(balanceBefore)}`);
    lines.push(`Balance after: ${formatCurrency(balanceAfter)}`);

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

  // client-side audit-based reconciliation (UI-only fallback when you can't access DB)
  // Aggregate audit rows that reference this transaction as the source to compute paid/remaining
  const allocationsForTxn = (auditHistory || []).filter((a: any) => {
    return (
      a?.source_transaction_id === transaction.id ||
      a?.sourceTransactionId === transaction.id ||
      a?.source === transaction.id
    );
  });

  const computedPaidFromAudit = allocationsForTxn.reduce(
    (sum: number, a: any) => sum + (Number(a?.amount) || 0),
    0
  );
  const computedRemainingFromAudit =
    Number(transaction.amount || 0) - computedPaidFromAudit;

  const paidStored = Number(transaction.paidAmount || 0);
  const remainingStored = Number(transaction.remainingAmount || 0);

  // prefer audit-derived values when they exist, otherwise fallback to stored DB fields
  const displayedPaid = paidStored || computedPaidFromAudit || 0;
  const displayedRemaining =
    remainingStored ||
    (computedRemainingFromAudit >= 0 ? computedRemainingFromAudit : 0);

  const usingAudit =
    computedPaidFromAudit > 0 || computedRemainingFromAudit !== remainingStored;

  const isInconsistent =
    Math.abs(paidStored + remainingStored - Number(transaction.amount || 0)) >
      0 ||
    Math.abs(
      displayedPaid + displayedRemaining - Number(transaction.amount || 0)
    ) > 0;

  const safeFormat = (val: any) => {
    const n = Number(val || 0);
    try {
      return formatCurrency(n);
    } catch (e) {
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

          {(displayedPaid || displayedRemaining) && (
            <View style={{ marginTop: hp(12) }}>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Breakdown
              </Text>
              <View style={{ marginTop: hp(6) }}>
                {displayedPaid ? (
                  <Text variant="bodyMedium">
                    Paid now: {safeFormat(displayedPaid)}
                    {usingAudit && displayedPaid !== paidStored
                      ? " (computed)"
                      : ""}
                  </Text>
                ) : null}
                {displayedRemaining ? (
                  <Text variant="bodyMedium">
                    Remaining: {safeFormat(displayedRemaining)}
                    {usingAudit && displayedRemaining !== remainingStored
                      ? " (computed)"
                      : ""}
                  </Text>
                ) : null}
                {isInconsistent ? (
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.error }}
                  >
                    Data inconsistent: paid + remaining ≠ total
                  </Text>
                ) : null}
              </View>
            </View>
          )}

          <View style={{ marginTop: hp(12) }}>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Running Balance
            </Text>
            <View style={{ marginTop: hp(6) }}>
              <Text variant="bodyMedium">
                Before: {formatCurrency(balanceBefore)}
              </Text>
              <Text variant="bodyMedium">
                After: {formatCurrency(balanceAfter)}
              </Text>
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

          {/* Show allocations / audit entries for this transaction */}
          {auditHistory && auditHistory.length > 0 && (
            <View style={{ marginTop: hp(12) }}>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Payment Allocations
              </Text>
              <View style={{ marginTop: hp(6) }}>
                {(auditHistory || []).map((a: any, i: number) => {
                  const typeLabel =
                    typeof a?.type === "string"
                      ? a.type
                      : String(a?.type ?? a?.metadata?.type ?? "allocation");
                  const amountNum = Number(a?.amount || 0);
                  const dateStr = a?.created_at
                    ? new Date(a.created_at).toLocaleString()
                    : "";
                  return (
                    <Text key={a.id ?? `audit-${i}`} variant="bodyMedium">
                      {typeLabel} · {safeFormat(amountNum)}
                      {amountNum === 0 ? "" : ""} · {dateStr}
                    </Text>
                  );
                })}
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
