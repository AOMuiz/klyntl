import ScreenContainer from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import { ExtendedKlyntlTheme, useKlyntlColors } from "@/constants/KlyntlTheme";
import { useAuth } from "@/stores/authStore";
import useOnboardingStore from "@/stores/onboardingStore";
import { fontSize, hp, wp } from "@/utils/responsive_dimensions_system";
import {
  validateBusinessName,
  validateEmail,
  validateFullName,
  validateNigerianPhone,
} from "@/utils/validations";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { Button, TextInput, useTheme } from "react-native-paper";

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme<ExtendedKlyntlTheme>();
  const colors = useKlyntlColors(theme);
  const setHasSeenOnboarding = useOnboardingStore(
    (s) => s.setHasSeenOnboarding
  );

  const {
    register: registerUser,
    isLoading,
    error,
    clearError,
    isAuthenticated,
  } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
      phone: "",
      name: "",
      businessName: "",
    },
  });

  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setHasSeenOnboarding(true);
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, setHasSeenOnboarding, router]);

  // Clear error when form changes
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  const onSubmit = async (data: {
    email: string;
    password: string;
    phone: string;
    name: string;
    businessName: string;
  }) => {
    if (!data.email.trim() || !data.password.trim()) {
      Alert.alert("Error", "Please fill in email and password");
      return;
    }

    // Validate email format
    if (!validateEmail(data.email)) {
      setError("email", {
        type: "manual",
        message: "Please enter a valid email address",
      });
      return;
    }

    // Validate phone if provided
    if (data.phone && !validateNigerianPhone(data.phone)) {
      setError("phone", {
        type: "manual",
        message: "Please enter a valid Nigerian phone number",
      });
      return;
    }

    // Validate business name if provided
    if (data.businessName && !validateBusinessName(data.businessName)) {
      setError("businessName", {
        type: "manual",
        message: "Business name must be at least 2 characters",
      });
      return;
    }

    // Validate full name if provided
    if (data.name && !validateFullName(data.name)) {
      setError("name", {
        type: "manual",
        message: "Please enter both first and last name",
      });
      return;
    }

    try {
      await registerUser(
        data.email,
        data.password,
        data.phone || undefined,
        data.name || undefined,
        data.businessName || undefined
      );
      setHasSeenOnboarding(true);
      router.replace("/(tabs)");
    } catch (error) {
      // Error is already handled in the store
      Alert.alert(
        "Registration Failed",
        error instanceof Error ? error.message : "An error occurred"
      );
    }
  };

  return (
    <ScreenContainer
      scrollable={true}
      withPadding={true}
      keyboardShouldAvoidView
    >
      <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
        <ThemedText type="title" style={styles.title}>
          Create Account
        </ThemedText>
        <ThemedText
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Sign up to get started.
        </ThemedText>

        <View style={styles.form}>
          <ThemedText style={styles.label}>Full Name (Optional)</ThemedText>
          <Controller
            control={control}
            rules={{
              validate: (value) =>
                !value ||
                validateFullName(value) ||
                "Please enter both first and last name",
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                mode="outlined"
                placeholder="Your full name"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                left={<TextInput.Icon icon="account" />}
                style={[
                  styles.input,
                  { backgroundColor: theme.colors.surface },
                ]}
                outlineColor={theme.colors.outline}
                activeOutlineColor={colors.primary[700]}
                error={!!errors.name}
              />
            )}
            name="name"
          />
          {errors.name && (
            <ThemedText style={[styles.error, { color: theme.colors.error }]}>
              {errors.name.message}
            </ThemedText>
          )}

          <ThemedText style={styles.label}>Email Address</ThemedText>
          <Controller
            control={control}
            rules={{
              required: "Email is required",
              validate: (value) =>
                validateEmail(value) || "Please enter a valid email address",
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                mode="outlined"
                placeholder="you@example.com"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                left={<TextInput.Icon icon="email-outline" />}
                style={[
                  styles.input,
                  { backgroundColor: theme.colors.surface },
                ]}
                outlineColor={theme.colors.outline}
                activeOutlineColor={colors.primary[700]}
                error={!!errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
            name="email"
          />
          {errors.email && (
            <ThemedText style={[styles.error, { color: theme.colors.error }]}>
              {errors.email.message}
            </ThemedText>
          )}

          <ThemedText style={styles.label}>Password</ThemedText>
          <Controller
            control={control}
            rules={{
              required: "Password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters",
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                mode="outlined"
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye" : "eye-off"}
                    onPress={() => setShowPassword((s) => !s)}
                  />
                }
                style={[
                  styles.input,
                  { backgroundColor: theme.colors.surface },
                ]}
                outlineColor={theme.colors.outline}
                activeOutlineColor={colors.primary[700]}
                error={!!errors.password}
              />
            )}
            name="password"
          />
          {errors.password && (
            <ThemedText style={[styles.error, { color: theme.colors.error }]}>
              {errors.password.message}
            </ThemedText>
          )}

          <ThemedText style={styles.label}>Phone Number (Optional)</ThemedText>
          <Controller
            control={control}
            rules={{
              validate: (value) =>
                !value ||
                validateNigerianPhone(value) ||
                "Please enter a valid Nigerian phone number",
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                mode="outlined"
                placeholder="+234 801 234 5678"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                left={<TextInput.Icon icon="phone" />}
                style={[
                  styles.input,
                  { backgroundColor: theme.colors.surface },
                ]}
                outlineColor={theme.colors.outline}
                activeOutlineColor={colors.primary[700]}
                error={!!errors.phone}
                keyboardType="phone-pad"
              />
            )}
            name="phone"
          />
          {errors.phone && (
            <ThemedText style={[styles.error, { color: theme.colors.error }]}>
              {errors.phone.message}
            </ThemedText>
          )}

          <ThemedText style={styles.label}>Business Name (Optional)</ThemedText>
          <Controller
            control={control}
            rules={{
              validate: (value) =>
                !value ||
                validateBusinessName(value) ||
                "Business name must be at least 2 characters",
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                mode="outlined"
                placeholder="Your business name"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                left={<TextInput.Icon icon="business" />}
                style={[
                  styles.input,
                  { backgroundColor: theme.colors.surface },
                ]}
                outlineColor={theme.colors.outline}
                activeOutlineColor={colors.primary[700]}
                error={!!errors.businessName}
              />
            )}
            name="businessName"
          />
          {errors.businessName && (
            <ThemedText style={[styles.error, { color: theme.colors.error }]}>
              {errors.businessName.message}
            </ThemedText>
          )}

          {error && (
            <ThemedText style={[styles.error, { color: theme.colors.error }]}>
              {error}
            </ThemedText>
          )}

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            disabled={isLoading}
            contentStyle={styles.primaryContent}
            labelStyle={styles.primaryLabel}
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary[700] },
            ]}
          >
            {isLoading ? "Creating Account..." : "Sign Up"}
          </Button>

          <TouchableOpacity
            style={styles.bottomLink}
            onPress={() => router.push("/auth/login")}
          >
            <ThemedText style={{ color: theme.colors.onSurfaceVariant }}>
              Already have an account?{" "}
            </ThemedText>
            <ThemedText
              style={{ color: colors.primary[700], fontWeight: "700" }}
            >
              Log In
            </ThemedText>
          </TouchableOpacity>

          <ThemedText
            style={[styles.terms, { color: theme.colors.onSurfaceVariant }]}
          >
            By continuing, you agree to our{" "}
            <ThemedText
              style={[styles.link, { color: colors.primary[700] }]}
              onPress={() => router.push("/legal/terms")}
            >
              Terms of Service
            </ThemedText>{" "}
            and{" "}
            <ThemedText
              style={[styles.link, { color: colors.primary[700] }]}
              onPress={() => router.push("/legal/privacy")}
            >
              Privacy Policy
            </ThemedText>
            .
          </ThemedText>

          {__DEV__ && (
            <View>
              <TouchableOpacity
                style={styles.devButton}
                onPress={() => {
                  setValue("name", "John Doe");
                  setValue("email", "test@example.com");
                  setValue("phone", "+2348012345678");
                  setValue("businessName", "Test Business");
                  setValue("password", "TestPass123");
                }}
              >
                <ThemedText style={styles.devButtonText}>
                  Fill Test Data
                </ThemedText>
              </TouchableOpacity>
              {/* <TouchableOpacity
                style={[styles.devButton, styles.devButtonSecondary]}
                onPress={() => router.push("/auth/login")}
              >
                <ThemedText style={styles.devButtonText}>
                  Go to Sign In
                </ThemedText>
              </TouchableOpacity> */}
            </View>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  title: {
    fontSize: fontSize(28),
    textAlign: "center",
    marginTop: hp(8),
    fontWeight: "700",
  },
  subtitle: {
    fontSize: fontSize(16),
    textAlign: "center",
    marginTop: hp(6),
    lineHeight: fontSize(22),
  },
  form: { marginTop: hp(18), gap: 12 },
  label: { fontSize: fontSize(14), marginBottom: hp(6), fontWeight: "600" },
  input: { borderRadius: wp(12), backgroundColor: "transparent" },
  error: {
    fontSize: fontSize(14),
    textAlign: "center",
    marginTop: hp(4),
  },
  primaryButton: {
    borderRadius: wp(14),
    marginTop: hp(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryContent: { height: hp(56) },
  primaryLabel: { fontSize: fontSize(18), fontWeight: "800", color: "#fff" },
  bottomLink: {
    marginTop: hp(18),
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  terms: {
    fontSize: fontSize(12),
    textAlign: "center",
    marginTop: hp(16),
    opacity: 0.9,
  },
  link: { fontSize: fontSize(12), fontWeight: "700" },
  devButton: {
    position: "absolute",
    bottom: hp(20),
    right: wp(20),
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: wp(12),
    paddingVertical: hp(8),
    borderRadius: wp(8),
    zIndex: 9999,
  },
  devButtonText: {
    color: "#fff",
    fontSize: fontSize(12),
    fontWeight: "700",
  },
  devButtonSecondary: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderColor: "#fff",
    borderWidth: 1,
  },
});
