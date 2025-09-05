import ScreenContainer from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import { ExtendedKlyntlTheme, useKlyntlColors } from "@/constants/KlyntlTheme";
import { useAuth } from "@/stores/authStore";
import useOnboardingStore from "@/stores/onboardingStore";
import { fontSize, hp, wp } from "@/utils/responsive_dimensions_system";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { Button, TextInput, useTheme } from "react-native-paper";

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme<ExtendedKlyntlTheme>();
  const colors = useKlyntlColors(theme);
  const setHasSeenOnboarding = useOnboardingStore(
    (s) => s.setHasSeenOnboarding
  );

  const { register, isLoading, error, clearError, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setHasSeenOnboarding(true);
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, setHasSeenOnboarding, router]);

  // Clear error when inputs change
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [email, password, phone, name, businessName, error, clearError]);

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in email and password");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    try {
      await register(
        email,
        password,
        phone || undefined,
        name || undefined,
        businessName || undefined
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
    <ScreenContainer scrollable={false} withPadding={true}>
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
          <TextInput
            mode="outlined"
            placeholder="Your full name"
            value={name}
            onChangeText={setName}
            left={<TextInput.Icon icon="account" />}
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            outlineColor={theme.colors.outline}
            activeOutlineColor={colors.primary[700]}
          />

          <ThemedText style={styles.label}>Email Address</ThemedText>
          <TextInput
            mode="outlined"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            left={<TextInput.Icon icon="email-outline" />}
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            outlineColor={theme.colors.outline}
            activeOutlineColor={colors.primary[700]}
            error={!!error}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <ThemedText style={styles.label}>Password</ThemedText>
          <TextInput
            mode="outlined"
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            left={<TextInput.Icon icon="lock-outline" />}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye" : "eye-off"}
                onPress={() => setShowPassword((s) => !s)}
              />
            }
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            outlineColor={theme.colors.outline}
            activeOutlineColor={colors.primary[700]}
            error={!!error}
          />

          <ThemedText style={styles.label}>Phone Number (Optional)</ThemedText>
          <TextInput
            mode="outlined"
            placeholder="+234 801 234 5678"
            value={phone}
            onChangeText={setPhone}
            left={<TextInput.Icon icon="phone" />}
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            outlineColor={theme.colors.outline}
            activeOutlineColor={colors.primary[700]}
            keyboardType="phone-pad"
          />

          <ThemedText style={styles.label}>Business Name (Optional)</ThemedText>
          <TextInput
            mode="outlined"
            placeholder="Your business name"
            value={businessName}
            onChangeText={setBusinessName}
            left={<TextInput.Icon icon="business" />}
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            outlineColor={theme.colors.outline}
            activeOutlineColor={colors.primary[700]}
          />

          {error && (
            <ThemedText style={[styles.error, { color: theme.colors.error }]}>
              {error}
            </ThemedText>
          )}

          <Button
            mode="contained"
            onPress={handleRegister}
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
});
