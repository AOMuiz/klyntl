import ScreenContainer from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ExtendedKlyntlTheme, useKlyntlColors } from "@/constants/KlyntlTheme";
import { useAuth } from "@/stores/authStore";
import useOnboardingStore from "@/stores/onboardingStore";
import { fontSize, hp, wp } from "@/utils/responsive_dimensions_system";
import { validateEmail } from "@/utils/validations";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { Button, TextInput, useTheme } from "react-native-paper";

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme<ExtendedKlyntlTheme>();
  const colors = useKlyntlColors(theme);
  const setHasSeenOnboarding = useOnboardingStore(
    (s) => s.setHasSeenOnboarding
  );

  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
  } = useForm({
    defaultValues: {
      identifier: "",
      password: "",
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

  const onSubmit = async (data: { identifier: string; password: string }) => {
    if (!data.identifier.trim() || !data.password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // Validate email format
    if (!validateEmail(data.identifier)) {
      setError("identifier", {
        type: "manual",
        message: "Please enter a valid email address",
      });
      return;
    }

    try {
      await login(data.identifier, data.password);
      setHasSeenOnboarding(true);
      router.replace("/(tabs)");
    } catch (error) {
      // Error is already handled in the store
      Alert.alert(
        "Login Failed",
        error instanceof Error ? error.message : "An error occurred"
      );
    }
  };

  return (
    <ScreenContainer
      scrollable={true}
      withPadding={true}
      contentStyle={{ flex: 1 }}
      keyboardShouldAvoidView
    >
      <ThemedView
        style={[styles.page, { backgroundColor: theme.colors.background }]}
      >
        <ThemedText type="title" style={styles.title}>
          Sign In
        </ThemedText>
        <ThemedText
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Welcome Back!{"\n"}Securely sign in to your account.
        </ThemedText>

        <View style={styles.form}>
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
                error={!!errors.identifier}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
            name="identifier"
          />
          {errors.identifier && (
            <ThemedText style={[styles.error, { color: theme.colors.error }]}>
              {errors.identifier.message}
            </ThemedText>
          )}

          <View style={styles.passwordRow}>
            <ThemedText style={styles.label}>Password</ThemedText>
            <TouchableOpacity
              onPress={() => router.push("/auth/forgot-password")}
            >
              <ThemedText
                style={[styles.forgot, { color: colors.primary[700] }]}
              >
                Forgot Password?
              </ThemedText>
            </TouchableOpacity>
          </View>

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
            {isLoading ? "Signing In..." : "Log In"}
          </Button>

          <TouchableOpacity
            style={styles.bottomLink}
            onPress={() => router.push("/auth/register")}
          >
            <ThemedText style={{ color: theme.colors.onSurfaceVariant }}>
              {"Don't have an account? "}
            </ThemedText>
            <ThemedText
              style={{ color: colors.primary[700], fontWeight: "700" }}
            >
              Sign Up
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
            <>
              <TouchableOpacity
                style={styles.devButton}
                onPress={() => {
                  setValue("identifier", "test@example.com");
                  setValue("password", "TestPass123");
                }}
              >
                <ThemedText style={styles.devButtonText}>
                  Fill Test Credentials
                </ThemedText>
              </TouchableOpacity>
              {/* <TouchableOpacity
                style={[styles.devButton, styles.devButtonSecondary]}
                onPress={() => router.push("/auth/register")}
              >
                <ThemedText style={styles.devButtonText}>
                  Go to Sign Up
                </ThemedText>
              </TouchableOpacity> */}
            </>
          )}
        </View>
      </ThemedView>
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
  passwordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgot: { fontSize: fontSize(14), fontWeight: "700" },
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
    position: "absolute",
    bottom: hp(8),
    right: wp(20),
    backgroundColor: "rgba(0, 150, 255, 0.8)",
    paddingHorizontal: wp(12),
    paddingVertical: hp(8),
    borderRadius: wp(8),
    zIndex: 9999,
  },
});
