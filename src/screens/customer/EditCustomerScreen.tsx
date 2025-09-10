import { ExtendedKlyntlTheme, useKlyntlColors } from "@/constants/KlyntlTheme";
import { useCustomer, useCustomers } from "@/hooks/useCustomers";
import { UpdateCustomerInput } from "@/types/customer";
import { validateEmail, validatePhoneNumber } from "@/utils/contactValidation";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, SafeAreaView, ScrollView, View } from "react-native";
import {
  Button,
  Card,
  HelperText,
  Surface,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { styles } from "./EditCustomerScreen.styles";

interface CustomerFormData {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

interface EditCustomerScreenProps {
  customerId: string;
}

export default function EditCustomerScreen({
  customerId,
}: EditCustomerScreenProps) {
  const router = useRouter();
  const theme = useTheme<ExtendedKlyntlTheme>();
  const colors = useKlyntlColors(theme);

  // Use React Query hooks instead of Zustand store
  const { updateCustomer, isUpdating } = useCustomers();
  const { data: customer, isLoading: customerLoading } =
    useCustomer(customerId);

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

  // Load customer data when it becomes available
  useEffect(() => {
    if (customer && !customerLoading) {
      reset({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || "",
        address: customer.address || "",
      });
      setInitialLoading(false);
    }
  }, [customer, customerLoading, reset]);

  // Handle customer not found
  useEffect(() => {
    if (!customerLoading && !customer && customerId) {
      Alert.alert("Error", "Customer not found", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  }, [customer, customerLoading, customerId, router]);

  const validatePhone = (phone: string) => {
    const validation = validatePhoneNumber(phone, "NG");
    return validation.isValid || validation.error || "Invalid phone number";
  };

  const validateEmailField = (email?: string) => {
    const validation = validateEmail(email);
    return validation.isValid || validation.error || "Invalid email address";
  };

  const onSubmit = async (data: CustomerFormData) => {
    if (!customer) return;

    try {
      const updateData: UpdateCustomerInput = {
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email?.trim() || undefined,
        address: data.address?.trim() || undefined,
      };

      await updateCustomer({
        id: customer.id,
        updates: updateData,
      });

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

  if (initialLoading || customerLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.paper.background }]}
      >
        <Surface style={styles.loadingContainer} elevation={0}>
          <Text
            variant="bodyLarge"
            style={{ color: colors.paper.onBackground }}
          >
            Loading customer information...
          </Text>
        </Surface>
      </SafeAreaView>
    );
  }

  if (!customer) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.paper.background }]}
      >
        <Surface style={styles.errorContainer} elevation={0}>
          <Text
            variant="bodyLarge"
            style={{ color: colors.paper.onBackground }}
          >
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
      style={[styles.container, { backgroundColor: colors.paper.background }]}
    >
      <Surface style={styles.content} elevation={0}>
        {/* Modern Header with Back Navigation
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
        </Surface> */}
        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.formContent}>
            {/* Customer Info Card */}
            <Card
              style={[
                styles.infoCard,
                {
                  backgroundColor: colors.primary[50],
                  borderWidth: 1,
                  borderColor: colors.primary[100],
                },
              ]}
              elevation={2}
              mode="elevated"
            >
              <Card.Content style={styles.infoCardContent}>
                <View style={styles.avatarContainer}>
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: colors.primary[600],
                        shadowColor: colors.primary[600],
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                      },
                    ]}
                  >
                    <Text
                      variant="headlineMedium"
                      style={{ color: colors.paper.onPrimary }}
                    >
                      {customer.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text
                  variant="bodyLarge"
                  style={[
                    styles.infoText,
                    { color: colors.paper.onBackground },
                  ]}
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
                  rules={{ validate: validateEmailField }}
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
                loading={isUpdating}
                disabled={isUpdating}
                style={styles.submitButton}
                contentStyle={styles.submitButtonContent}
                icon={isUpdating ? undefined : "account-edit"}
              >
                {isUpdating ? "Updating Customer..." : "Update Customer"}
              </Button>
            </View>

            {/* Help Text */}
            <Card
              style={[
                styles.helpCard,
                {
                  backgroundColor: colors.neutral[50],
                  borderWidth: 2,
                  borderColor: colors.primary[100],
                  borderStyle: "dashed",
                },
              ]}
              elevation={0}
            >
              <Card.Content>
                <View style={styles.helpContent}>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.helpTitle,
                      { color: colors.paper.onSurfaceVariant },
                    ]}
                  >
                    📝 Required fields
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.helpDescription,
                      { color: colors.neutral[500] },
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
