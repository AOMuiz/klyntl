import { ContactImportButton } from "@/components/ContactImportButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useCustomerStore } from "@/stores/customerStore";
import { CreateCustomerInput } from "@/types/customer";
import { useRouter } from "expo-router";
import { useEffect } from "react";
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
import { createStyles } from "./AddCustomerScreen.styles";

interface CustomerFormData {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  company?: string;
  jobTitle?: string;
  preferredContactMethod?: "phone" | "email" | "sms";
  notes?: string;
  nickname?: string;
}

export default function AddCustomerScreen() {
  const router = useRouter();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  // Create dynamic styles
  const dynamicStyles = createStyles(theme);
  const { addCustomer, loading, clearError } = useCustomerStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CustomerFormData>({
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      company: "",
      jobTitle: "",
      preferredContactMethod: undefined,
      notes: "",
      nickname: "",
    },
  });

  const watchedName = watch("name");
  const watchedPhone = watch("phone");
  const watchedCompany = watch("company");

  // Clear any existing errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

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
    try {
      clearError(); // Clear any previous errors

      const customerData: CreateCustomerInput = {
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email?.trim() || undefined,
        address: data.address?.trim() || undefined,
        company: data.company?.trim() || undefined,
        jobTitle: data.jobTitle?.trim() || undefined,
        preferredContactMethod: data.preferredContactMethod || undefined,
        notes: data.notes?.trim() || undefined,
        nickname: data.nickname?.trim() || undefined,
        contactSource: "manual",
      };

      await addCustomer(customerData);

      // Success - customer was added
      Alert.alert(
        "Success",
        `Customer ${customerData.name} has been added successfully!`,
        [
          {
            text: "Add Another",
            onPress: () => {
              reset();
              clearError();
            },
          },
          {
            text: "View Customers",
            onPress: () => {
              router.dismiss();
            },
          },
        ]
      );
    } catch (error) {
      // Error handling is managed by the store
      // Display the error from the store or a fallback message
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to add customer. Please check if the phone number is already registered.";

      Alert.alert("Error", errorMessage);
    }
  };

  const handleCancel = () => {
    router.dismiss();
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
            Add Customer
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
                name="person.badge.plus"
                size={32}
                color={theme.colors.primary}
              />
              <ThemedText style={dynamicStyles.subtitle}>
                Add a new customer to your database
              </ThemedText>
            </View>

            {/* Name Field */}
            <View style={dynamicStyles.fieldContainer}>
              <ThemedText style={dynamicStyles.fieldLabel}>
                Full Name *
              </ThemedText>
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
                    label="Full Name *"
                    mode="outlined"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.name}
                    style={dynamicStyles.input}
                    autoCapitalize="words"
                    autoCorrect={false}
                    placeholder="Enter customer's full name"
                    left={<TextInput.Icon icon="account" />}
                  />
                )}
              />
              <HelperText type="error" visible={!!errors.name}>
                {errors.name?.message}
              </HelperText>
            </View>

            {/* Phone Field */}
            <View style={dynamicStyles.fieldContainer}>
              <ThemedText style={dynamicStyles.fieldLabel}>
                Phone Number *
              </ThemedText>

              {/* Phone Presets */}
              <View style={dynamicStyles.phonePresetsContainer}>
                <ThemedText style={dynamicStyles.phonePresetsLabel}>
                  Quick start:
                </ThemedText>
                <View style={dynamicStyles.phonePresets}>
                  <TouchableOpacity
                    style={dynamicStyles.phonePresetButton}
                    onPress={() => setValue("phone", "+234")}
                  >
                    <ThemedText style={dynamicStyles.phonePresetText}>
                      +234
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={dynamicStyles.phonePresetButton}
                    onPress={() => setValue("phone", "0")}
                  >
                    <ThemedText style={dynamicStyles.phonePresetText}>
                      0
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

              <Controller
                control={control}
                name="phone"
                rules={{
                  required: "Phone number is required",
                  validate: validatePhone,
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Phone Number *"
                    mode="outlined"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.phone}
                    style={dynamicStyles.input}
                    keyboardType="phone-pad"
                    autoCorrect={false}
                    placeholder="+234 803 123 4567"
                    left={<TextInput.Icon icon="phone" />}
                  />
                )}
              />
              <HelperText type="error" visible={!!errors.phone}>
                {errors.phone?.message}
              </HelperText>
              <HelperText type="info" visible={!errors.phone}>
                Format: +234XXXXXXXXX or 0XXXXXXXXX
              </HelperText>
            </View>

            {/* Email Field */}
            <View style={dynamicStyles.fieldContainer}>
              <ThemedText style={dynamicStyles.fieldLabel}>
                Email Address
              </ThemedText>
              <Controller
                control={control}
                name="email"
                rules={{ validate: validateEmail }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Email Address"
                    mode="outlined"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.email}
                    style={dynamicStyles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="customer@example.com"
                    left={<TextInput.Icon icon="email" />}
                  />
                )}
              />
              <HelperText type="error" visible={!!errors.email}>
                {errors.email?.message}
              </HelperText>
            </View>

            {/* Address Field */}
            <View style={dynamicStyles.fieldContainer}>
              <ThemedText style={dynamicStyles.fieldLabel}>Address</ThemedText>
              <Controller
                control={control}
                name="address"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Address"
                    mode="outlined"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    style={dynamicStyles.input}
                    multiline
                    numberOfLines={3}
                    autoCapitalize="words"
                    placeholder="Enter customer's address"
                    left={<TextInput.Icon icon="map-marker" />}
                  />
                )}
              />
            </View>

            {/* Customer Preview */}
            {watchedName && watchedPhone && (
              <View style={dynamicStyles.customerPreviewContainer}>
                <View style={dynamicStyles.customerPreviewAvatar}>
                  <ThemedText style={dynamicStyles.customerPreviewAvatarText}>
                    {watchedName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </ThemedText>
                </View>
                <ThemedText style={dynamicStyles.customerPreviewName}>
                  {watchedName}
                </ThemedText>
                <ThemedText style={dynamicStyles.customerPreviewPhone}>
                  {watchedPhone}
                </ThemedText>
                {watchedCompany && (
                  <ThemedText style={dynamicStyles.customerPreviewCompany}>
                    {watchedCompany}
                  </ThemedText>
                )}
              </View>
            )}

            {/* Business Information */}
            <View style={dynamicStyles.businessFieldsContainer}>
              <View style={dynamicStyles.businessFieldsHeader}>
                <IconSymbol
                  name="building.2"
                  size={20}
                  color={theme.colors.primary}
                />
                <ThemedText style={dynamicStyles.businessFieldsTitle}>
                  Business Information
                </ThemedText>
              </View>
              <ThemedText style={dynamicStyles.businessFieldsSubtitle}>
                Optional - Fill out if this is a business customer
              </ThemedText>

              {/* Company Field */}
              <View style={dynamicStyles.fieldContainer}>
                <Controller
                  control={control}
                  name="company"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Company Name"
                      mode="outlined"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      style={dynamicStyles.input}
                      autoCapitalize="words"
                      placeholder="Enter company name (optional)"
                      left={<TextInput.Icon icon="office-building" />}
                    />
                  )}
                />
              </View>

              {/* Job Title Field */}
              <View style={dynamicStyles.fieldContainer}>
                <Controller
                  control={control}
                  name="jobTitle"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Job Title"
                      mode="outlined"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      style={dynamicStyles.input}
                      autoCapitalize="words"
                      placeholder="Enter job title (optional)"
                      left={<TextInput.Icon icon="badge-account" />}
                    />
                  )}
                />
              </View>
            </View>

            {/* Nickname Field */}
            <View style={dynamicStyles.fieldContainer}>
              <ThemedText style={dynamicStyles.fieldLabel}>Nickname</ThemedText>
              <Controller
                control={control}
                name="nickname"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View>
                    <TextInput
                      label="Nickname"
                      mode="outlined"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      style={dynamicStyles.input}
                      autoCapitalize="words"
                      placeholder="How do you prefer to call them?"
                      left={<TextInput.Icon icon="heart" />}
                    />
                    {watchedName && !value && (
                      <View style={dynamicStyles.nicknameSuggestions}>
                        {watchedName.split(" ").map((name, index) => (
                          <TouchableOpacity
                            key={index}
                            style={dynamicStyles.nicknameSuggestionButton}
                            onPress={() => onChange(name)}
                          >
                            <ThemedText
                              style={dynamicStyles.nicknameSuggestionText}
                            >
                              {name}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              />
            </View>

            {/* Preferred Contact Method */}
            <View style={dynamicStyles.fieldContainer}>
              <ThemedText style={dynamicStyles.fieldLabel}>
                Preferred Contact Method
              </ThemedText>
              <Controller
                control={control}
                name="preferredContactMethod"
                render={({ field: { onChange, value } }) => (
                  <View style={dynamicStyles.contactMethodContainer}>
                    <TouchableOpacity
                      style={[
                        dynamicStyles.contactMethodButton,
                        value === "phone" &&
                          dynamicStyles.contactMethodButtonActive,
                      ]}
                      onPress={() => onChange("phone")}
                    >
                      <IconSymbol
                        name="phone"
                        size={16}
                        color={
                          value === "phone"
                            ? theme.colors.primary
                            : theme.colors.onSurface
                        }
                      />
                      <ThemedText
                        style={[
                          dynamicStyles.contactMethodText,
                          value === "phone" &&
                            dynamicStyles.contactMethodTextActive,
                        ]}
                      >
                        Phone
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        dynamicStyles.contactMethodButton,
                        value === "email" &&
                          dynamicStyles.contactMethodButtonActive,
                      ]}
                      onPress={() => onChange("email")}
                    >
                      <IconSymbol
                        name="envelope"
                        size={16}
                        color={
                          value === "email"
                            ? theme.colors.primary
                            : theme.colors.onSurface
                        }
                      />
                      <ThemedText
                        style={[
                          dynamicStyles.contactMethodText,
                          value === "email" &&
                            dynamicStyles.contactMethodTextActive,
                        ]}
                      >
                        Email
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        dynamicStyles.contactMethodButton,
                        value === "sms" &&
                          dynamicStyles.contactMethodButtonActive,
                      ]}
                      onPress={() => onChange("sms")}
                    >
                      <IconSymbol
                        name="message"
                        size={16}
                        color={
                          value === "sms"
                            ? theme.colors.primary
                            : theme.colors.onSurface
                        }
                      />
                      <ThemedText
                        style={[
                          dynamicStyles.contactMethodText,
                          value === "sms" &&
                            dynamicStyles.contactMethodTextActive,
                        ]}
                      >
                        SMS
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              />
              <HelperText type="info" visible={true}>
                How do you prefer to contact this customer?
              </HelperText>
            </View>

            {/* Notes Field */}
            <View style={dynamicStyles.fieldContainer}>
              <ThemedText style={dynamicStyles.fieldLabel}>Notes</ThemedText>
              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Notes"
                    mode="outlined"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    style={dynamicStyles.input}
                    multiline
                    numberOfLines={3}
                    autoCapitalize="sentences"
                    placeholder="Any additional notes about this customer..."
                    left={<TextInput.Icon icon="note-text" />}
                  />
                )}
              />
            </View>

            <View style={dynamicStyles.buttonContainer}>
              <TouchableOpacity
                style={[
                  dynamicStyles.submitButton,
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
                      Add Customer
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.helpText}>
              <ThemedText style={dynamicStyles.helpLabel}>
                Required fields are marked with *
              </ThemedText>
              <ThemedText style={dynamicStyles.helpDescription}>
                Customer information will be stored securely and can be updated
                later.
              </ThemedText>

              <View style={dynamicStyles.divider} />

              <View style={dynamicStyles.importSection}>
                <ThemedText style={dynamicStyles.importLabel}>
                  Need to add multiple customers?
                </ThemedText>
                <ContactImportButton
                  variant="text"
                  onImportComplete={async (result) => {
                    const message =
                      result.imported > 0
                        ? `Successfully imported ${result.imported} contacts. ${result.skipped} contacts were skipped.`
                        : "No new contacts were imported. They may already exist or have invalid phone numbers.";

                    Alert.alert("Import Complete", message, [
                      {
                        text: "OK",
                        onPress: () => router.dismiss(),
                      },
                    ]);
                  }}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}
