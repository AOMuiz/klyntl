import { useAppTheme } from "@/components/ThemeProvider";
import { BorderRadius, Shadows, Spacing } from "@/constants/Layout";
import { useCustomerStore } from "@/stores/customerStore";
import { Customer, UpdateCustomerInput } from "@/types/customer";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  Card,
  HelperText,
  IconButton,
  Surface,
  Text,
  TextInput,
} from "react-native-paper";

interface CustomerFormData {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export default function EditCustomerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getCustomerById, updateCustomer, loading, clearError } =
    useCustomerStore();
  const { colors } = useAppTheme();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomerFormData>({
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  const loadCustomer = useCallback(async () => {
    if (!id) return;

    try {
      setInitialLoading(true);
      clearError(); // Clear any previous errors
      const customerData = await getCustomerById(id);
      setCustomer(customerData);

      if (customerData) {
        reset({
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email || "",
          address: customerData.address || "",
        });
      }
    } catch (error) {
      console.error("Failed to load customer:", error);
      Alert.alert("Error", "Failed to load customer information");
      router.back();
    } finally {
      setInitialLoading(false);
    }
  }, [id, getCustomerById, reset, router, clearError]);

  useFocusEffect(
    useCallback(() => {
      loadCustomer();
    }, [loadCustomer])
  );

  const validatePhone = (phone: string) => {
    // Nigerian phone number validation
    const nigerianPhoneRegex = /^(\+234|0)[789][01]\d{8}$/;
    return (
      nigerianPhoneRegex.test(phone) ||
      "Please enter a valid Nigerian phone number"
    );
  };

  const validateEmail = (email?: string) => {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) || "Please enter a valid email address";
  };

  const onSubmit = async (data: CustomerFormData) => {
    if (!customer) return;

    try {
      clearError(); // Clear any previous errors

      const updateData: UpdateCustomerInput = {
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email?.trim() || undefined,
        address: data.address?.trim() || undefined,
      };

      await updateCustomer(customer.id, updateData);

      Alert.alert(
        "Success",
        "Customer information has been updated successfully!",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error("Failed to update customer:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update customer. Please check if the phone number is already registered.";
      Alert.alert("Error", errorMessage);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Surface style={styles.loadingContainer} elevation={0}>
          <Text variant="bodyLarge" style={{ color: colors.text }}>
            Loading customer information...
          </Text>
        </Surface>
      </SafeAreaView>
    );
  }

  if (!customer) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Surface style={styles.errorContainer} elevation={0}>
          <Text variant="bodyLarge" style={{ color: colors.text }}>
            Customer not found
          </Text>
          <Button
            mode="contained"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            Go Back
          </Button>
        </Surface>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Surface style={styles.content} elevation={0}>
        {/* Modern Header with Back Navigation */}
        <Surface
          style={[styles.header, { backgroundColor: colors.surface }]}
          elevation={1}
        >
          <View style={styles.headerContent}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => router.back()}
              style={styles.backButton}
            />
            <Text
              variant="titleLarge"
              style={[styles.headerTitle, { color: colors.text }]}
            >
              Edit Customer
            </Text>
            <Button
              mode="text"
              compact
              onPress={() => router.back()}
              textColor={colors.primary}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
          </View>
        </Surface>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.formContent}>
            {/* Customer Info Card */}
            <Card
              style={[
                styles.infoCard,
                { backgroundColor: colors.primarySurface },
              ]}
              elevation={0}
            >
              <Card.Content style={styles.infoCardContent}>
                <View style={styles.avatarContainer}>
                  <View
                    style={[styles.avatar, { backgroundColor: colors.primary }]}
                  >
                    <Text
                      variant="headlineMedium"
                      style={{ color: colors.surface }}
                    >
                      {customer.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text
                  variant="bodyLarge"
                  style={[styles.infoText, { color: colors.text }]}
                >
                  Update customer information
                </Text>
              </Card.Content>
            </Card>

            {/* Form Fields */}
            <View style={styles.fieldsContainer}>
              {/* Name Field */}
              <View style={styles.fieldContainer}>
                <Controller
                  control={control}
                  name="name"
                  rules={{
                    required: "Customer name is required",
                    minLength: {
                      value: 2,
                      message: "Name must be at least 2 characters",
                    },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Full Name"
                      mode="outlined"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.name}
                      style={styles.input}
                      autoCapitalize="words"
                      autoCorrect={false}
                      placeholder="Enter customer's full name"
                      left={<TextInput.Icon icon="account" />}
                      contentStyle={styles.inputContent}
                    />
                  )}
                />
                {errors.name && (
                  <HelperText type="error" visible={!!errors.name}>
                    {errors.name?.message}
                  </HelperText>
                )}
              </View>

              {/* Phone Field */}
              <View style={styles.fieldContainer}>
                <Controller
                  control={control}
                  name="phone"
                  rules={{
                    required: "Phone number is required",
                    validate: validatePhone,
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Phone Number"
                      mode="outlined"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.phone}
                      style={styles.input}
                      keyboardType="phone-pad"
                      autoCorrect={false}
                      placeholder="+234 803 123 4567"
                      left={<TextInput.Icon icon="phone" />}
                      contentStyle={styles.inputContent}
                    />
                  )}
                />
                {errors.phone ? (
                  <HelperText type="error" visible={!!errors.phone}>
                    {errors.phone?.message}
                  </HelperText>
                ) : (
                  <HelperText type="info" visible={!errors.phone}>
                    Format: +234XXXXXXXXX or 0XXXXXXXXX
                  </HelperText>
                )}
              </View>

              {/* Email Field */}
              <View style={styles.fieldContainer}>
                <Controller
                  control={control}
                  name="email"
                  rules={{ validate: validateEmail }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Email Address (Optional)"
                      mode="outlined"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.email}
                      style={styles.input}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder="customer@example.com"
                      left={<TextInput.Icon icon="email" />}
                      contentStyle={styles.inputContent}
                    />
                  )}
                />
                {errors.email && (
                  <HelperText type="error" visible={!!errors.email}>
                    {errors.email?.message}
                  </HelperText>
                )}
              </View>

              {/* Address Field */}
              <View style={styles.fieldContainer}>
                <Controller
                  control={control}
                  name="address"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Address (Optional)"
                      mode="outlined"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      style={styles.input}
                      multiline
                      numberOfLines={3}
                      autoCapitalize="words"
                      placeholder="Enter customer's address"
                      left={<TextInput.Icon icon="map-marker" />}
                      contentStyle={styles.inputContent}
                    />
                  )}
                />
              </View>
            </View>

            {/* Submit Button */}
            <View style={styles.submitContainer}>
              <Button
                mode="contained"
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                disabled={loading}
                style={styles.submitButton}
                contentStyle={styles.submitButtonContent}
                icon={loading ? undefined : "account-edit"}
              >
                {loading ? "Updating Customer..." : "Update Customer"}
              </Button>
            </View>

            {/* Help Text */}
            <Card
              style={[
                styles.helpCard,
                { backgroundColor: colors.surfaceVariant },
              ]}
              elevation={0}
            >
              <Card.Content>
                <View style={styles.helpContent}>
                  <Text
                    variant="bodySmall"
                    style={[styles.helpTitle, { color: colors.textSecondary }]}
                  >
                    📝 Required fields
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.helpDescription,
                      { color: colors.textTertiary },
                    ]}
                  >
                    Changes will be saved immediately and reflected across the
                    app.
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </View>
        </ScrollView>
      </Surface>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  backButton: {
    marginTop: Spacing.md,
  },
  // Modern Header Styles
  header: {
    borderBottomWidth: 0,
    paddingVertical: Spacing.sm,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    height: 56,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontWeight: "600",
    marginHorizontal: Spacing.md,
  },
  cancelButton: {
    minWidth: 60,
  },
  // Form Container
  form: {
    flex: 1,
  },
  formContent: {
    padding: Spacing.md,
  },
  // Info Card Styles
  infoCard: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  infoCardContent: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  avatarContainer: {
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.md,
  },
  infoText: {
    textAlign: "center",
    fontWeight: "500",
  },
  // Form Fields
  fieldsContainer: {
    gap: Spacing.md,
  },
  fieldContainer: {
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: "transparent",
  },
  inputContent: {
    paddingHorizontal: Spacing.md,
  },
  // Submit Button
  submitContainer: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  submitButton: {
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  submitButtonContent: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  // Help Card
  helpCard: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  helpContent: {
    gap: Spacing.xs,
  },
  helpTitle: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  helpDescription: {
    lineHeight: 18,
  },
});
