import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller } from "react-hook-form";
import {
  Alert,
  ScrollView,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { TextInput, useTheme } from "react-native-paper";

import ScreenContainer, {
  edgesHorizontal,
} from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import DebtConfirmation from "@/components/ui/DebtConfirmation";
import { FormField } from "@/components/ui/FormField";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useTransactionBusinessLogic } from "@/hooks/business/useTransactionBusinessLogic";
import { useTransactionForm } from "@/hooks/forms/useTransactionForm";
import { useCustomers } from "@/hooks/useCustomers";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/utils/currency";
import { hp, wp } from "@/utils/responsive_dimensions_system";

import {
  TransactionFormData,
  TransactionFormProps,
} from "@/types/forms/TransactionForm";
import { TransactionType } from "@/types/transaction";
import {
  getPaymentMethodDescriptions,
  getTransactionTypeDescriptions,
} from "@/utils/business/transactionCalculations";
import {
  validateAppliedToDebt,
  validateMixedPayment,
} from "@/utils/validation/transactionValidation";
import { AmountInput } from "./AmountInput";
import { CustomerSelector } from "./CustomerSelector";
import { DatePickerWithPresets } from "./DatePickerWithPresets";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { TransactionTypeSelector } from "./TransactionTypeSelector";

export default function TransactionForm({
  customerId,
  initialData,
  transactionId,
}: TransactionFormProps) {
  const router = useRouter();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { createTransaction, updateTransaction } = useTransactions();
  const { customers } = useCustomers();

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    control,
    handleSubmit,
    errors,
    reset: resetForm,
    watch,
    setValue,
    watchedValues,
    filteredCustomers,
    isDatePickerVisible,
    setDatePickerVisible,
    showMorePaymentMethods,
    setShowMorePaymentMethods,
  } = useTransactionForm({
    customerId,
    customers: customers || [],
    searchQuery,
    setSearchQuery,
    initialData,
  });

  const {
    currentCustomerDebt,
    calculateNewDebt,
    shouldShowDebtPreview,
    shouldShowFutureServiceNote,
    formatTransactionData,
  } = useTransactionBusinessLogic({
    customerId: watchedValues.customerId,
    amount: watchedValues.amount,
    type: watchedValues.type,
    paymentMethod: watchedValues.paymentMethod,
    appliedToDebt: watch("appliedToDebt"),
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
        return Colors[isDark ? "dark" : "light"].success;
      case "payment":
        return Colors[isDark ? "dark" : "light"].secondary;
      case "credit":
        return Colors[isDark ? "dark" : "light"].warning;
      case "refund":
        return Colors[isDark ? "dark" : "light"].error;
      default:
        return Colors[isDark ? "dark" : "light"].textTertiary;
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

  const onSubmit = async (data: TransactionFormData) => {
    try {
      setLoading(true);

      // Validate appliedToDebt for payment transactions
      const appliedToDebtValidation = validateAppliedToDebt(
        data.type,
        data.appliedToDebt
      );
      if (appliedToDebtValidation !== true) {
        Alert.alert("Error", appliedToDebtValidation);
        return;
      }

      const transactionData = formatTransactionData(data);

      if (transactionId) {
        // Editing mode
        updateTransaction({
          id: transactionId,
          updates: transactionData,
        });
        Alert.alert(
          "Success",
          getSuccessMessage(data, selectedCustomer?.name, true)
        );
      } else {
        // Creating mode
        createTransaction(transactionData);
        Alert.alert(
          "Success",
          getSuccessMessage(data, selectedCustomer?.name, false),
          [
            {
              text: "Add Another",
              onPress: () => resetForm(data.customerId),
            },
            {
              text: "View Customer",
              onPress: () => {
                router.dismiss();
                router.push(`/customer/${data.customerId}`);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("Failed to save transaction:", error);
      Alert.alert("Error", "Failed to save transaction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = customers?.find(
    (c) => c.id === watchedValues.customerId
  );

  const getSubmitButtonText = (
    type: TransactionType,
    loading: boolean
  ): string => {
    if (loading) return "Processing...";

    switch (type) {
      case "sale":
        return "Record Sale";
      case "payment":
        return "Record Payment";
      case "credit":
        return "Issue Credit";
      case "refund":
        return "Process Refund";
      default:
        return "Add Transaction";
    }
  };

  const getTransactionHeaderText = (
    type: TransactionType,
    customerName: string
  ): string => {
    switch (type) {
      case "sale":
        return `Record Sale for ${customerName}`;
      case "payment":
        return `Record Payment from ${customerName}`;
      case "credit":
        return `Issue Credit to ${customerName}`;
      case "refund":
        return `Process Refund for ${customerName}`;
      default:
        return `Record Transaction for ${customerName}`;
    }
  };

  return (
    <ScreenContainer withPadding={false} edges={[...edgesHorizontal, "bottom"]}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 16 }}>
          <View
            style={{
              alignItems: "center",
              marginBottom: hp(20),
              paddingVertical: hp(8),
            }}
          >
            <IconSymbol
              name={getTypeIcon(watchedValues.type)}
              size={32}
              color={getTypeColor(watchedValues.type)}
            />
            <ThemedText
              style={{ marginTop: hp(12), opacity: 0.7, textAlign: "center" }}
            >
              {selectedCustomer
                ? getTransactionHeaderText(
                    watchedValues.type,
                    selectedCustomer.name
                  )
                : "Record a new transaction"}
            </ThemedText>
            {selectedCustomer && currentCustomerDebt > 0 && (
              <ThemedText
                style={{
                  marginTop: hp(6),
                  color: Colors[isDark ? "dark" : "light"].error,
                }}
              >
                Outstanding Debt: {formatCurrency(currentCustomerDebt)}
              </ThemedText>
            )}
          </View>

          {/* Transaction Type */}
          <FormField
            label="Transaction Type"
            required
            error={errors.type?.message}
          >
            <TransactionTypeSelector
              value={watchedValues.type}
              onChange={(type) => setValue("type", type)}
              descriptions={transactionTypeDescriptions}
            />
          </FormField>

          {/* Customer Selection */}
          <FormField
            label="Customer"
            required
            error={errors.customerId?.message}
          >
            <CustomerSelector
              customers={customers || []}
              selectedId={watchedValues.customerId}
              onSelect={(id) => setValue("customerId", id)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filteredCustomers={filteredCustomers}
            />
          </FormField>

          {/* Amount Field */}
          <FormField label="Amount" required error={errors.amount?.message}>
            <AmountInput
              value={watchedValues.amount}
              onChange={(value) => setValue("amount", value)}
              onQuickAmountSelect={(amount) =>
                setValue("amount", amount.toString())
              }
              error={errors.amount?.message}
              transactionType={watchedValues.type}
            />

            {/* Visual Confirmations for Credit Transactions */}
            {watchedValues.amount &&
              !errors.amount &&
              watchedValues.type === "credit" && (
                <DebtConfirmation
                  amount={parseFloat(watchedValues.amount)}
                  customerName={selectedCustomer?.name}
                  color={Colors[isDark ? "dark" : "light"].warning}
                  variant="add"
                />
              )}

            {/* Visual Confirmations for Refunds */}
            {watchedValues.amount &&
              !errors.amount &&
              watchedValues.type === "refund" && (
                <DebtConfirmation
                  amount={parseFloat(watchedValues.amount)}
                  customerName={selectedCustomer?.name}
                  color={Colors[isDark ? "dark" : "light"].error}
                  variant="remove"
                />
              )}
          </FormField>

          {/* Payment Method Field - Only show for non-credit and non-refund transactions */}
          {watchedValues.type !== "credit" &&
            watchedValues.type !== "refund" && (
              <FormField
                label="Payment Method"
                required
                error={errors.paymentMethod?.message}
              >
                <View>
                  {/* Show outstanding debt for payment received */}
                  {watchedValues.type === "payment" &&
                    currentCustomerDebt > 0 && (
                      <View style={{ marginBottom: hp(8) }}>
                        <ThemedText
                          style={{ color: theme.colors.onSurfaceVariant }}
                        >
                          Customer&apos;s Outstanding Debt:{" "}
                          {formatCurrency(currentCustomerDebt)}
                        </ThemedText>
                        {/* Show new debt preview or future-service note per app flow spec */}
                        {shouldShowDebtPreview() && (
                          <ThemedText
                            style={{
                              marginTop: hp(6),
                              color: theme.colors.onSurfaceVariant,
                              fontWeight: "600",
                            }}
                          >
                            New Debt: {formatCurrency(calculateNewDebt())}
                          </ThemedText>
                        )}

                        {shouldShowFutureServiceNote() && (
                          <ThemedText
                            style={{
                              marginTop: hp(6),
                              color: theme.colors.onSurfaceVariant,
                            }}
                          >
                            This payment will be recorded as a deposit / future
                            service and will not reduce outstanding debt.
                          </ThemedText>
                        )}
                      </View>
                    )}

                  <PaymentMethodSelector
                    value={watchedValues.paymentMethod}
                    onChange={(method) => setValue("paymentMethod", method)}
                    transactionType={watchedValues.type}
                    showMore={showMorePaymentMethods}
                    onToggleMore={() =>
                      setShowMorePaymentMethods(!showMorePaymentMethods)
                    }
                    descriptions={paymentMethodDescriptions}
                  />

                  {/* Mixed Payment Amount Input */}
                  {watchedValues.paymentMethod === "mixed" && (
                    <View style={{ marginTop: hp(12) }}>
                      <FormField
                        label="Amount Paid Now"
                        required
                        error={errors.paidAmount?.message}
                      >
                        <Controller
                          control={control}
                          name="paidAmount"
                          rules={{
                            required:
                              "Amount paid is required for mixed payments",
                            validate: (val) =>
                              validateMixedPayment(
                                "mixed",
                                val || "",
                                watchedValues.amount
                              ),
                          }}
                          render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                              label="Amount Paid Now *"
                              mode="outlined"
                              value={value}
                              onChangeText={(text) =>
                                onChange(text.replace(/[^0-9.]/g, ""))
                              }
                              onBlur={onBlur}
                              error={!!errors.paidAmount}
                              style={{
                                backgroundColor: theme.colors.elevation.level1,
                              }}
                              keyboardType="numeric"
                              placeholder="0.00"
                              left={<TextInput.Icon icon="currency-ngn" />}
                            />
                          )}
                        />
                      </FormField>

                      {/* Remaining Amount Display */}
                      {watch("remainingAmount") &&
                        parseFloat(watch("remainingAmount") || "0") > 0 && (
                          <View style={{ marginTop: hp(8) }}>
                            <ThemedText
                              style={{
                                fontSize: wp(16),
                                fontWeight: "600",
                                marginBottom: 8,
                                color: theme.colors.onSurface,
                              }}
                            >
                              Remaining Amount
                            </ThemedText>
                            <TextInput
                              label="Remaining Amount"
                              mode="outlined"
                              value={watch("remainingAmount")}
                              editable={false}
                              style={{
                                backgroundColor: theme.colors.elevation.level1,
                              }}
                              left={<TextInput.Icon icon="currency-ngn" />}
                            />
                            <ThemedText
                              style={{
                                marginTop: hp(4),
                                color: theme.colors.onSurfaceVariant,
                                fontSize: 12,
                              }}
                            >
                              This amount will be added to the customer&apos;s
                              outstanding debt.
                            </ThemedText>
                          </View>
                        )}
                    </View>
                  )}

                  {/* Visual Confirmations for Debt Changes - Sale with Credit */}
                  {watchedValues.amount &&
                    !errors.amount &&
                    watchedValues.type === "sale" &&
                    watchedValues.paymentMethod === "credit" && (
                      <DebtConfirmation
                        amount={parseFloat(watchedValues.amount)}
                        customerName={selectedCustomer?.name}
                        color={Colors[isDark ? "dark" : "light"].warning}
                        variant="add"
                      />
                    )}

                  {/* Visual Confirmation for Mixed Payment Remaining Debt */}
                  {watchedValues.type === "sale" &&
                    watchedValues.paymentMethod === "mixed" &&
                    watchedValues.amount &&
                    parseFloat(watch("remainingAmount") || "0") > 0 && (
                      <DebtConfirmation
                        amount={parseFloat(watch("remainingAmount") || "0")}
                        customerName={selectedCustomer?.name}
                        color={Colors[isDark ? "dark" : "light"].warning}
                        variant="remaining"
                      />
                    )}
                </View>
              </FormField>
            )}

          {/* Apply to Debt Field - only show for payment transactions */}
          {watchedValues.type === "payment" && (
            <FormField
              label="Apply to Outstanding Debt?"
              required
              error={errors.appliedToDebt?.message}
            >
              <Controller
                control={control}
                name="appliedToDebt"
                rules={{
                  validate: (value) =>
                    validateAppliedToDebt(watchedValues.type, value),
                }}
                render={({ field: { onChange, value } }) => (
                  <View style={{ gap: hp(8) }}>
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <TouchableOpacity
                        style={[
                          {
                            flex: 1,
                            alignItems: "center",
                            justifyContent: "center",
                            paddingVertical: hp(12),
                            paddingHorizontal: hp(8),
                            borderRadius: 8,
                            borderWidth: 2,
                            borderColor: theme.colors.outline,
                            gap: 6,
                          },
                          value === true && { borderWidth: 2 },
                          value === true && {
                            backgroundColor:
                              Colors[isDark ? "dark" : "light"].success + "20",
                          },
                        ]}
                        onPress={() => onChange(true)}
                      >
                        <IconSymbol
                          name="checkmark.circle.fill"
                          size={20}
                          color={
                            value === true
                              ? Colors[isDark ? "dark" : "light"].success
                              : "#8E8E93"
                          }
                        />
                        <ThemedText
                          style={[
                            { fontWeight: "600", fontSize: 13 },
                            value === true && {
                              color: Colors[isDark ? "dark" : "light"].success,
                            },
                          ]}
                        >
                          Apply to Debt
                        </ThemedText>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          {
                            flex: 1,
                            alignItems: "center",
                            justifyContent: "center",
                            paddingVertical: hp(12),
                            paddingHorizontal: hp(8),
                            borderRadius: 8,
                            borderWidth: 2,
                            borderColor: theme.colors.outline,
                            gap: 6,
                          },
                          value === false && { borderWidth: 2 },
                          value === false && {
                            backgroundColor:
                              Colors[isDark ? "dark" : "light"].secondary +
                              "20",
                          },
                        ]}
                        onPress={() => onChange(false)}
                      >
                        <IconSymbol
                          name="arrow.forward.circle.fill"
                          size={20}
                          color={
                            value === false
                              ? Colors[isDark ? "dark" : "light"].secondary
                              : "#8E8E93"
                          }
                        />
                        <ThemedText
                          style={[
                            { fontWeight: "600", fontSize: 13 },
                            value === false && {
                              color:
                                Colors[isDark ? "dark" : "light"].secondary,
                            },
                          ]}
                        >
                          Future Service
                        </ThemedText>
                      </TouchableOpacity>
                    </View>

                    {/* Show debt reduction preview */}
                    {value === true && watchedValues.amount && (
                      <DebtConfirmation
                        amount={parseFloat(watchedValues.amount)}
                        customerName={selectedCustomer?.name}
                        color={Colors[isDark ? "dark" : "light"].success}
                        variant="remove"
                      />
                    )}
                  </View>
                )}
              />
            </FormField>
          )}

          {/* Description Field */}
          <FormField label="Description">
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Description"
                  mode="outlined"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={{ backgroundColor: theme.colors.elevation.level1 }}
                  placeholder="Add a note about this transaction..."
                  multiline
                  numberOfLines={3}
                  left={<TextInput.Icon icon="text" />}
                />
              )}
            />
          </FormField>

          {/* Date Field */}
          <FormField label="Date" required error={errors.date?.message}>
            <Controller
              control={control}
              name="date"
              rules={{ required: "Date is required" }}
              render={({ field: { onChange, value } }) => (
                <DatePickerWithPresets
                  value={value}
                  onChange={onChange}
                  error={errors.date?.message}
                  isVisible={isDatePickerVisible}
                  onToggleVisibility={() =>
                    setDatePickerVisible(!isDatePickerVisible)
                  }
                />
              )}
            />
          </FormField>

          <View style={{ marginTop: 24, marginBottom: 16 }}>
            <TouchableOpacity
              style={[
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 16,
                  borderRadius: 12,
                  gap: 8,
                  backgroundColor: getTypeColor(watchedValues.type),
                },
                loading && { opacity: 0.6 },
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
            >
              <IconSymbol name="plus" size={20} color="white" />
              <ThemedText
                style={{
                  color: theme.colors.onPrimary,
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                {loading
                  ? "Processing..."
                  : getSubmitButtonText(watchedValues.type, loading)}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
