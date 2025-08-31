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
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { HelperText, TextInput } from "react-native-paper";
import { styles } from "./EditTransactionScreen.styles";

interface TransactionFormData {
  amount: string;
  description: string;
  date: string;
  type: "sale" | "payment" | "refund";
}

interface EditTransactionScreenProps {
  transactionId: string;
}

export default function EditTransactionScreen({
  transactionId,
}: EditTransactionScreenProps) {
  const router = useRouter();

  // Use React Query hooks
  const transactionQuery = useTransaction(transactionId);
  const { updateTransaction } = useTransactions();
  const { customers } = useCustomers();

  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<any>(null);

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
    },
  });

  const watchedType = watch("type");
  const watchedAmount = watch("amount");

  // Load transaction data and set form values when transaction data is available
  useEffect(() => {
    if (transaction) {
      // Find customer details
      const foundCustomer = customers.find(
        (c: any) => c.id === transaction.customerId
      );
      setCustomer(foundCustomer);

      // Set form values
      reset({
        amount: transaction.amount.toString(),
        description: transaction.description || "",
        date: transaction.date,
        type: transaction.type,
      });
    }
  }, [transaction, customers, reset]);

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
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <ThemedText style={styles.cancelText}>Cancel</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>
          Edit Transaction
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

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
                  {customer.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
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
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.fieldLabel}>Date *</ThemedText>
            <Controller
              control={control}
              name="date"
              rules={{ required: "Date is required" }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <TextInput
                    label="Transaction Date *"
                    mode="outlined"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.date}
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    left={<TextInput.Icon icon="calendar" />}
                    right={
                      <TextInput.Icon
                        icon="calendar-today"
                        onPress={() => {
                          const today = new Date().toISOString().split("T")[0];
                          onChange(today);
                        }}
                      />
                    }
                  />
                  <View style={styles.datePresetContainer}>
                    <TouchableOpacity
                      style={styles.datePresetButton}
                      onPress={() => {
                        const today = new Date().toISOString().split("T")[0];
                        onChange(today);
                      }}
                    >
                      <ThemedText style={styles.datePresetText}>
                        Today
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.datePresetButton}
                      onPress={() => {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        onChange(yesterday.toISOString().split("T")[0]);
                      }}
                    >
                      <ThemedText style={styles.datePresetText}>
                        Yesterday
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
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

          <View style={styles.buttonContainer}>
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

          <View style={styles.helpText}>
            <ThemedText style={styles.helpLabel}>Transaction Types:</ThemedText>
            <ThemedText style={styles.helpDescription}>
              •{" "}
              <ThemedText style={[styles.helpType, { color: "#34C759" }]}>
                Sale
              </ThemedText>
              : Customer purchase{"\n"}•{" "}
              <ThemedText style={[styles.helpType, { color: "#007AFF" }]}>
                Payment
              </ThemedText>
              : Customer payment received{"\n"}•{" "}
              <ThemedText style={[styles.helpType, { color: "#FF3B30" }]}>
                Refund
              </ThemedText>
              : Money returned to customer
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
