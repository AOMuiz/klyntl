import { ThemedText } from "@/components/ThemedText";
import ScreenContainer, { edgesAll } from "@/components/screen-container";
import { ExtendedKlyntlTheme, useKlyntlColors } from "@/constants/KlyntlTheme";
import { fontSize, hp, wp } from "@/utils/responsive_dimensions_system";
import { useRouter } from "expo-router";
import { Image, StyleSheet, View } from "react-native";
import { Button, useTheme } from "react-native-paper";

export default function Welcome() {
  const router = useRouter();
  const theme = useTheme<ExtendedKlyntlTheme>();
  const colors = useKlyntlColors(theme);

  return (
    <ScreenContainer scrollable={false} withPadding={false} edges={edgesAll}>
      <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
        <View style={styles.heroContainer}>
          <Image
            source={require("../../assets/images/business-growth.png")}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        <View
          style={[styles.card, { backgroundColor: theme.colors.background }]}
        >
          <ThemedText
            type="title"
            style={[styles.greeting, { color: theme.colors.onBackground }]}
          >
            Grow Your Business with
          </ThemedText>
          <ThemedText
            type="title"
            style={[styles.brand, { color: colors.primary[700] }]}
          >
            Klyntl
          </ThemedText>

          <ThemedText
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Manage customers, track sales, and boost your business with our
            easy-to-use CRM. Designed for Nigerian SMEs.
          </ThemedText>

          <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={() => router.push("/auth/register")}
              contentStyle={styles.primaryContent}
              labelStyle={styles.primaryLabel}
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary[700] },
              ]}
            >
              Get Started
            </Button>

            <Button
              mode="outlined"
              elevation={2}
              onPress={() => router.push("/auth/login")}
              contentStyle={styles.secondaryContent}
              labelStyle={[
                styles.secondaryLabel,
                { color: colors.primary[700] },
              ]}
              style={[
                styles.secondaryButton,
                {
                  borderColor: colors.primary[100],
                  backgroundColor: colors.primary[50],
                },
              ]}
            >
              Log In
            </Button>
          </View>

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
  heroContainer: {
    height: hp(400),
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  card: {
    flex: 1,
    marginTop: -hp(80),
    borderTopLeftRadius: wp(24),
    borderTopRightRadius: wp(24),
    paddingTop: hp(36),
    paddingHorizontal: wp(24),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  greeting: { fontSize: fontSize(28), fontWeight: "600", textAlign: "center" },
  brand: {
    fontSize: fontSize(34),
    fontWeight: "800",
    marginTop: hp(6),
    marginBottom: hp(8),
  },
  subtitle: {
    fontSize: fontSize(15),
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: wp(6),
  },
  actions: { width: "100%", marginTop: hp(24), gap: 12 },
  primaryButton: {
    borderRadius: wp(14),
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryContent: { height: hp(56) },
  primaryLabel: { fontSize: fontSize(18), fontWeight: "800", color: "#fff" },
  secondaryButton: {
    borderRadius: wp(14),
    width: "100%",
    marginTop: hp(12),
    borderWidth: 1,
  },
  secondaryContent: { height: hp(56) },
  secondaryLabel: { fontSize: fontSize(18), fontWeight: "700" },
  terms: {
    fontSize: fontSize(12),
    textAlign: "center",
    marginTop: hp(22),
    opacity: 0.9,
  },
  link: { fontSize: fontSize(12), fontWeight: "700" },
});
