import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { AuditManagementService } from "@/services/audit/AuditManagementService";
import { TransactionCalculationService } from "@/services/calculations/TransactionCalculationService";
import { useDatabase } from "@/services/database/hooks";
import { formatCurrency } from "@/utils/currency";
import { hp, wp } from "@/utils/responsive_dimensions_system";

export default function TransactionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { db } = useDatabase();

  const { data: transaction, isLoading, error } = useTransaction(id);
  // Load payment audit records for this transaction (if any) — call hook unconditionally
  const { data: auditHistory } = usePaymentAudit(transaction?.customerId);

  // Load customer + all transactions for running balance calculation
  const customerId = transaction?.customerId;
  const { data: customer } = useCustomer(customerId);
  const txnsQuery = useTransactions(customerId);
  const allCustomerTxns = txnsQuery.transactions || [];

  // State for enhanced calculations and audit data
  const [paymentBreakdown, setPaymentBreakdown] = useState<any>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [auditSummary, setAuditSummary] = useState<any>(null);

  useEffect(() => {
    if (error) {
      console.error("Failed to load transaction:", error);
      router.back();
    }
  }, [error, router]);

  // Calculate enhanced payment breakdown and audit when data is available
  useEffect(() => {
    if (transaction && db) {
      const calculateTransactionData = async () => {
        try {
          // Get proper audit history with customer_id
          const auditManagementService = new AuditManagementService(db);
          const transactionAudit =
            await auditManagementService.getTransactionAuditHistory(
              transaction.id
            );
          const customerAudit =
            await auditManagementService.getCustomerAuditHistory(
              transaction.customerId
            );

          // Convert audit data to PaymentAudit format for calculations
          const paymentAuditData = customerAudit.map((audit) => ({
            id: audit.id,
            customer_id: audit.customerId,
            transaction_id: audit.sourceTransactionId || "",
            type: audit.type,
            amount: audit.amount,
            created_at: audit.createdAt,
            metadata: audit.metadata || {},
          }));

          // Generate payment breakdown using the calculation service
          const breakdown =
            TransactionCalculationService.generatePaymentBreakdown(
              transaction,
              paymentAuditData
            );
          setPaymentBreakdown(breakdown);

          // Verify transaction consistency
          const verification =
            TransactionCalculationService.verifyTransactionConsistency(
              transaction,
              paymentAuditData
            );
          setVerificationResult(verification);

          // Set audit summary
          setAuditSummary({
            transactionAudit,
            customerAudit,
            hasAuditTrail:
              transactionAudit.entries.length > 0 || customerAudit.length > 0,
          });
        } catch (err) {
          console.error("Failed to calculate transaction data:", err);
        }
      };

      calculateTransactionData();
    }
  }, [transaction, db]);

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

  // Use enhanced payment breakdown and verification from centralized services
  const paidStored = Number(transaction.paidAmount || 0);
  const remainingStored = Number(transaction.remainingAmount || 0);

  // prefer audit-derived values when they exist, otherwise fallback to stored DB fields
  const displayedPaid = paymentBreakdown?.totalPaid || paidStored || 0;
  const displayedRemaining =
    paymentBreakdown?.totalRemaining || remainingStored || 0;

  const usingAudit = paymentBreakdown?.hasAuditData || false;

  // Use verification result from centralized service
  const inconsistencyDetails = verificationResult?.hasInconsistencies
    ? {
        storedInconsistent: verificationResult.storedAmountsInconsistent,
        computedInconsistent: verificationResult.auditAmountsInconsistent,
        storedTotal: verificationResult.storedTotal,
        computedTotal: verificationResult.auditTotal,
        totalAmount: verificationResult.originalAmount,
        difference: verificationResult.maxDiscrepancy,
        issues: verificationResult.issues,
      }
    : null;

  const isInconsistent = !!inconsistencyDetails;

  console.log({
    inconsistencyDetails,
    auditHistory,
    parsedMetadata,
    transaction,
  });

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

          {(displayedPaid || displayedRemaining) && (
            <View style={{ marginTop: hp(12) }}>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Payment Breakdown
              </Text>
              <View style={{ marginTop: hp(6) }}>
                {displayedPaid ? (
                  <Text variant="bodyMedium">
                    💰 Amount Paid: {safeFormat(displayedPaid)}
                    {usingAudit && displayedPaid !== paidStored
                      ? " (calculated from history)"
                      : ""}
                  </Text>
                ) : null}
                {displayedRemaining ? (
                  <Text variant="bodyMedium">
                    ⏳ Amount Due: {safeFormat(displayedRemaining)}
                    {usingAudit && displayedRemaining !== remainingStored
                      ? " (calculated from history)"
                      : ""}
                  </Text>
                ) : null}
                {isInconsistent ? (
                  <View style={{ marginTop: hp(8) }}>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.error, fontWeight: "600" }}
                    >
                      ⚠️ Data Verification Issue
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.error, marginTop: hp(4) }}
                    >
                      {inconsistencyDetails?.storedInconsistent
                        ? `Database records show ${formatCurrency(
                            inconsistencyDetails.storedTotal
                          )} total vs ${formatCurrency(
                            inconsistencyDetails.totalAmount
                          )} expected`
                        : ""}
                      {inconsistencyDetails?.computedInconsistent
                        ? `${
                            inconsistencyDetails?.storedInconsistent ? "\n" : ""
                          }Payment history shows ${formatCurrency(
                            inconsistencyDetails.computedTotal
                          )} total vs ${formatCurrency(
                            inconsistencyDetails.totalAmount
                          )} expected`
                        : ""}
                      {inconsistencyDetails &&
                      inconsistencyDetails.difference > 0.01
                        ? `\n• Difference: ${formatCurrency(
                            inconsistencyDetails.difference
                          )}`
                        : ""}
                      {inconsistencyDetails?.issues &&
                      inconsistencyDetails.issues.length > 0
                        ? `\n• Issues detected: ${inconsistencyDetails.issues.join(
                            ", "
                          )}`
                        : ""}
                      {"\n• This may indicate a data synchronization issue"}
                      {
                        "\n• Using payment history for most accurate information"
                      }
                    </Text>
                  </View>
                ) : verificationResult?.isHealthy ? (
                  <View style={{ marginTop: hp(8) }}>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.primary, fontWeight: "600" }}
                    >
                      ✅ Data Verified
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{
                        color: theme.colors.onSurfaceVariant,
                        marginTop: hp(4),
                      }}
                    >
                      Transaction amounts are consistent across all records
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          )}

          <View style={{ marginTop: hp(12) }}>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Customer Balance Impact
            </Text>
            <View style={{ marginTop: hp(6) }}>
              <Text variant="bodyMedium">
                📊 Balance before: {formatCurrency(balanceBefore)}
              </Text>
              <Text variant="bodyMedium">
                📈 Balance after: {formatCurrency(balanceAfter)}
              </Text>
              <Text
                variant="bodySmall"
                style={{
                  color:
                    balanceAfter > balanceBefore
                      ? theme.colors.error
                      : balanceAfter < balanceBefore
                      ? "#4CAF50"
                      : theme.colors.onSurfaceVariant,
                  marginTop: hp(4),
                }}
              >
                {balanceAfter > balanceBefore
                  ? `📈 Customer debt increased by ${formatCurrency(
                      balanceAfter - balanceBefore
                    )}`
                  : balanceAfter < balanceBefore
                  ? `📉 Customer debt decreased by ${formatCurrency(
                      balanceBefore - balanceAfter
                    )}`
                  : "✅ No change in customer balance"}
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

          {/* Show enhanced audit information and payment allocations */}
          {auditSummary?.hasAuditTrail && (
            <View style={{ marginTop: hp(12) }}>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Payment Allocations & Audit Trail
              </Text>

              {/* Show payment breakdown allocations if available */}
              {paymentBreakdown?.allocations &&
                paymentBreakdown.allocations.length > 0 && (
                  <View style={{ marginTop: hp(6) }}>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.primary, fontWeight: "600" }}
                    >
                      Payment Allocations ({paymentBreakdown.allocations.length}
                      )
                    </Text>
                    {paymentBreakdown.allocations.map(
                      (allocation: any, i: number) => (
                        <Text
                          key={`allocation-${i}`}
                          variant="bodyMedium"
                          style={{ marginTop: hp(2) }}
                        >
                          {allocation.type} ·{" "}
                          {formatCurrency(allocation.amount)} ·{" "}
                          {new Date(allocation.created_at).toLocaleString()}
                        </Text>
                      )
                    )}
                  </View>
                )}

              {/* Show transaction-specific audit entries */}
              {auditSummary?.transactionAudit?.entries &&
                auditSummary.transactionAudit.entries.length > 0 && (
                  <View style={{ marginTop: hp(8) }}>
                    <Text
                      variant="bodySmall"
                      style={{
                        color: theme.colors.secondary,
                        fontWeight: "600",
                      }}
                    >
                      Transaction Audit (
                      {auditSummary.transactionAudit.entries.length} entries)
                    </Text>
                    {auditSummary.transactionAudit.entries.map(
                      (entry: any, i: number) => (
                        <Text
                          key={`tx-audit-${i}`}
                          variant="bodyMedium"
                          style={{ marginTop: hp(2) }}
                        >
                          {entry.type} · {formatCurrency(entry.amount)} ·{" "}
                          {new Date(entry.createdAt).toLocaleString()}
                        </Text>
                      )
                    )}
                  </View>
                )}

              {/* Fallback to old audit history if new data not available */}
              {(!paymentBreakdown?.allocations ||
                paymentBreakdown.allocations.length === 0) &&
                (!auditSummary?.transactionAudit?.entries ||
                  auditSummary.transactionAudit.entries.length === 0) &&
                auditHistory &&
                auditHistory.length > 0 && (
                  <View style={{ marginTop: hp(6) }}>
                    {(auditHistory || []).map((a: any, i: number) => {
                      const typeLabel =
                        typeof a?.type === "string"
                          ? a.type
                          : String(
                              a?.type ?? a?.metadata?.type ?? "allocation"
                            );
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
                )}
            </View>
          )}

          {/* Show message when no audit trail exists */}
          {!auditSummary?.hasAuditTrail &&
            (!auditHistory || auditHistory.length === 0) && (
              <View style={{ marginTop: hp(12) }}>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  Payment Audit Trail
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{ marginTop: hp(6), color: theme.colors.outline }}
                >
                  No payment audit records found
                </Text>
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
