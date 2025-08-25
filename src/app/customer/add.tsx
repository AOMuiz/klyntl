import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useCustomers } from "@/services/database/context";
import { CreateCustomerInput } from "@/types/customer";
import { useRouter } from "expo-router";
import { useState } from "react";
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

interface CustomerFormData {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export default function AddCustomerScreen() {
  const router = useRouter();
  const { createCustomer } = useCustomers();
  const [loading, setLoading] = useState(false);

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
      setLoading(true);

      const customerData: CreateCustomerInput = {
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email?.trim() || undefined,
        address: data.address?.trim() || undefined,
      };

      const newCustomer = await createCustomer(customerData);

      Alert.alert(
        "Success",
        `Customer ${newCustomer.name} has been added successfully!`,
        [
          {
            text: "Add Another",
            onPress: () => reset(),
          },
          {
            text: "View Customer",
            onPress: () => {
              router.dismiss();
              router.push(`/customer/${newCustomer.id}`);
            },
          },
        ]
      );
    } catch (error) {
      console.error("Failed to create customer:", error);
      Alert.alert(
        "Error",
        "Failed to add customer. Please check if the phone number is already registered."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.dismiss();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <ThemedText style={styles.cancelText}>Cancel</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title">Add Customer</ThemedText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.formContent}>
            <View style={styles.iconContainer}>
              <IconSymbol name="person.badge.plus" size={48} color="#007AFF" />
              <ThemedText style={styles.subtitle}>
                Add a new customer to your database
              </ThemedText>
            </View>

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
                    label="Full Name *"
                    mode="outlined"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.name}
                    style={styles.input}
                    autoCapitalize="words"
                    autoCorrect={false}
                    placeholder="Enter customer's full name"
                  />
                )}
              />
              <HelperText type="error" visible={!!errors.name}>
                {errors.name?.message}
              </HelperText>
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
                    label="Phone Number *"
                    mode="outlined"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.phone}
                    style={styles.input}
                    keyboardType="phone-pad"
                    autoCorrect={false}
                    placeholder="+234 803 123 4567"
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
            <View style={styles.fieldContainer}>
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
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="customer@example.com"
                  />
                )}
              />
              <HelperText type="error" visible={!!errors.email}>
                {errors.email?.message}
              </HelperText>
            </View>

            {/* Address Field */}
            <View style={styles.fieldContainer}>
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
                    style={styles.input}
                    multiline
                    numberOfLines={3}
                    autoCapitalize="words"
                    placeholder="Enter customer's address"
                  />
                )}
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.disabledButton]}
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
              >
                {loading ? (
                  <ThemedText style={styles.submitButtonText}>
                    Adding...
                  </ThemedText>
                ) : (
                  <>
                    <IconSymbol name="plus" size={20} color="white" />
                    <ThemedText style={styles.submitButtonText}>
                      Add Customer
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.helpText}>
              <ThemedText style={styles.helpLabel}>
                Required fields are marked with *
              </ThemedText>
              <ThemedText style={styles.helpDescription}>
                Customer information will be stored securely and can be updated
                later.
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
    marginBottom: 32,
    paddingVertical: 16,
  },
  subtitle: {
    marginTop: 12,
    opacity: 0.7,
    textAlign: "center",
  },
  fieldContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: "transparent",
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
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
    opacity: 0.8,
    marginBottom: 8,
  },
  helpDescription: {
    fontSize: 12,
    opacity: 0.6,
    lineHeight: 16,
  },
});
