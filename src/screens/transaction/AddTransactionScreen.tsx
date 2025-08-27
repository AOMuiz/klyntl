import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useCustomers } from "@/hooks/useCustomers";
import { useTransactions } from "@/hooks/useTransactions";
import { CreateTransactionInput } from "@/types/transaction";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  SafeAreaView,
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
  type: "sale" | "payment" | "refund";
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
    },
  });

  const watchedType = watch("type");
  const watchedAmount = watch("amount");

  // Filter customers based on search query
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
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

      const transactionData: CreateTransactionInput = {
        customerId: data.customerId,
        amount: parseFloat(data.amount),
        description: data.description.trim() || undefined,
        date: format(data.date, "yyyy-MM-dd"),
        type: data.type,
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

  const handleCancel = () => {
    router.dismiss();
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
        return Colors[isDark ? "dark" : "light"].success;
      case "payment":
        return Colors[isDark ? "dark" : "light"].secondary;
      case "refund":
        return Colors[isDark ? "dark" : "light"].error;
      default:
        return Colors[isDark ? "dark" : "light"].textTertiary;
    }
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <ThemedView style={dynamicStyles.content}>
        <View style={dynamicStyles.header}>
          <TouchableOpacity
            style={dynamicStyles.cancelButton}
            onPress={handleCancel}
          >
            <ThemedText style={dynamicStyles.cancelText}>Cancel</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title" style={dynamicStyles.headerTitle}>
            Add Transaction
          </ThemedText>
          <View style={dynamicStyles.placeholder} />
        </View>

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
                  <View style={dynamicStyles.typeSelector}>
                    {["sale", "payment", "refund"].map((type) => (
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
                            <ThemedText
                              style={dynamicStyles.customerAvatarText}
                            >
                              {customer.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
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
                          {formatCurrency(value)}
                        </ThemedText>
                        <ThemedText style={dynamicStyles.amountPreviewLabel}>
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
                    >
                      <TextInput
                        label="Transaction Date *"
                        mode="outlined"
                        value={format(value, "MMM dd, yyyy")}
                        editable={false}
                        style={dynamicStyles.input}
                        left={<TextInput.Icon icon="calendar" />}
                      />
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
                      locale="en-GB"
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
                      {watchedType.charAt(0).toUpperCase() +
                        watchedType.slice(1)}
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.helpText}>
              <ThemedText style={dynamicStyles.helpLabel}>
                Transaction Types:
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
                    { color: Colors[isDark ? "dark" : "light"].error },
                  ]}
                >
                  Refund
                </ThemedText>
                : Money returned to customer
              </ThemedText>
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}
