import ScreenContainer from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import { ExtendedKlyntlTheme, useKlyntlColors } from "@/constants/KlyntlTheme";
import useOnboardingStore from "@/stores/onboardingStore";
import { fontSize, hp, wp } from "@/utils/responsive_dimensions_system";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Button, TextInput, useTheme } from "react-native-paper";

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme<ExtendedKlyntlTheme>();
  const colors = useKlyntlColors(theme);
  const setHasSeenOnboarding = useOnboardingStore(
    (s) => s.setHasSeenOnboarding
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
          />

          <ThemedText style={styles.label}>Phone Number</ThemedText>
          <TextInput
            mode="outlined"
            placeholder="+234 801 234 5678"
            value={phone}
            onChangeText={setPhone}
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            outlineColor={theme.colors.outline}
            activeOutlineColor={colors.primary[700]}
          />

          <Button
            mode="contained"
            onPress={() => {
              // Temporary client-side validation and navigation.
              // Replace this with your real registration call and handle errors.
              if (!email || !password) return; // simple guard
              // Mark onboarding as complete so protected stack becomes available
              setHasSeenOnboarding(true);
              // Navigate to the tabs home index explicitly
              router.replace("/(tabs)/index");
            }}
            contentStyle={styles.primaryContent}
            labelStyle={styles.primaryLabel}
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary[700] },
            ]}
          >
            Sign Up
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
