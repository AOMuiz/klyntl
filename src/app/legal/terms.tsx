import ScreenContainer, {
  edgesHorizontal,
} from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import { ExtendedKlyntlTheme } from "@/constants/KlyntlTheme";
import { fontSize, hp, wp } from "@/utils/responsive_dimensions_system";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";

export default function TermsOfService() {
  const router = useRouter();
  const theme = useTheme<ExtendedKlyntlTheme>();

  return (
    <ScreenContainer
      scrollable={false}
      withPadding={false}
      edges={["bottom", ...edgesHorizontal]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <ThemedText
            type="title"
            style={[styles.title, { color: theme.colors.onBackground }]}
          >
            Terms of Service
          </ThemedText>

          <ThemedText
            style={[
              styles.lastUpdated,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Last updated: September 5, 2025
          </ThemedText>

          <View style={styles.section}>
            <ThemedText
              type="subtitle"
              style={[
                styles.sectionTitle,
                { color: theme.colors.onBackground },
              ]}
            >
              1. Acceptance of Terms
            </ThemedText>
            <ThemedText
              style={[styles.sectionContent, { color: theme.colors.onSurface }]}
            >
              By accessing and using Klyntl, you accept and agree to be bound by
              the terms and provision of this agreement. If you do not agree to
              abide by the above, please do not use this service.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText
              type="subtitle"
              style={[
                styles.sectionTitle,
                { color: theme.colors.onBackground },
              ]}
            >
              2. Use License
            </ThemedText>
            <ThemedText
              style={[styles.sectionContent, { color: theme.colors.onSurface }]}
            >
              Permission is granted to temporarily use Klyntl for personal,
              non-commercial transitory viewing only. This is the grant of a
              license, not a transfer of title, and under this license you may
              not:
            </ThemedText>
            <View style={styles.bulletList}>
              <ThemedText
                style={[styles.bulletItem, { color: theme.colors.onSurface }]}
              >
                • Modify or copy the materials
              </ThemedText>
              <ThemedText
                style={[styles.bulletItem, { color: theme.colors.onSurface }]}
              >
                • Use the materials for any commercial purpose or for any public
                display
              </ThemedText>
              <ThemedText
                style={[styles.bulletItem, { color: theme.colors.onSurface }]}
              >
                • Attempt to decompile or reverse engineer any software
                contained in Klyntl
              </ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText
              type="subtitle"
              style={[
                styles.sectionTitle,
                { color: theme.colors.onBackground },
              ]}
            >
              3. User Accounts
            </ThemedText>
            <ThemedText
              style={[styles.sectionContent, { color: theme.colors.onSurface }]}
            >
              When you create an account with us, you must provide information
              that is accurate, complete, and current at all times. You are
              responsible for safeguarding the password and for all activities
              that occur under your account.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText
              type="subtitle"
              style={[
                styles.sectionTitle,
                { color: theme.colors.onBackground },
              ]}
            >
              4. Data Privacy
            </ThemedText>
            <ThemedText
              style={[styles.sectionContent, { color: theme.colors.onSurface }]}
            >
              Your privacy is important to us. Please review our Privacy Policy,
              which also governs your use of Klyntl, to understand our
              practices.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText
              type="subtitle"
              style={[
                styles.sectionTitle,
                { color: theme.colors.onBackground },
              ]}
            >
              5. Service Availability
            </ThemedText>
            <ThemedText
              style={[styles.sectionContent, { color: theme.colors.onSurface }]}
            >
              We strive to keep Klyntl available at all times, but we do not
              guarantee that the service will be uninterrupted or error-free. We
              reserve the right to modify or discontinue the service at any
              time.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText
              type="subtitle"
              style={[
                styles.sectionTitle,
                { color: theme.colors.onBackground },
              ]}
            >
              6. Limitation of Liability
            </ThemedText>
            <ThemedText
              style={[styles.sectionContent, { color: theme.colors.onSurface }]}
            >
              In no event shall Klyntl or its suppliers be liable for any
              damages (including, without limitation, damages for loss of data
              or profit, or due to business interruption) arising out of the use
              or inability to use Klyntl.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText
              type="subtitle"
              style={[
                styles.sectionTitle,
                { color: theme.colors.onBackground },
              ]}
            >
              7. Termination
            </ThemedText>
            <ThemedText
              style={[styles.sectionContent, { color: theme.colors.onSurface }]}
            >
              We may terminate or suspend your account immediately, without
              prior notice or liability, for any reason whatsoever, including
              without limitation if you breach the Terms.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText
              type="subtitle"
              style={[
                styles.sectionTitle,
                { color: theme.colors.onBackground },
              ]}
            >
              8. Changes to Terms
            </ThemedText>
            <ThemedText
              style={[styles.sectionContent, { color: theme.colors.onSurface }]}
            >
              We reserve the right, at our sole discretion, to modify or replace
              these Terms at any time. If a revision is material, we will try to
              provide at least 30 days notice prior to any new terms taking
              effect.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText
              type="subtitle"
              style={[
                styles.sectionTitle,
                { color: theme.colors.onBackground },
              ]}
            >
              9. Contact Information
            </ThemedText>
            <ThemedText
              style={[styles.sectionContent, { color: theme.colors.onSurface }]}
            >
              If you have any questions about these Terms of Service, please
              contact us at support@klyntl.com.
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: hp(40),
  },
  container: {
    paddingHorizontal: wp(20),
    paddingTop: hp(20),
  },
  title: {
    fontSize: fontSize(24),
    fontWeight: "700",
    marginBottom: hp(8),
    textAlign: "center",
  },
  lastUpdated: {
    fontSize: fontSize(14),
    textAlign: "center",
    marginBottom: hp(24),
    opacity: 0.7,
  },
  section: {
    marginBottom: hp(24),
  },
  sectionTitle: {
    fontSize: fontSize(18),
    fontWeight: "600",
    marginBottom: hp(12),
  },
  sectionContent: {
    fontSize: fontSize(16),
    lineHeight: 24,
    opacity: 0.9,
  },
  bulletList: {
    marginTop: hp(8),
    marginLeft: wp(16),
  },
  bulletItem: {
    fontSize: fontSize(16),
    lineHeight: 24,
    marginBottom: hp(4),
    opacity: 0.9,
  },
});
