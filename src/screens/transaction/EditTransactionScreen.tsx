import ScreenContainer, {
  edgesHorizontal,
  edgesVertical,
} from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useCustomers } from "@/hooks/useCustomers";
import { useTransaction, useTransactions } from "@/hooks/useTransactions";
import { UpdateTransactionInput } from "@/types/transaction";
import { getCustomerInitials } from "@/utils/helpers";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { HelperText, TextInput, useTheme } from "react-native-paper";
import { DatePickerModal } from "react-native-paper-dates";
import { createStyles } from "./EditTransactionScreen.styles";

interface TransactionFormData {
  amount: string;
  description: string;
  date: string;
  type: "sale" | "payment" | "refund";
  paymentMethod: "cash" | "bank_transfer" | "pos_card" | "credit" | "mixed";
  paidAmount: string;
  remainingAmount: string;
  dueDate: Date | null;
  appliedToDebt?: boolean;
}

interface EditTransactionScreenProps {
  transactionId: string;
}

export default function EditTransactionScreen({
  transactionId,
}: EditTransactionScreenProps) {
  const router = useRouter();
  const theme = useTheme();
  // Create dynamic styles
  const dynamicStyles = createStyles(theme);

  // Use React Query hooks
  const transactionQuery = useTransaction(transactionId);
  const { updateTransaction } = useTransactions();
  const { customers } = useCustomers();

  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const transaction = transactionQuery.data;
  const initialLoading = transactionQuery.isLoading;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<TransactionFormData>({
    defaultValues: {
      amount: "",
      description: "",
      date: "",
      type: "sale",
      paymentMethod: "cash",
      paidAmount: "",
      remainingAmount: "",
      dueDate: null,
      appliedToDebt: false,
    },
  });

  const watchedType = watch("type");
  const watchedAmount = watch("amount");
  const watchedPaymentMethod = watch("paymentMethod");

  // Load transaction data and set form values when transaction data is available
  const lastTransactionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!transaction) return;

    // Avoid re-applying same transaction (prevents render loops)
    if (lastTransactionIdRef.current === transaction.id) return;
    lastTransactionIdRef.current = transaction.id;

    // Find customer details
    const foundCustomer = customers.find(
      (c: any) => c.id === transaction.customerId
    );

    // Only update state if the customer actually changed to avoid re-renders
    setCustomer((prev: any) => {
      if (prev && foundCustomer && prev.id === foundCustomer.id) return prev;
      return foundCustomer || null;
    });

    // Set form values
    reset({
      amount: transaction.amount.toString(),
      description: transaction.description || "",
      date: transaction.date,
      type: transaction.type as "sale" | "payment" | "refund",
      paymentMethod: transaction.paymentMethod || "cash",
      paidAmount: transaction.paidAmount?.toString() || "",
      remainingAmount: transaction.remainingAmount?.toString() || "",
      dueDate: transaction.dueDate ? new Date(transaction.dueDate) : null,
      appliedToDebt: transaction.appliedToDebt || false,
    });

    // Intentionally only run when transaction id changes — customers array can be unstable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction?.id, reset]);

  const validateAmount = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return "Please enter a valid amount greater than 0";
    }
    return true;
  };

  const formatAmountInput = (text: string) => {
    // Remove non-numeric characters except decimal point
    const numericValue = text.replace(/[^0-9.]/g, "");
    // Ensure only one decimal point
    const parts = numericValue.split(".");
    if (parts.length > 2) {
      return parts[0] + "." + parts.slice(1).join("");
    }
    return numericValue;
  };

  const quickAmountPresets = [500, 1000, 2000, 5000, 10000];

  const handleQuickAmount = (amount: number) => {
    setValue("amount", amount.toString());
  };

  const onSubmit = async (data: TransactionFormData) => {
    if (!transaction) return;

    try {
      setLoading(true);

      const updates: UpdateTransactionInput = {};

      // Only include changed values
      if (parseFloat(data.amount) !== transaction.amount) {
        updates.amount = parseFloat(data.amount);
      }

      if (data.description.trim() !== (transaction.description || "")) {
        updates.description = data.description.trim() || undefined;
      }

      if (data.date !== transaction.date) {
        updates.date = data.date;
      }

      if (data.type !== transaction.type) {
        updates.type = data.type;
      }

      if (data.paymentMethod !== (transaction.paymentMethod || "cash")) {
        updates.paymentMethod = data.paymentMethod;
      }

      if (
        parseFloat(data.paidAmount || "0") !== (transaction.paidAmount || 0)
      ) {
        updates.paidAmount = parseFloat(data.paidAmount || "0") || undefined;
      }

      if (
        parseFloat(data.remainingAmount || "0") !==
        (transaction.remainingAmount || 0)
      ) {
        updates.remainingAmount =
          parseFloat(data.remainingAmount || "0") || undefined;
      }

      const formDueDate = data.dueDate
        ? format(data.dueDate, "yyyy-MM-dd")
        : null;
      const transactionDueDate = transaction.dueDate || null;
      if (formDueDate !== transactionDueDate) {
        updates.dueDate = formDueDate || undefined;
      }

      if (data.appliedToDebt !== transaction.appliedToDebt) {
        updates.appliedToDebt = data.appliedToDebt;
      }

      // Only update if there are changes
      if (Object.keys(updates).length === 0) {
        Alert.alert("No Changes", "No changes were made to the transaction.");
        return;
      }

      await updateTransaction({ id: transaction.id, updates });

      Alert.alert("Success", "Transaction has been updated successfully!", [
        {
          text: "View Customer",
          onPress: () => {
            router.dismiss();
            router.push(`/customer/${transaction.customerId}`);
          },
        },
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Failed to update transaction:", error);
      Alert.alert("Error", "Failed to update transaction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const formatCurrency = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return "₦0";
    return `₦${numAmount.toLocaleString("en-NG", {
      minimumFractionDigits: 0,
    })}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "sale":
        return "cart.fill";
      case "payment":
        return "creditcard.fill";
      case "refund":
        return "return";
      default:
        return "dollarsign.circle.fill";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "sale":
        return "#34C759";
      case "payment":
        return "#007AFF";
      case "refund":
        return "#FF3B30";
      default:
        return "#8E8E93";
    }
  };

  const styles = createStyles(theme);

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <ThemedText style={styles.cancelText}>Cancel</ThemedText>
            </TouchableOpacity>
            <ThemedText type="title" style={styles.headerTitle}>
              Edit Transaction
            </ThemedText>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <ThemedText>Loading transaction...</ThemedText>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (!transaction || !customer) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <ThemedText style={styles.cancelText}>Cancel</ThemedText>
            </TouchableOpacity>
            <ThemedText type="title" style={styles.headerTitle}>
              Edit Transaction
            </ThemedText>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <ThemedText>Transaction not found</ThemedText>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <ScreenContainer
      withPadding={false}
      edges={[...edgesHorizontal, ...edgesVertical]}
    >
      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.formContent}>
          <View style={styles.iconContainer}>
            <IconSymbol
              name={getTypeIcon(watchedType)}
              size={32}
              color={getTypeColor(watchedType)}
            />
            <ThemedText style={styles.subtitle}>
              Update transaction details
            </ThemedText>
          </View>

          {/* Customer Info (Read-only) */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.fieldLabel}>Customer</ThemedText>
            <View style={styles.customerInfo}>
              <View style={styles.customerAvatar}>
                <ThemedText style={styles.customerAvatarText}>
                  {getCustomerInitials(customer.name)}
                </ThemedText>
              </View>
              <View>
                <ThemedText style={styles.customerName}>
                  {customer.name}
                </ThemedText>
                <ThemedText style={styles.customerPhone}>
                  {customer.phone}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Transaction Type */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.fieldLabel}>
              Transaction Type *
            </ThemedText>
            <Controller
              control={control}
              name="type"
              rules={{ required: "Transaction type is required" }}
              render={({ field: { onChange, value } }) => (
                <View style={styles.typeSelector}>
                  {["sale", "payment", "refund"].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeOption,
                        value === type && styles.typeOptionSelected,
                        { borderColor: getTypeColor(type) },
                        value === type && {
                          backgroundColor: getTypeColor(type) + "20",
                        },
                      ]}
                      onPress={() => onChange(type)}
                    >
                      <IconSymbol
                        name={getTypeIcon(type)}
                        size={20}
                        color={value === type ? getTypeColor(type) : "#8E8E93"}
                      />
                      <ThemedText
                        style={[
                          styles.typeOptionText,
                          value === type && { color: getTypeColor(type) },
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
            <HelperText type="error" visible={!!errors.type}>
              {errors.type?.message}
            </HelperText>
          </View>

          {/* Amount Field */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.fieldLabel}>Amount *</ThemedText>

            {/* Quick Amount Presets */}
            <View style={styles.quickAmountsContainer}>
              <ThemedText style={styles.quickAmountsLabel}>
                Quick amounts:
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.quickAmountsScroll}
              >
                {quickAmountPresets.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.quickAmountButton,
                      watchedAmount === preset.toString() &&
                        styles.quickAmountButtonSelected,
                    ]}
                    onPress={() => handleQuickAmount(preset)}
                  >
                    <ThemedText
                      style={[
                        styles.quickAmountText,
                        watchedAmount === preset.toString() &&
                          styles.quickAmountTextSelected,
                      ]}
                    >
                      ₦{preset.toLocaleString()}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Controller
              control={control}
              name="amount"
              rules={{
                required: "Amount is required",
                validate: validateAmount,
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <TextInput
                    label="Amount *"
                    mode="outlined"
                    value={value}
                    onChangeText={(text) => onChange(formatAmountInput(text))}
                    onBlur={onBlur}
                    error={!!errors.amount}
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="0.00"
                    left={<TextInput.Icon icon="currency-ngn" />}
                  />
                  {value && !errors.amount && (
                    <View style={styles.amountPreviewContainer}>
                      <ThemedText
                        style={[
                          styles.amountPreview,
                          { color: getTypeColor(watchedType) },
                        ]}
                      >
                        {formatCurrency(value)}
                      </ThemedText>
                      <ThemedText style={styles.amountPreviewLabel}>
                        {watchedType === "refund"
                          ? "Refund Amount"
                          : watchedType === "payment"
                          ? "Payment Received"
                          : "Sale Amount"}
                      </ThemedText>
                    </View>
                  )}
                </View>
              )}
            />
            <HelperText type="error" visible={!!errors.amount}>
              {errors.amount?.message}
            </HelperText>
          </View>

          {/* Date Field */}
          <View style={dynamicStyles.fieldContainer}>
            <ThemedText style={dynamicStyles.fieldLabel}>Date *</ThemedText>
            <Controller
              control={control}
              name="date"
              rules={{ required: "Date is required" }}
              render={({ field: { onChange, value } }) => (
                <>
                  <TouchableOpacity
                    onPress={() => setDatePickerVisible(true)}
                    style={dynamicStyles.dateButton}
                    activeOpacity={0.7}
                  >
                    <View pointerEvents="none">
                      <TextInput
                        label="Transaction Date *"
                        mode="outlined"
                        value={value}
                        editable={false}
                        style={dynamicStyles.input}
                        left={<TextInput.Icon icon="calendar" />}
                      />
                    </View>
                  </TouchableOpacity>

                  <View style={dynamicStyles.datePresetContainer}>
                    <TouchableOpacity
                      style={[
                        dynamicStyles.datePresetButton,
                        {
                          backgroundColor: theme.colors.primaryContainer,
                        },
                      ]}
                      onPress={() => {
                        onChange(new Date().toISOString().split("T")[0]);
                      }}
                    >
                      <ThemedText
                        style={[
                          dynamicStyles.datePresetText,
                          {
                            color: theme.colors.onPrimaryContainer,
                          },
                        ]}
                      >
                        Today
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        dynamicStyles.datePresetButton,
                        {
                          backgroundColor: theme.colors.secondaryContainer,
                        },
                      ]}
                      onPress={() => {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        onChange(yesterday.toISOString().split("T")[0]);
                      }}
                    >
                      <ThemedText
                        style={[
                          dynamicStyles.datePresetText,
                          {
                            color: theme.colors.onSecondaryContainer,
                          },
                        ]}
                      >
                        Yesterday
                      </ThemedText>
                    </TouchableOpacity>
                  </View>

                  <DatePickerModal
                    visible={isDatePickerVisible}
                    mode="single"
                    onDismiss={() => setDatePickerVisible(false)}
                    date={value ? new Date(value) : new Date()}
                    onConfirm={({ date }) => {
                      if (date) {
                        onChange(date.toISOString().split("T")[0]);
                      }
                      setDatePickerVisible(false);
                    }}
                    presentationStyle="pageSheet"
                    locale="en"
                  />
                </>
              )}
            />
            <HelperText type="error" visible={!!errors.date}>
              {errors.date?.message}
            </HelperText>
            <HelperText type="info" visible={!errors.date}>
              Format: YYYY-MM-DD (e.g., 2024-12-25)
            </HelperText>
          </View>

          {/* Description Field */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.fieldLabel}>
              Description (Optional)
            </ThemedText>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <TextInput
                    label="Transaction Notes"
                    mode="outlined"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    style={styles.input}
                    multiline
                    numberOfLines={3}
                    placeholder="Add details about this transaction..."
                    left={<TextInput.Icon icon="note-text" />}
                  />
                  <View style={styles.descriptionPresets}>
                    {watchedType === "sale" && (
                      <>
                        <TouchableOpacity
                          style={styles.descriptionPresetButton}
                          onPress={() => onChange("Product sale")}
                        >
                          <ThemedText style={styles.descriptionPresetText}>
                            Product sale
                          </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.descriptionPresetButton}
                          onPress={() => onChange("Service provided")}
                        >
                          <ThemedText style={styles.descriptionPresetText}>
                            Service provided
                          </ThemedText>
                        </TouchableOpacity>
                      </>
                    )}
                    {watchedType === "payment" && (
                      <>
                        <TouchableOpacity
                          style={styles.descriptionPresetButton}
                          onPress={() => onChange("Outstanding payment")}
                        >
                          <ThemedText style={styles.descriptionPresetText}>
                            Outstanding payment
                          </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.descriptionPresetButton}
                          onPress={() => onChange("Partial payment")}
                        >
                          <ThemedText style={styles.descriptionPresetText}>
                            Partial payment
                          </ThemedText>
                        </TouchableOpacity>
                      </>
                    )}
                    {watchedType === "refund" && (
                      <>
                        <TouchableOpacity
                          style={styles.descriptionPresetButton}
                          onPress={() => onChange("Product return")}
                        >
                          <ThemedText style={styles.descriptionPresetText}>
                            Product return
                          </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.descriptionPresetButton}
                          onPress={() => onChange("Service cancellation")}
                        >
                          <ThemedText style={styles.descriptionPresetText}>
                            Service cancellation
                          </ThemedText>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              )}
            />
          </View>

          {/* Payment Method Field */}
          <View style={dynamicStyles.fieldContainer}>
            <ThemedText style={dynamicStyles.fieldLabel}>
              Payment Method *
            </ThemedText>
            <Controller
              control={control}
              name="paymentMethod"
              rules={{
                required: "Payment method is required",
              }}
              render={({ field: { onChange, value } }) => (
                <View style={dynamicStyles.paymentMethodSelector}>
                  {["cash", "bank_transfer", "pos_card", "credit", "mixed"].map(
                    (method) => (
                      <TouchableOpacity
                        key={method}
                        style={[
                          dynamicStyles.paymentMethodOption,
                          value === method &&
                            dynamicStyles.paymentMethodOptionSelected,
                          { borderColor: getTypeColor(method) },
                          value === method && {
                            backgroundColor: getTypeColor(method) + "20",
                          },
                        ]}
                        onPress={() => onChange(method)}
                      >
                        <ThemedText
                          style={[
                            dynamicStyles.paymentMethodOptionText,
                            value === method && { color: getTypeColor(method) },
                          ]}
                        >
                          {method.charAt(0).toUpperCase() + method.slice(1)}
                        </ThemedText>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              )}
            />
            <HelperText type="error" visible={!!errors.paymentMethod}>
              {errors.paymentMethod?.message}
            </HelperText>
          </View>

          {/* Paid Amount Field - only show for credit or mixed payments */}
          {(watchedPaymentMethod === "credit" ||
            watchedPaymentMethod === "mixed") && (
            <View style={dynamicStyles.fieldContainer}>
              <ThemedText style={dynamicStyles.fieldLabel}>
                Paid Amount *
              </ThemedText>
              <Controller
                control={control}
                name="paidAmount"
                rules={{
                  required: "Paid amount is required for credit/mixed payments",
                  validate: (value) => {
                    const paid = parseFloat(value || "0");
                    const total = parseFloat(watchedAmount || "0");
                    if (paid > total) {
                      return "Paid amount cannot exceed total amount";
                    }
                    return true;
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Amount Paid *"
                    mode="outlined"
                    value={value}
                    onChangeText={(text) => {
                      onChange(formatAmountInput(text));
                      // Auto-calculate remaining amount
                      const paid = parseFloat(text || "0");
                      const total = parseFloat(watchedAmount || "0");
                      const remaining = Math.max(0, total - paid);
                      setValue("remainingAmount", remaining.toString());
                    }}
                    onBlur={onBlur}
                    error={!!errors.paidAmount}
                    style={dynamicStyles.input}
                    keyboardType="numeric"
                    placeholder="0.00"
                    left={<TextInput.Icon icon="currency-ngn" />}
                  />
                )}
              />
              <HelperText type="error" visible={!!errors.paidAmount}>
                {errors.paidAmount?.message}
              </HelperText>
            </View>
          )}

          {/* Remaining Amount Field - only show for credit or mixed payments */}
          {(watchedPaymentMethod === "credit" ||
            watchedPaymentMethod === "mixed") && (
            <View style={dynamicStyles.fieldContainer}>
              <ThemedText style={dynamicStyles.fieldLabel}>
                Remaining Amount
              </ThemedText>
              <Controller
                control={control}
                name="remainingAmount"
                render={({ field: { value } }) => (
                  <TextInput
                    label="Outstanding Balance"
                    mode="outlined"
                    value={value}
                    editable={false}
                    style={[
                      dynamicStyles.input,
                      { backgroundColor: theme.colors.surfaceDisabled },
                    ]}
                    left={<TextInput.Icon icon="currency-ngn" />}
                  />
                )}
              />
              {parseFloat(watch("remainingAmount") || "0") > 0 && (
                <ThemedText
                  style={[dynamicStyles.amountPreviewLabel, { marginTop: 8 }]}
                >
                  This amount will be added to the customer&apos;s outstanding
                  balance
                </ThemedText>
              )}
            </View>
          )}

          {/* Due Date Field - only show for credit or mixed payments */}
          {(watchedPaymentMethod === "credit" ||
            watchedPaymentMethod === "mixed") && (
            <View style={dynamicStyles.fieldContainer}>
              <ThemedText style={dynamicStyles.fieldLabel}>Due Date</ThemedText>
              <Controller
                control={control}
                name="dueDate"
                render={({ field: { onChange, value } }) => (
                  <>
                    <TouchableOpacity
                      onPress={() => setDatePickerVisible(true)}
                      style={dynamicStyles.dateButton}
                      activeOpacity={0.7}
                    >
                      <View pointerEvents="none">
                        <TextInput
                          label="Payment Due Date"
                          mode="outlined"
                          value={value ? format(value, "MMM dd, yyyy") : ""}
                          placeholder="Select due date"
                          editable={false}
                          style={dynamicStyles.input}
                          left={<TextInput.Icon icon="calendar" />}
                        />
                      </View>
                    </TouchableOpacity>

                    <View style={dynamicStyles.datePresetContainer}>
                      <TouchableOpacity
                        style={[
                          dynamicStyles.datePresetButton,
                          {
                            backgroundColor: theme.colors.primaryContainer,
                          },
                        ]}
                        onPress={() => {
                          const nextWeek = new Date();
                          nextWeek.setDate(nextWeek.getDate() + 7);
                          onChange(nextWeek);
                        }}
                      >
                        <ThemedText
                          style={[
                            dynamicStyles.datePresetText,
                            {
                              color: theme.colors.onPrimaryContainer,
                            },
                          ]}
                        >
                          1 Week
                        </ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          dynamicStyles.datePresetButton,
                          {
                            backgroundColor: theme.colors.secondaryContainer,
                          },
                        ]}
                        onPress={() => {
                          const nextMonth = new Date();
                          nextMonth.setMonth(nextMonth.getMonth() + 1);
                          onChange(nextMonth);
                        }}
                      >
                        <ThemedText
                          style={[
                            dynamicStyles.datePresetText,
                            {
                              color: theme.colors.onSecondaryContainer,
                            },
                          ]}
                        >
                          1 Month
                        </ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          dynamicStyles.datePresetButton,
                          {
                            backgroundColor: theme.colors.tertiaryContainer,
                          },
                        ]}
                        onPress={() => onChange(null)}
                      >
                        <ThemedText
                          style={[
                            dynamicStyles.datePresetText,
                            {
                              color: theme.colors.onTertiaryContainer,
                            },
                          ]}
                        >
                          No Due Date
                        </ThemedText>
                      </TouchableOpacity>
                    </View>

                    <DatePickerModal
                      visible={isDatePickerVisible}
                      mode="single"
                      onDismiss={() => setDatePickerVisible(false)}
                      date={value || new Date()}
                      onConfirm={({ date }) => {
                        if (date) {
                          onChange(date);
                        }
                        setDatePickerVisible(false);
                      }}
                      presentationStyle="pageSheet"
                      locale="en"
                    />
                  </>
                )}
              />
            </View>
          )}

          <View style={dynamicStyles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: getTypeColor(watchedType) },
                loading && styles.disabledButton,
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ThemedText style={styles.submitButtonText}>
                    Updating...
                  </ThemedText>
                </View>
              ) : (
                <>
                  <IconSymbol name="checkmark" size={20} color="white" />
                  <ThemedText style={styles.submitButtonText}>
                    Update Transaction
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={dynamicStyles.helpText}>
            <ThemedText style={dynamicStyles.helpLabel}>
              Transaction Types & Payment Methods:
            </ThemedText>
            <ThemedText style={dynamicStyles.helpDescription}>
              •{" "}
              <ThemedText
                style={[dynamicStyles.helpType, { color: "#34C759" }]}
              >
                Sale
              </ThemedText>
              : Customer purchase{"\n"}•{" "}
              <ThemedText
                style={[dynamicStyles.helpType, { color: "#007AFF" }]}
              >
                Payment
              </ThemedText>
              : Customer payment received{"\n"}•{" "}
              <ThemedText
                style={[dynamicStyles.helpType, { color: "#FF3B30" }]}
              >
                Refund
              </ThemedText>
              : Money returned to customer{"\n\n"}
              <ThemedText style={dynamicStyles.helpLabel}>
                Payment Methods:
              </ThemedText>
              {"\n"}•{" "}
              <ThemedText style={dynamicStyles.helpType}>Cash</ThemedText>: Full
              payment received{"\n"}•{" "}
              <ThemedText style={dynamicStyles.helpType}>
                Bank Transfer
              </ThemedText>
              : Bank payment{"\n"}•{" "}
              <ThemedText style={dynamicStyles.helpType}>POS Card</ThemedText>:
              Card payment{"\n"}•{" "}
              <ThemedText style={dynamicStyles.helpType}>Credit</ThemedText>:
              Payment on credit (outstanding balance){"\n"}•{" "}
              <ThemedText style={dynamicStyles.helpType}>Mixed</ThemedText>:
              Partial payment with outstanding balance
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
