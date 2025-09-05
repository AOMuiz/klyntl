import ScreenContainer, {
  edgesHorizontal,
  edgesVertical,
} from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useCustomers } from "@/hooks/useCustomers";
import { useTransactions } from "@/hooks/useTransactions";
import { createDatabaseService } from "@/services/database";
import { useDatabase } from "@/services/database/hooks";
import {
  CreateTransactionInput,
  PaymentMethod,
  TransactionType,
} from "@/types/transaction";
import { formatCurrency } from "@/utils/currency";
import { getCustomerInitials } from "@/utils/helpers";
import { hp } from "@/utils/responsive_dimensions_system";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  ScrollView,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { HelperText, TextInput, useTheme } from "react-native-paper";
import { DatePickerModal } from "react-native-paper-dates";
import { createStyles } from "./AddTransactionScreen.styles";

interface TransactionFormData {
  customerId: string;
  amount: string;
  description: string;
  date: Date;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  paidAmount: string;
  remainingAmount: string;
  dueDate: Date | null;
  appliedToDebt?: boolean;
}

interface AddTransactionScreenProps {
  customerId?: string;
}

export default function AddTransactionScreen({
  customerId,
}: AddTransactionScreenProps) {
  const router = useRouter();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  // Create dynamic styles
  const dynamicStyles = createStyles(theme);
  const isDark = colorScheme === "dark";

  // Use React Query hooks instead of Zustand stores
  const { createTransaction } = useTransactions();
  const { customers } = useCustomers();
  const { db } = useDatabase(); // Get the database instance

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<TransactionFormData>({
    defaultValues: {
      customerId: customerId || "",
      amount: "",
      description: "",
      date: new Date(),
      type: "sale",
      paymentMethod: "cash",
      paidAmount: "",
      remainingAmount: "",
      dueDate: null,
      appliedToDebt: true, // Default to true for payments
    },
  });

  const watchedType = watch("type");
  const watchedAmount = watch("amount");
  const watchedPaymentMethod = watch("paymentMethod");
  const watchedCustomerId = watch("customerId");

  // Ensure appliedToDebt has a default value when transaction type is payment
  useEffect(() => {
    if (watchedType === "payment") {
      const currentValue = watch("appliedToDebt");
      if (currentValue === undefined) {
        setValue("appliedToDebt", true);
      }
    }
  }, [watchedType, setValue, watch]);

  // Descriptions for transaction types and payment methods
  const transactionTypeDescriptions: Record<string, string> = {
    sale: "Sale: The customer is making a purchase.",
    payment: "Payment: The customer is paying for a previous purchase or debt.",
    credit: "Credit: The customer is buying on credit and will pay later.",
    refund: "Refund: Money is being returned to the customer.",
  };

  const paymentMethodDescriptions: Record<string, string> = {
    cash: "Cash: Full payment received in cash.",
    bank_transfer: "Bank Transfer: Payment received via bank transfer.",
    pos_card: "POS Card: Payment received via card (POS).",
    credit:
      "Credit: Payment is deferred, customer owes an outstanding balance.",
    mixed: "Mixed: Partial payment received, with some amount left as credit.",
  };

  // Filter customers based on search query
  const filteredCustomers = useMemo(
    () =>
      (customers ?? []).filter((customer) =>
        (customer.name ?? "")
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase())
      ),
    [customers, searchQuery]
  );

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
    try {
      setLoading(true);

      // Validate appliedToDebt for payment transactions
      if (
        data.type === "payment" &&
        data.appliedToDebt !== true &&
        data.appliedToDebt !== false
      ) {
        Alert.alert("Error", "Please specify how to apply this payment");
        return;
      }

      // Handle credit transactions differently - no payment received
      let paymentMethod: PaymentMethod;
      let paidAmount: number | undefined;
      let remainingAmount: number | undefined;

      if (data.type === "credit") {
        // For credit transactions, no payment is received
        paymentMethod = "credit"; // Set to credit for validation
        paidAmount = 0; // No payment received
        remainingAmount = parseFloat(data.amount); // Full amount becomes debt
      } else {
        // For other transactions, use the selected payment method
        paymentMethod = data.paymentMethod;
        paidAmount = data.paidAmount ? parseFloat(data.paidAmount) : undefined;
        remainingAmount = data.remainingAmount
          ? parseFloat(data.remainingAmount)
          : undefined;
      }

      const transactionData: CreateTransactionInput = {
        customerId: data.customerId,
        amount: parseFloat(data.amount),
        description: data.description.trim() || undefined,
        date: format(data.date, "yyyy-MM-dd"),
        type: data.type,
        paymentMethod: paymentMethod,
        paidAmount: paidAmount,
        remainingAmount: remainingAmount,
        dueDate: data.dueDate ? format(data.dueDate, "yyyy-MM-dd") : undefined,
        appliedToDebt: data.appliedToDebt,
      };

      await createTransaction(transactionData);

      Alert.alert("Success", `Transaction has been added successfully!`, [
        {
          text: "Add Another",
          onPress: () =>
            reset({
              customerId: data.customerId,
              amount: "",
              description: "",
              date: new Date(),
              type: "sale",
              paymentMethod: "cash",
              paidAmount: "",
              remainingAmount: "",
              dueDate: null,
              appliedToDebt: true,
            }),
        },
        {
          text: "View Customer",
          onPress: () => {
            router.dismiss();
            router.push(`/customer/${data.customerId}`);
          },
        },
      ]);
    } catch (error) {
      console.error("Failed to create transaction:", error);
      Alert.alert("Error", "Failed to add transaction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
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

  const getTypeColor = (type: string) => {
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

  // Get current customer debt from backend
  const { data: currentCustomerDebt = 0 } = useQuery({
    queryKey: ["customer-debt", watchedCustomerId],
    queryFn: async () => {
      if (!watchedCustomerId || !db) return 0;

      try {
        const databaseService = createDatabaseService(db);
        return await databaseService.customers.getOutstandingBalance(
          watchedCustomerId
        );
      } catch (error) {
        console.error("Failed to get customer debt:", error);
        return 0;
      }
    },
    enabled: !!watchedCustomerId && !!db,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  // Reset certain fields when transaction type changes
  useEffect(() => {
    if (watchedType === "credit") {
      // For credit transactions, set amount as paidAmount and clear remainingAmount
      setValue("paidAmount", watchedAmount);
      setValue("remainingAmount", "0");
      setValue("appliedToDebt", false); // Don't apply to debt by default
      setValue("paymentMethod", ""); // Clear payment method for credit transactions
    } else if (watchedType === "refund") {
      // For refunds, set amount as negative and clear paidAmount
      setValue("paidAmount", "0");
      setValue("remainingAmount", watchedAmount);
      setValue("appliedToDebt", true); // Apply to debt by default
    } else {
      // For other types, reset to default behavior
      setValue("paidAmount", "");
      setValue("remainingAmount", "");
      setValue("appliedToDebt", true);
    }
  }, [watchedType, watchedAmount, setValue]);

  return (
    <ScreenContainer
      withPadding={false}
      edges={[...edgesHorizontal, ...edgesVertical]}
    >
      <ScrollView
        style={dynamicStyles.form}
        showsVerticalScrollIndicator={false}
      >
        <View style={dynamicStyles.formContent}>
          <View style={dynamicStyles.iconContainer}>
            <IconSymbol
              name={getTypeIcon(watchedType)}
              size={32}
              color={getTypeColor(watchedType)}
            />
            <ThemedText style={dynamicStyles.subtitle}>
              Record a new transaction
            </ThemedText>
          </View>

          {/* Transaction Type */}
          <View style={dynamicStyles.fieldContainer}>
            <ThemedText style={dynamicStyles.fieldLabel}>
              Transaction Type *
            </ThemedText>
            <Controller
              control={control}
              name="type"
              rules={{ required: "Transaction type is required" }}
              render={({ field: { onChange, value } }) => (
                <View>
                  <View style={dynamicStyles.typeSelector}>
                    {["sale", "payment", "credit", "refund"].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          dynamicStyles.typeOption,
                          value === type && dynamicStyles.typeOptionSelected,
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
                          color={
                            value === type ? getTypeColor(type) : "#8E8E93"
                          }
                        />
                        <ThemedText
                          style={[
                            dynamicStyles.typeOptionText,
                            value === type && { color: getTypeColor(type) },
                          ]}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {/* Show meaning below selection */}
                  <ThemedText
                    style={{
                      marginTop: hp(8),
                      color: theme.colors.onSurfaceVariant,
                    }}
                  >
                    {transactionTypeDescriptions[value]}
                  </ThemedText>
                </View>
              )}
            />
            <HelperText type="error" visible={!!errors.type}>
              {errors.type?.message}
            </HelperText>
          </View>

          {/* Customer Selection */}
          <View style={dynamicStyles.fieldContainer}>
            <Controller
              control={control}
              name="customerId"
              rules={{ required: "Please select a customer" }}
              render={({ field: { onChange, value } }) => (
                <View>
                  <ThemedText style={dynamicStyles.fieldLabel}>
                    Customer *
                  </ThemedText>

                  {/* Search Input */}
                  <TextInput
                    mode="outlined"
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={[dynamicStyles.input, dynamicStyles.searchInput]}
                    left={<TextInput.Icon icon="magnify" />}
                  />

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={dynamicStyles.customerSelector}
                  >
                    {filteredCustomers.map((customer) => (
                      <TouchableOpacity
                        key={customer.id}
                        style={[
                          dynamicStyles.customerOption,
                          value === customer.id &&
                            dynamicStyles.customerOptionSelected,
                        ]}
                        onPress={() => onChange(customer.id)}
                      >
                        <View
                          style={[
                            dynamicStyles.customerAvatar,
                            value === customer.id && {
                              backgroundColor: "#007AFF",
                            },
                          ]}
                        >
                          <ThemedText style={dynamicStyles.customerAvatarText}>
                            {getCustomerInitials(customer.name)}
                          </ThemedText>
                        </View>
                        <ThemedText
                          style={[
                            dynamicStyles.customerName,
                            value === customer.id &&
                              dynamicStyles.customerNameSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {customer.name}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            />
            <HelperText type="error" visible={!!errors.customerId}>
              {errors.customerId?.message}
            </HelperText>
          </View>

          {/* Amount Field */}
          <View style={dynamicStyles.fieldContainer}>
            <ThemedText style={dynamicStyles.fieldLabel}>Amount *</ThemedText>

            {/* Quick Amount Presets */}
            <View style={dynamicStyles.quickAmountsContainer}>
              <ThemedText style={dynamicStyles.quickAmountsLabel}>
                Quick amounts:
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={dynamicStyles.quickAmountsScroll}
              >
                {quickAmountPresets.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      dynamicStyles.quickAmountButton,
                      watchedAmount === preset.toString() &&
                        dynamicStyles.quickAmountButtonSelected,
                    ]}
                    onPress={() => handleQuickAmount(preset)}
                  >
                    <ThemedText
                      style={[
                        dynamicStyles.quickAmountText,
                        watchedAmount === preset.toString() &&
                          dynamicStyles.quickAmountTextSelected,
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
                    style={dynamicStyles.input}
                    keyboardType="numeric"
                    placeholder="0.00"
                    left={<TextInput.Icon icon="currency-ngn" />}
                  />
                  {value && !errors.amount && (
                    <View style={dynamicStyles.amountPreviewContainer}>
                      <ThemedText
                        style={[
                          dynamicStyles.amountPreview,
                          { color: getTypeColor(watchedType) },
                        ]}
                      >
                        {formatCurrency(Number(value))}
                      </ThemedText>
                      <ThemedText style={dynamicStyles.amountPreviewLabel}>
                        {watchedType === "refund"
                          ? "Refund Amount"
                          : watchedType === "payment"
                          ? "Payment Received"
                          : watchedType === "credit"
                          ? "Credit Amount"
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
                    style={[
                      dynamicStyles.dateButton,
                      // { paddingVertical: 12, paddingHorizontal: 10 },
                    ]}
                    activeOpacity={0.7} // improves touch feedback
                  >
                    <View pointerEvents="none">
                      <TextInput
                        label="Transaction Date *"
                        mode="outlined"
                        value={format(value, "MMM dd, yyyy")}
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
                        onChange(new Date());
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
                        onChange(yesterday);
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
                    date={value}
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
            <HelperText type="error" visible={!!errors.date}>
              {errors.date?.message}
            </HelperText>
          </View>

          {/* Description Field */}
          <View style={dynamicStyles.fieldContainer}>
            <ThemedText style={dynamicStyles.fieldLabel}>
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
                    style={dynamicStyles.input}
                    multiline
                    numberOfLines={3}
                    placeholder="Add details about this transaction..."
                    left={<TextInput.Icon icon="note-text" />}
                  />
                  <View style={dynamicStyles.descriptionPresets}>
                    {watchedType === "sale" && (
                      <>
                        <TouchableOpacity
                          style={dynamicStyles.descriptionPresetButton}
                          onPress={() => onChange("Product sale")}
                        >
                          <ThemedText
                            style={dynamicStyles.descriptionPresetText}
                          >
                            Product sale
                          </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={dynamicStyles.descriptionPresetButton}
                          onPress={() => onChange("Service provided")}
                        >
                          <ThemedText
                            style={dynamicStyles.descriptionPresetText}
                          >
                            Service provided
                          </ThemedText>
                        </TouchableOpacity>
                      </>
                    )}
                    {watchedType === "payment" && (
                      <>
                        <TouchableOpacity
                          style={dynamicStyles.descriptionPresetButton}
                          onPress={() => onChange("Outstanding payment")}
                        >
                          <ThemedText
                            style={dynamicStyles.descriptionPresetText}
                          >
                            Outstanding payment
                          </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={dynamicStyles.descriptionPresetButton}
                          onPress={() => onChange("Partial payment")}
                        >
                          <ThemedText
                            style={dynamicStyles.descriptionPresetText}
                          >
                            Partial payment
                          </ThemedText>
                        </TouchableOpacity>
                      </>
                    )}
                    {watchedType === "credit" && (
                      <>
                        <TouchableOpacity
                          style={dynamicStyles.descriptionPresetButton}
                          onPress={() => onChange("Credit purchase")}
                        >
                          <ThemedText
                            style={dynamicStyles.descriptionPresetText}
                          >
                            Credit purchase
                          </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={dynamicStyles.descriptionPresetButton}
                          onPress={() => onChange("Installment plan")}
                        >
                          <ThemedText
                            style={dynamicStyles.descriptionPresetText}
                          >
                            Installment plan
                          </ThemedText>
                        </TouchableOpacity>
                      </>
                    )}
                    {watchedType === "refund" && (
                      <>
                        <TouchableOpacity
                          style={dynamicStyles.descriptionPresetButton}
                          onPress={() => onChange("Product return")}
                        >
                          <ThemedText
                            style={dynamicStyles.descriptionPresetText}
                          >
                            Product return
                          </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={dynamicStyles.descriptionPresetButton}
                          onPress={() => onChange("Service cancellation")}
                        >
                          <ThemedText
                            style={dynamicStyles.descriptionPresetText}
                          >
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

          {/* Payment Method Field - Only show for non-credit transactions */}
          {watchedType !== "credit" && (
            <View style={dynamicStyles.fieldContainer}>
              <ThemedText style={dynamicStyles.fieldLabel}>
                Payment Method *
              </ThemedText>
              <Controller
                control={control}
                name="paymentMethod"
                rules={{
                  required: false,
                }}
                render={({ field: { onChange, value } }) => {
                  // Dynamic payment method options based on transaction type
                  const getPaymentMethodOptions = () => {
                    switch (watchedType) {
                      case "payment":
                        // Payment received - no credit/debt option
                        return ["cash", "bank_transfer", "pos_card"];
                      case "refund":
                        // Refunds - only cash and bank transfer
                        return ["cash", "bank_transfer"];
                      default:
                        // Sale - all options
                        return [
                          "cash",
                          "bank_transfer",
                          "pos_card",
                          "credit",
                          "mixed",
                        ];
                    }
                  };

                  const paymentOptions = getPaymentMethodOptions();

                  return (
                    <View>
                      <View style={dynamicStyles.paymentMethodSelector}>
                        {paymentOptions.map((method) => (
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
                                value === method && {
                                  color: getTypeColor(method),
                                },
                              ]}
                            >
                              {method.charAt(0).toUpperCase() + method.slice(1)}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                      </View>
                      {/* Show meaning below selection */}
                      <ThemedText
                        style={{
                          marginTop: hp(8),
                          color: theme.colors.onSurfaceVariant,
                        }}
                      >
                        {paymentMethodDescriptions[value]}
                      </ThemedText>
                    </View>
                  );
                }}
              />
              <HelperText type="error" visible={!!errors.paymentMethod}>
                {errors.paymentMethod?.message}
              </HelperText>
            </View>
          )}

          {/* Apply to Debt Field - only show for payment transactions */}
          {watchedType === "payment" && (
            <View style={dynamicStyles.fieldContainer}>
              <ThemedText style={dynamicStyles.fieldLabel}>
                Apply to Outstanding Debt? *
              </ThemedText>
              <Controller
                control={control}
                name="appliedToDebt"
                rules={{
                  validate: (value) => {
                    if (
                      watchedType === "payment" &&
                      value !== true &&
                      value !== false
                    ) {
                      return "Please specify how to apply this payment";
                    }
                    return true;
                  },
                }}
                render={({ field: { onChange, value } }) => (
                  <View>
                    {/* Show current debt if exists */}
                    {currentCustomerDebt > 0 && (
                      <View style={{ marginBottom: hp(8) }}>
                        <ThemedText
                          style={{ color: theme.colors.onSurfaceVariant }}
                        >
                          Customer&apos;s Current Debt:{" "}
                          {formatCurrency(currentCustomerDebt)}
                        </ThemedText>
                      </View>
                    )}

                    <View style={dynamicStyles.typeSelector}>
                      <TouchableOpacity
                        style={[
                          dynamicStyles.typeOption,
                          value === true && dynamicStyles.typeOptionSelected,
                          {
                            borderColor:
                              Colors[isDark ? "dark" : "light"].success,
                          },
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
                            dynamicStyles.typeOptionText,
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
                          dynamicStyles.typeOption,
                          value === false && dynamicStyles.typeOptionSelected,
                          {
                            borderColor:
                              Colors[isDark ? "dark" : "light"].secondary,
                          },
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
                            dynamicStyles.typeOptionText,
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
                    {value === true && watchedAmount && (
                      <ThemedText
                        style={{
                          marginTop: hp(8),
                          color: Colors[isDark ? "dark" : "light"].success,
                          fontWeight: "600",
                        }}
                      >
                        ₦{parseFloat(watchedAmount).toLocaleString()} will be
                        removed from customer&apos;s debt
                      </ThemedText>
                    )}
                  </View>
                )}
              />
              <HelperText type="error" visible={!!errors.appliedToDebt}>
                {errors.appliedToDebt?.message}
              </HelperText>
            </View>
          )}

          {/* Visual Confirmations for Debt Changes */}
          {watchedAmount &&
            !errors.amount &&
            watchedType === "sale" &&
            watchedPaymentMethod === "credit" && (
              <View style={dynamicStyles.fieldContainer}>
                <View style={dynamicStyles.amountPreviewContainer}>
                  <ThemedText
                    style={{
                      color: Colors[isDark ? "dark" : "light"].warning,
                      fontWeight: "600",
                    }}
                  >
                    ₦{parseFloat(watchedAmount).toLocaleString()} will be added
                    to customer&apos;s debt
                  </ThemedText>
                </View>
              </View>
            )}

          {/* Visual Confirmations for Credit Transactions */}
          {watchedAmount && !errors.amount && watchedType === "credit" && (
            <View style={dynamicStyles.fieldContainer}>
              <View style={dynamicStyles.amountPreviewContainer}>
                <ThemedText
                  style={{
                    color: Colors[isDark ? "dark" : "light"].warning,
                    fontWeight: "600",
                  }}
                >
                  ₦{parseFloat(watchedAmount).toLocaleString()} will be added to
                  customer&apos;s debt
                </ThemedText>
              </View>
            </View>
          )}

          {/* Visual Confirmations for Refunds */}
          {watchedAmount && !errors.amount && watchedType === "refund" && (
            <View style={dynamicStyles.fieldContainer}>
              <View style={dynamicStyles.amountPreviewContainer}>
                <ThemedText
                  style={{
                    color: Colors[isDark ? "dark" : "light"].error,
                    fontWeight: "600",
                  }}
                >
                  ₦{parseFloat(watchedAmount).toLocaleString()} will be removed
                  from customer&apos;s debt
                </ThemedText>
              </View>
            </View>
          )}

          {/* Visual Confirmation for Mixed Payment Remaining Debt */}
          {watchedType === "sale" &&
            watchedPaymentMethod === "mixed" &&
            watchedAmount &&
            parseFloat(watch("remainingAmount") || "0") > 0 && (
              <View style={dynamicStyles.fieldContainer}>
                <View style={dynamicStyles.amountPreviewContainer}>
                  <ThemedText
                    style={{
                      color: Colors[isDark ? "dark" : "light"].warning,
                      fontWeight: "600",
                    }}
                  >
                    Remaining Debt: ₦
                    {parseFloat(
                      watch("remainingAmount") || "0"
                    ).toLocaleString()}
                  </ThemedText>
                </View>
              </View>
            )}

          <View style={dynamicStyles.buttonContainer}>
            <TouchableOpacity
              style={[
                dynamicStyles.submitButton,
                { backgroundColor: getTypeColor(watchedType) },
                loading && dynamicStyles.disabledButton,
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
            >
              {loading ? (
                <View style={dynamicStyles.loadingContainer}>
                  <ThemedText style={dynamicStyles.submitButtonText}>
                    Adding...
                  </ThemedText>
                </View>
              ) : (
                <>
                  <IconSymbol name="plus" size={20} color="white" />
                  <ThemedText style={dynamicStyles.submitButtonText}>
                    Add{" "}
                    {watchedType.charAt(0).toUpperCase() + watchedType.slice(1)}
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
                style={[
                  dynamicStyles.helpType,
                  { color: Colors[isDark ? "dark" : "light"].success },
                ]}
              >
                Sale
              </ThemedText>
              : Customer purchase{"\n"}•{" "}
              <ThemedText
                style={[
                  dynamicStyles.helpType,
                  { color: Colors[isDark ? "dark" : "light"].secondary },
                ]}
              >
                Payment
              </ThemedText>
              : Customer payment received{"\n"}•{" "}
              <ThemedText
                style={[
                  dynamicStyles.helpType,
                  { color: Colors[isDark ? "dark" : "light"].warning },
                ]}
              >
                Credit
              </ThemedText>
              : Loan/credit issued to customer (no payment method required)
              {"\n"}•{" "}
              <ThemedText
                style={[
                  dynamicStyles.helpType,
                  { color: Colors[isDark ? "dark" : "light"].error },
                ]}
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
