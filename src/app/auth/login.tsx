import ScreenContainer from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import { ExtendedKlyntlTheme, useKlyntlColors } from "@/constants/KlyntlTheme";
import useOnboardingStore from "@/stores/onboardingStore";
import { fontSize, hp, wp } from "@/utils/responsive_dimensions_system";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Button, TextInput, useTheme } from "react-native-paper";

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme<ExtendedKlyntlTheme>();
  const colors = useKlyntlColors(theme);
  const setHasSeenOnboarding = useOnboardingStore(
    (s) => s.setHasSeenOnboarding
  );

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <ScreenContainer
      scrollable={false}
      withPadding={true}
      contentStyle={{ flex: 1 }}
    >
      <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
        <ThemedText type="title" style={styles.title}>
          Sign In
        </ThemedText>
        <ThemedText
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Welcome Back!{"\n"}Securely sign in to your account.
        </ThemedText>

        <View style={styles.form}>
          <ThemedText style={styles.label}>Email or Phone Number</ThemedText>
          <TextInput
            mode="outlined"
            placeholder="e.g. yourname@example.com"
            value={identifier}
            onChangeText={setIdentifier}
            left={<TextInput.Icon icon="account" />}
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            outlineColor={theme.colors.outline}
            activeOutlineColor={colors.primary[700]}
          />

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

          <TextInput
            mode="outlined"
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye" : "eye-off"}
                onPress={() => setShowPassword((s) => !s)}
              />
            }
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            outlineColor={theme.colors.outline}
            activeOutlineColor={colors.primary[700]}
          />

          <Button
            mode="contained"
            onPress={() => {
              // Temporary client-side validation and navigation.
              // Replace this with your real authentication call and handle errors.
              //   if (!identifier || !password) return; // simple guard
              //   // Mark onboarding as complete so protected stack becomes available
              setHasSeenOnboarding(true);
              // Navigate to the tabs home index explicitly
              router.replace("/(tabs)");
            }}
            contentStyle={styles.primaryContent}
            labelStyle={styles.primaryLabel}
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary[700] },
            ]}
          >
            Log In
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
  passwordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgot: { fontSize: fontSize(14), fontWeight: "700" },
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
});
