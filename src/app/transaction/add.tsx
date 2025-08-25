import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useCustomers, useTransactions } from "@/services/database/context";
import { CreateTransactionInput } from "@/types/transaction";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { HelperText, TextInput } from "react-native-paper";

interface TransactionFormData {
  customerId: string;
  amount: string;
  description: string;
  date: string;
  type: "sale" | "payment" | "refund";
}

export default function AddTransactionScreen() {
  const router = useRouter();
  const { customerId } = useLocalSearchParams<{ customerId?: string }>();
  const { createTransaction } = useTransactions();
  const { getCustomers } = useCustomers();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

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
      date: new Date().toISOString().split("T")[0],
      type: "sale",
    },
  });

  const watchedType = watch("type");
  const watchedAmount = watch("amount");

  const loadCustomers = useCallback(async () => {
    try {
      const customerList = await getCustomers();
      setCustomers(customerList);
    } catch (error) {
      console.error("Failed to load customers:", error);
    }
  }, [getCustomers]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

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
        date: data.date,
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
              date: new Date().toISOString().split("T")[0],
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
        return "#34C759";
      case "payment":
        return "#007AFF";
      case "refund":
        return "#FF3B30";
      default:
        return "#8E8E93";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <ThemedText style={styles.cancelText}>Cancel</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Add Transaction
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
                Record a new transaction
              </ThemedText>
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
                          color={
                            value === type ? getTypeColor(type) : "#8E8E93"
                          }
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

            {/* Customer Selection */}
            <View style={styles.fieldContainer}>
              <Controller
                control={control}
                name="customerId"
                rules={{ required: "Please select a customer" }}
                render={({ field: { onChange, value } }) => (
                  <View>
                    <ThemedText style={styles.fieldLabel}>
                      Customer *
                    </ThemedText>

                    {/* Search Input */}
                    <TextInput
                      mode="outlined"
                      placeholder="Search customers..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      style={[styles.input, styles.searchInput]}
                      left={<TextInput.Icon icon="magnify" />}
                    />

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.customerSelector}
                    >
                      {filteredCustomers.map((customer) => (
                        <TouchableOpacity
                          key={customer.id}
                          style={[
                            styles.customerOption,
                            value === customer.id &&
                              styles.customerOptionSelected,
                          ]}
                          onPress={() => onChange(customer.id)}
                        >
                          <View
                            style={[
                              styles.customerAvatar,
                              value === customer.id && {
                                backgroundColor: "#007AFF",
                              },
                            ]}
                          >
                            <ThemedText style={styles.customerAvatarText}>
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
                              styles.customerName,
                              value === customer.id &&
                                styles.customerNameSelected,
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
                            const today = new Date()
                              .toISOString()
                              .split("T")[0];
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
                      Adding...
                    </ThemedText>
                  </View>
                ) : (
                  <>
                    <IconSymbol name="plus" size={20} color="white" />
                    <ThemedText style={styles.submitButtonText}>
                      Add{" "}
                      {watchedType.charAt(0).toUpperCase() +
                        watchedType.slice(1)}
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.helpText}>
              <ThemedText style={styles.helpLabel}>
                Transaction Types:
              </ThemedText>
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
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    color: "#007AFF",
    fontSize: 16,
  },
  placeholder: {
    width: 60,
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 16,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 8,
  },
  subtitle: {
    marginTop: 12,
    opacity: 0.7,
    textAlign: "center",
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#8E8E93",
    gap: 6,
  },
  typeOptionSelected: {
    borderWidth: 2,
  },
  typeOptionText: {
    fontWeight: "600",
    fontSize: 14,
  },
  customerSelector: {
    maxHeight: 100,
  },
  customerOption: {
    alignItems: "center",
    marginRight: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
    minWidth: 80,
  },
  customerOptionSelected: {
    borderColor: "#007AFF",
    backgroundColor: "rgba(0, 122, 255, 0.1)",
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  customerAvatarText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  customerName: {
    fontSize: 12,
    textAlign: "center",
    maxWidth: 70,
  },
  input: {
    backgroundColor: "transparent",
  },
  searchInput: {
    marginBottom: 12,
  },
  quickAmountsContainer: {
    marginBottom: 16,
  },
  quickAmountsLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    opacity: 0.8,
  },
  quickAmountsScroll: {
    marginBottom: 8,
  },
  quickAmountButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  quickAmountButtonSelected: {
    backgroundColor: "rgba(0, 122, 255, 0.2)",
    borderColor: "#007AFF",
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.8,
  },
  quickAmountTextSelected: {
    color: "#007AFF",
    opacity: 1,
  },
  customerNameSelected: {
    fontWeight: "700",
    color: "#007AFF",
  },
  amountPreviewContainer: {
    alignItems: "center",
    marginTop: 12,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
  },
  amountPreview: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  amountPreviewLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
    textAlign: "center",
  },
  datePresetContainer: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  datePresetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  datePresetText: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.8,
  },
  descriptionPresets: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 8,
  },
  descriptionPresetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  descriptionPresetText: {
    fontSize: 12,
    fontWeight: "500",
    opacity: 0.8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  helpText: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  helpLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  helpDescription: {
    fontSize: 12,
    opacity: 0.8,
    lineHeight: 18,
  },
  helpType: {
    fontWeight: "600",
  },
});
