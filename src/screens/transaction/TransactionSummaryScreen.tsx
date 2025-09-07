import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "react-native-paper";

import ScreenContainer, {
  edgesHorizontal,
} from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTransactionBusinessLogic } from "@/hooks/business/useTransactionBusinessLogic";
import { useCustomers } from "@/hooks/useCustomers";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/utils/currency";
import { fontSize, hp, wp } from "@/utils/responsive_dimensions_system";

import { TransactionFormData } from "@/types/forms/TransactionForm";
import { TransactionType } from "@/types/transaction";
import {
  getPaymentMethodDescriptions,
  getTransactionTypeDescriptions,
} from "@/utils/business/transactionCalculations";

export default function TransactionSummaryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams();

  const { createTransactionAsync, updateTransactionAsync } = useTransactions();
  const { customers } = useCustomers();

  const [loading, setLoading] = useState(false);

  // Parse the transaction data from params
  const transactionData: TransactionFormData = JSON.parse(
    params.transactionData as string
  );
  const isEdit = params.isEdit === "true";
  const transactionId = params.transactionId as string;

  const selectedCustomer = customers?.find(
    (c) => c.id === transactionData.customerId
  );

  const { currentCustomerDebt, calculateNewDebt, formatTransactionData } =
    useTransactionBusinessLogic({
      customerId: transactionData.customerId,
      amount: transactionData.amount,
      type: transactionData.type,
      paymentMethod: transactionData.paymentMethod,
      appliedToDebt: transactionData.appliedToDebt,
    });

  const transactionTypeDescriptions = getTransactionTypeDescriptions();
  const paymentMethodDescriptions = getPaymentMethodDescriptions();

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case "sale":
        return "cart.fill";
      case "payment":
        return "creditcard.fill";
      case "credit":
        return "clock.fill";
      case "refund":
        return "return";
      default:
        return "dollarsign.circle.fill";
    }
  };

  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case "sale":
        return "#34C759"; // iOS green
      case "payment":
        return "#007AFF"; // iOS blue
      case "credit":
        return "#FF9500"; // iOS orange
      case "refund":
        return "#FF3B30"; // iOS red
      default:
        return "#8E8E93"; // iOS gray
    }
  };

  const getTypeBackgroundColor = (type: TransactionType) => {
    switch (type) {
      case "sale":
        return "#E8F5E8";
      case "payment":
        return "#E3F2FD";
      case "credit":
        return "#FFF3E0";
      case "refund":
        return "#FFEBEE";
      default:
        return "#F2F2F7";
    }
  };

  const getSuccessMessage = (
    data: TransactionFormData,
    customerName: string | undefined,
    isEdit: boolean
  ): string => {
    const amount = formatCurrency(parseFloat(data.amount));
    const action = isEdit ? "updated" : "recorded";
    const customer = customerName || "the customer";

    switch (data.type) {
      case "sale":
        if (data.paymentMethod === "credit") {
          return `Sale of ${amount} on credit has been ${action} for ${customer}`;
        } else if (data.paymentMethod === "mixed") {
          const paidAmount = formatCurrency(parseFloat(data.paidAmount || "0"));
          return `Sale of ${amount} with ${paidAmount} paid now has been ${action} for ${customer}`;
        } else {
          return `Sale of ${amount} has been ${action} for ${customer}`;
        }

      case "payment":
        if (data.appliedToDebt) {
          return `Payment of ${amount} received from ${customer} and applied to outstanding debt`;
        } else {
          return `Payment of ${amount} received from ${customer} as deposit for future service`;
        }

      case "credit":
        return `Credit of ${amount} has been issued to ${customer}`;

      case "refund":
        return `Refund of ${amount} has been processed for ${customer}`;

      default:
        return `Transaction has been ${action} successfully`;
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const formattedData = formatTransactionData(transactionData);

      if (isEdit && transactionId) {
        await updateTransactionAsync({
          id: transactionId,
          updates: formattedData,
        });
        Alert.alert(
          "Success",
          getSuccessMessage(transactionData, selectedCustomer?.name, true)
        );
      } else {
        await createTransactionAsync(formattedData);
        Alert.alert(
          "Success",
          getSuccessMessage(transactionData, selectedCustomer?.name, false),
          [
            {
              text: "Add Another",
              onPress: () => {
                router.dismissAll();
                router.push("/(modal)/transaction/add");
              },
            },
            {
              text: "View Customer",
              onPress: () => {
                router.dismissAll();
                router.push(`/customer/${transactionData.customerId}`);
              },
            },
          ]
        );
      }

      // Navigate back to customer or home
      if (!isEdit) {
        router.dismissAll();
      }
    } catch (error) {
      console.error("Failed to save transaction:", error);
      Alert.alert("Error", "Failed to save transaction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View
        style={[
          styles.headerIconContainer,
          { backgroundColor: getTypeBackgroundColor(transactionData.type) },
        ]}
      >
        <IconSymbol
          name={getTypeIcon(transactionData.type)}
          size={32}
          color={getTypeColor(transactionData.type)}
        />
      </View>
      <ThemedText
        style={[styles.headerTitle, { color: theme.colors.onSurface }]}
      >
        {isEdit ? "Update Transaction" : "Review Transaction"}
      </ThemedText>
      <ThemedText
        style={[
          styles.headerSubtitle,
          { color: theme.colors.onSurfaceVariant },
        ]}
      >
        Please review the details before {isEdit ? "updating" : "submitting"}
      </ThemedText>
    </View>
  );

  const renderTransactionDetails = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <IconSymbol name="doc.text" size={20} color={theme.colors.primary} />
        <ThemedText
          style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
        >
          Transaction Details
        </ThemedText>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.elevation.level1 },
        ]}
      >
        {/* Transaction Type Row */}
        <View style={styles.detailRow}>
          <View style={styles.detailIconContainer}>
            <View
              style={[
                styles.detailIcon,
                {
                  backgroundColor: getTypeBackgroundColor(transactionData.type),
                },
              ]}
            >
              <IconSymbol
                name={getTypeIcon(transactionData.type)}
                size={20}
                color={getTypeColor(transactionData.type)}
              />
            </View>
          </View>
          <View style={styles.detailContent}>
            <ThemedText
              style={[
                styles.detailLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Transaction Type
            </ThemedText>
            <ThemedText
              style={[styles.detailValue, { color: theme.colors.onSurface }]}
            >
              {transactionData.type.charAt(0).toUpperCase() +
                transactionData.type.slice(1)}
            </ThemedText>
            <ThemedText
              style={[
                styles.detailDescription,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {transactionTypeDescriptions[transactionData.type]}
            </ThemedText>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Amount Row */}
        <View style={styles.detailRowSimple}>
          <ThemedText
            style={[
              styles.detailLabel,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Amount
          </ThemedText>
          <ThemedText
            style={[
              styles.amountText,
              { color: getTypeColor(transactionData.type) },
            ]}
          >
            {formatCurrency(parseFloat(transactionData.amount))}
          </ThemedText>
        </View>

        {/* Customer Row */}
        <View style={styles.detailRowSimple}>
          <ThemedText
            style={[
              styles.detailLabel,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Customer
          </ThemedText>
          <ThemedText
            style={[styles.detailValue, { color: theme.colors.onSurface }]}
          >
            {selectedCustomer?.name}
          </ThemedText>
        </View>

        {/* Payment Method */}
        {transactionData.paymentMethod && (
          <View style={styles.detailRowSimple}>
            <ThemedText
              style={[
                styles.detailLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Payment Method
            </ThemedText>
            <View
              style={[
                styles.badge,
                { backgroundColor: theme.colors.primary + "15" },
              ]}
            >
              <ThemedText
                type="caption"
                numberOfLines={2}
                ellipsizeMode="tail"
                style={[styles.badgeText, { color: theme.colors.primary }]}
              >
                {paymentMethodDescriptions[transactionData.paymentMethod]}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Paid Amount (for mixed payments) */}
        {transactionData.paidAmount && (
          <View style={styles.detailRowSimple}>
            <ThemedText
              style={[
                styles.detailLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Amount Paid Now
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: "#34C759" }]}>
              {formatCurrency(parseFloat(transactionData.paidAmount))}
            </ThemedText>
          </View>
        )}

        {/* Remaining Amount */}
        {transactionData.paymentMethod === "mixed" &&
          parseFloat(transactionData.amount) >
            parseFloat(transactionData.paidAmount || "0") && (
            <View style={styles.detailRowSimple}>
              <ThemedText
                style={[
                  styles.detailLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Remaining Amount
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: "#FF9500" }]}>
                {formatCurrency(
                  parseFloat(transactionData.amount) -
                    parseFloat(transactionData.paidAmount || "0")
                )}
              </ThemedText>
            </View>
          )}

        {/* Apply to Debt */}
        {transactionData.type === "payment" && (
          <View style={styles.detailRowSimple}>
            <ThemedText
              style={[
                styles.detailLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Apply to Existing Debt
            </ThemedText>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: transactionData.appliedToDebt
                    ? "#E8F5E8"
                    : "#F2F2F7",
                },
              ]}
            >
              <ThemedText
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.badgeText,
                  {
                    color: transactionData.appliedToDebt
                      ? "#34C759"
                      : "#8E8E93",
                  },
                ]}
              >
                {transactionData.appliedToDebt ? "Yes" : "No"}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Date */}
        <View style={styles.detailRowSimple}>
          <ThemedText
            style={[
              styles.detailLabel,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Date
          </ThemedText>
          <ThemedText
            style={[styles.detailValue, { color: theme.colors.onSurface }]}
          >
            {new Date(transactionData.date).toLocaleDateString("en-US", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </ThemedText>
        </View>

        {/* Description */}
        {transactionData.description && (
          <View style={styles.descriptionContainer}>
            <ThemedText
              style={[
                styles.detailLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Description
            </ThemedText>
            <ThemedText
              style={[
                styles.descriptionText,
                { color: theme.colors.onSurface },
              ]}
            >
              {transactionData.description}
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );

  const renderBusinessImpact = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <IconSymbol
          name="chart.bar.fill"
          size={20}
          color={theme.colors.primary}
        />
        <ThemedText
          style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
        >
          Business Impact
        </ThemedText>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.elevation.level1 },
        ]}
      >
        {/* Current Debt Status */}
        {currentCustomerDebt > 0 && (
          <>
            <View style={styles.impactAlert}>
              <View style={[styles.alertIcon, { backgroundColor: "#FFEBEE" }]}>
                <IconSymbol
                  name="exclamationmark.triangle.fill"
                  size={16}
                  color="#FF3B30"
                />
              </View>
              <View style={styles.alertContent}>
                <ThemedText
                  style={[styles.alertTitle, { color: theme.colors.onSurface }]}
                >
                  Outstanding Debt
                </ThemedText>
                <ThemedText style={[styles.alertAmount, { color: "#FF3B30" }]}>
                  {formatCurrency(currentCustomerDebt)}
                </ThemedText>
              </View>
            </View>
            <View style={styles.divider} />
          </>
        )}

        {/* Impact Analysis */}
        <View style={styles.impactSection}>
          <ThemedText
            style={[styles.impactTitle, { color: theme.colors.onSurface }]}
          >
            What will happen:
          </ThemedText>

          <View style={styles.impactList}>
            {transactionData.type === "sale" && (
              <>
                {transactionData.paymentMethod === "cash" && (
                  <View style={styles.impactItem}>
                    <View
                      style={[
                        styles.impactIcon,
                        { backgroundColor: "#E8F5E8" },
                      ]}
                    >
                      <IconSymbol
                        name="arrow.up.circle.fill"
                        size={16}
                        color="#34C759"
                      />
                    </View>
                    <ThemedText
                      style={[
                        styles.impactText,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      Revenue increases by{" "}
                      {formatCurrency(parseFloat(transactionData.amount))}
                    </ThemedText>
                  </View>
                )}

                {transactionData.paymentMethod === "credit" && (
                  <>
                    <View style={styles.impactItem}>
                      <View
                        style={[
                          styles.impactIcon,
                          { backgroundColor: "#E8F5E8" },
                        ]}
                      >
                        <IconSymbol
                          name="arrow.up.circle.fill"
                          size={16}
                          color="#34C759"
                        />
                      </View>
                      <ThemedText
                        style={[
                          styles.impactText,
                          { color: theme.colors.onSurface },
                        ]}
                      >
                        Revenue increases by{" "}
                        {formatCurrency(parseFloat(transactionData.amount))}
                      </ThemedText>
                    </View>
                    <View style={styles.impactItem}>
                      <View
                        style={[
                          styles.impactIcon,
                          { backgroundColor: "#FFF3E0" },
                        ]}
                      >
                        <IconSymbol
                          name="exclamationmark.triangle.fill"
                          size={16}
                          color="#FF9500"
                        />
                      </View>
                      <ThemedText
                        style={[
                          styles.impactText,
                          { color: theme.colors.onSurface },
                        ]}
                      >
                        Customer debt increases by{" "}
                        {formatCurrency(parseFloat(transactionData.amount))}
                      </ThemedText>
                    </View>
                    <View style={styles.impactItem}>
                      <View
                        style={[
                          styles.impactIcon,
                          { backgroundColor: "#E3F2FD" },
                        ]}
                      >
                        <IconSymbol
                          name="arrow.right.circle.fill"
                          size={16}
                          color="#007AFF"
                        />
                      </View>
                      <ThemedText
                        style={[
                          styles.impactText,
                          { color: theme.colors.onSurface },
                        ]}
                      >
                        New debt balance: {formatCurrency(calculateNewDebt())}
                      </ThemedText>
                    </View>
                  </>
                )}

                {transactionData.paymentMethod === "mixed" && (
                  <>
                    <View style={styles.impactItem}>
                      <View
                        style={[
                          styles.impactIcon,
                          { backgroundColor: "#E8F5E8" },
                        ]}
                      >
                        <IconSymbol
                          name="arrow.up.circle.fill"
                          size={16}
                          color="#34C759"
                        />
                      </View>
                      <ThemedText
                        style={[
                          styles.impactText,
                          { color: theme.colors.onSurface },
                        ]}
                      >
                        Revenue increases by{" "}
                        {formatCurrency(
                          parseFloat(transactionData.paidAmount || "0")
                        )}
                      </ThemedText>
                    </View>
                    <View style={styles.impactItem}>
                      <View
                        style={[
                          styles.impactIcon,
                          { backgroundColor: "#FFF3E0" },
                        ]}
                      >
                        <IconSymbol
                          name="exclamationmark.triangle.fill"
                          size={16}
                          color="#FF9500"
                        />
                      </View>
                      <ThemedText
                        style={[
                          styles.impactText,
                          { color: theme.colors.onSurface },
                        ]}
                      >
                        Customer debt increases by{" "}
                        {formatCurrency(
                          parseFloat(transactionData.amount) -
                            parseFloat(transactionData.paidAmount || "0")
                        )}
                      </ThemedText>
                    </View>
                    <View style={styles.impactItem}>
                      <View
                        style={[
                          styles.impactIcon,
                          { backgroundColor: "#E3F2FD" },
                        ]}
                      >
                        <IconSymbol
                          name="arrow.right.circle.fill"
                          size={16}
                          color="#007AFF"
                        />
                      </View>
                      <ThemedText
                        style={[
                          styles.impactText,
                          { color: theme.colors.onSurface },
                        ]}
                      >
                        New debt balance: {formatCurrency(calculateNewDebt())}
                      </ThemedText>
                    </View>
                  </>
                )}
              </>
            )}

            {transactionData.type === "payment" && (
              <>
                {transactionData.appliedToDebt ? (
                  <>
                    <View style={styles.impactItem}>
                      <View
                        style={[
                          styles.impactIcon,
                          { backgroundColor: "#E8F5E8" },
                        ]}
                      >
                        <IconSymbol
                          name="arrow.down.circle.fill"
                          size={16}
                          color="#34C759"
                        />
                      </View>
                      <ThemedText
                        style={[
                          styles.impactText,
                          { color: theme.colors.onSurface },
                        ]}
                      >
                        Customer debt decreases by{" "}
                        {formatCurrency(parseFloat(transactionData.amount))}
                      </ThemedText>
                    </View>
                    <View style={styles.impactItem}>
                      <View
                        style={[
                          styles.impactIcon,
                          { backgroundColor: "#E3F2FD" },
                        ]}
                      >
                        <IconSymbol
                          name="arrow.right.circle.fill"
                          size={16}
                          color="#007AFF"
                        />
                      </View>
                      <ThemedText
                        style={[
                          styles.impactText,
                          { color: theme.colors.onSurface },
                        ]}
                      >
                        New debt balance: {formatCurrency(calculateNewDebt())}
                      </ThemedText>
                    </View>
                  </>
                ) : (
                  <View style={styles.impactItem}>
                    <View
                      style={[
                        styles.impactIcon,
                        { backgroundColor: "#E3F2FD" },
                      ]}
                    >
                      <IconSymbol
                        name="arrow.up.circle.fill"
                        size={16}
                        color="#007AFF"
                      />
                    </View>
                    <ThemedText
                      style={[
                        styles.impactText,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      Future service deposit recorded:{" "}
                      {formatCurrency(parseFloat(transactionData.amount))}
                    </ThemedText>
                  </View>
                )}
              </>
            )}

            {transactionData.type === "credit" && (
              <>
                <View style={styles.impactItem}>
                  <View
                    style={[styles.impactIcon, { backgroundColor: "#FFEBEE" }]}
                  >
                    <IconSymbol
                      name="minus.circle.fill"
                      size={16}
                      color="#FF3B30"
                    />
                  </View>
                  <ThemedText
                    style={[
                      styles.impactText,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    Revenue decreases by{" "}
                    {formatCurrency(parseFloat(transactionData.amount))}
                  </ThemedText>
                </View>
                <View style={styles.impactItem}>
                  <View
                    style={[styles.impactIcon, { backgroundColor: "#E3F2FD" }]}
                  >
                    <IconSymbol
                      name="arrow.right.circle.fill"
                      size={16}
                      color="#007AFF"
                    />
                  </View>
                  <ThemedText
                    style={[
                      styles.impactText,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    Customer credit balance:{" "}
                    {formatCurrency(calculateNewDebt())}
                  </ThemedText>
                </View>
              </>
            )}

            {transactionData.type === "refund" && (
              <View style={styles.impactItem}>
                <View
                  style={[styles.impactIcon, { backgroundColor: "#FFEBEE" }]}
                >
                  <IconSymbol
                    name="arrow.down.circle.fill"
                    size={16}
                    color="#FF3B30"
                  />
                </View>
                <ThemedText
                  style={[styles.impactText, { color: theme.colors.onSurface }]}
                >
                  Revenue decreases by{" "}
                  {formatCurrency(parseFloat(transactionData.amount))}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.buttonContainer}>
      <TouchableOpacity
        style={[
          styles.primaryButton,
          { backgroundColor: getTypeColor(transactionData.type) },
          loading && styles.disabledButton,
        ]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <IconSymbol
          name={loading ? "hourglass" : "checkmark.circle.fill"}
          size={20}
          color="white"
        />
        <ThemedText style={styles.primaryButtonText}>
          {loading
            ? "Processing..."
            : isEdit
            ? "Update Transaction"
            : "Submit Transaction"}
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.secondaryButton,
          {
            borderColor: theme.colors.outline,
            backgroundColor: theme.colors.surface,
          },
        ]}
        onPress={handleGoBack}
        disabled={loading}
      >
        <IconSymbol name="pencil" size={20} color={theme.colors.onSurface} />
        <ThemedText
          style={[
            styles.secondaryButtonText,
            { color: theme.colors.onSurface },
          ]}
        >
          Edit Details
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenContainer withPadding={false} edges={[...edgesHorizontal, "bottom"]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderHeader()}
        {renderTransactionDetails()}
        {renderBusinessImpact()}
        {renderActionButtons()}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(32),
  },
  headerContainer: {
    alignItems: "center",
    paddingHorizontal: wp(24),
    paddingVertical: hp(32),
  },
  headerIconContainer: {
    width: wp(64),
    height: wp(64),
    borderRadius: wp(32),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: hp(16),
  },
  headerTitle: {
    fontSize: fontSize(24),
    fontWeight: "700",
    textAlign: "center",
    marginBottom: hp(8),
  },
  headerSubtitle: {
    fontSize: fontSize(16),
    textAlign: "center",
    opacity: 0.8,
  },
  sectionContainer: {
    paddingHorizontal: wp(20),
    marginBottom: hp(24),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(16),
    gap: wp(8),
  },
  sectionTitle: {
    fontSize: fontSize(18),
    fontWeight: "600",
  },
  card: {
    borderRadius: wp(16),
    padding: wp(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: hp(12),
  },
  detailRowSimple: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: hp(12),
  },
  detailIconContainer: {
    marginRight: wp(12),
  },
  detailIcon: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    justifyContent: "center",
    alignItems: "center",
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: fontSize(14),
    marginBottom: hp(4),
    fontWeight: "500",
  },
  detailValue: {
    fontSize: fontSize(16),
    fontWeight: "600",
  },
  detailDescription: {
    fontSize: fontSize(14),
    marginTop: hp(2),
    opacity: 0.8,
  },
  amountText: {
    fontSize: fontSize(20),
    fontWeight: "700",
  },
  badge: {
    paddingHorizontal: wp(6),
    paddingVertical: hp(2),
    borderRadius: wp(7),
    maxWidth: wp(160),
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    fontSize: fontSize(12),
    fontWeight: "600",
    flexShrink: 1,
  },
  descriptionContainer: {
    paddingVertical: hp(12),
  },
  descriptionText: {
    fontSize: fontSize(16),
    marginTop: hp(4),
    lineHeight: hp(22),
  },
  divider: {
    height: 1,
    backgroundColor: "#F2F2F7",
    marginVertical: hp(8),
  },
  impactAlert: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(12),
  },
  alertIcon: {
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(12),
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: fontSize(16),
    fontWeight: "600",
    marginBottom: hp(2),
  },
  alertAmount: {
    fontSize: fontSize(18),
    fontWeight: "700",
  },
  impactSection: {
    paddingTop: hp(8),
  },
  impactTitle: {
    fontSize: fontSize(16),
    fontWeight: "600",
    marginBottom: hp(16),
  },
  impactList: {
    gap: hp(12),
  },
  impactItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  impactIcon: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(14),
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(12),
  },
  impactText: {
    fontSize: fontSize(15),
    flex: 1,
    lineHeight: hp(20),
  },
  buttonContainer: {
    paddingHorizontal: wp(20),
    gap: hp(12),
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(16),
    borderRadius: wp(16),
    gap: wp(8),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "white",
    fontSize: fontSize(16),
    fontWeight: "600",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(16),
    borderRadius: wp(16),
    gap: wp(8),
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: fontSize(16),
    fontWeight: "600",
  },
});
