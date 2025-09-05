import ScreenContainer, {
  edgesHorizontal,
} from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import { ExtendedKlyntlTheme } from "@/constants/KlyntlTheme";
import { fontSize, hp, wp } from "@/utils/responsive_dimensions_system";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";

export default function PrivacyPolicy() {
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
            Privacy Policy
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
              1. Information We Collect
            </ThemedText>
            <ThemedText
              style={[styles.sectionContent, { color: theme.colors.onSurface }]}
            >
              We collect information you provide directly to us, such as when
              you create an account, use our services, or contact us for
              support. This may include:
            </ThemedText>
            <View style={styles.bulletList}>
              <ThemedText
                style={[styles.bulletItem, { color: theme.colors.onSurface }]}
              >
                • Name, email address, and phone number
              </ThemedText>
              <ThemedText
                style={[styles.bulletItem, { color: theme.colors.onSurface }]}
              >
                • Customer data you enter into the system
              </ThemedText>
              <ThemedText
                style={[styles.bulletItem, { color: theme.colors.onSurface }]}
              >
                • Usage data and analytics
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
              2. How We Use Your Information
            </ThemedText>
            <ThemedText
              style={[styles.sectionContent, { color: theme.colors.onSurface }]}
            >
              We use the information we collect to:
            </ThemedText>
            <View style={styles.bulletList}>
              <ThemedText
                style={[styles.bulletItem, { color: theme.colors.onSurface }]}
              >
                • Provide, maintain, and improve our services
              </ThemedText>
              <ThemedText
                style={[styles.bulletItem, { color: theme.colors.onSurface }]}
              >
                • Process transactions and manage your account
              </ThemedText>
              <ThemedText
                style={[styles.bulletItem, { color: theme.colors.onSurface }]}
              >
                • Communicate with you about our services
              </ThemedText>
              <ThemedText
                style={[styles.bulletItem, { color: theme.colors.onSurface }]}
              >
                • Ensure security and prevent fraud
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
              3. Information Sharing
            </ThemedText>
            <ThemedText
              style={[styles.sectionContent, { color: theme.colors.onSurface }]}
            >
              We do not sell, trade, or otherwise transfer your personal
              information to third parties without your consent, except as
              described in this policy. We may share your information in the
              following circumstances:
            </ThemedText>
            <View style={styles.bulletList}>
              <ThemedText
                style={[styles.bulletItem, { color: theme.colors.onSurface }]}
              >
                • With service providers who assist us in operating our platform
              </ThemedText>
              <ThemedText
                style={[styles.bulletItem, { color: theme.colors.onSurface }]}
              >
                • When required by law or to protect our rights
              </ThemedText>
              <ThemedText
                style={[styles.bulletItem, { color: theme.colors.onSurface }]}
              >
                • In connection with a business transfer
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
              4. Data Security
            </ThemedText>
            <ThemedText
              style={[styles.sectionContent, { color: theme.colors.onSurface }]}
            >
              We implement appropriate technical and organizational measures to
              protect your personal information against unauthorized access,
              alteration, disclosure, or destruction. However, no method of
              transmission over the internet is 100% secure.
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
              5. Data Retention
            </ThemedText>
            <ThemedText
              style={[styles.sectionContent, { color: theme.colors.onSurface }]}
            >
              We retain your personal information for as long as necessary to
              provide our services and fulfill the purposes outlined in this
              policy, unless a longer retention period is required by law.
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
              6. Your Rights
            </ThemedText>
            <ThemedText
              style={[styles.sectionContent, { color: theme.colors.onSurface }]}
            >
              Depending on your location, you may have certain rights regarding
              your personal information, including:
            </ThemedText>
            <View style={styles.bulletList}>
              <ThemedText
                style={[styles.bulletItem, { color: theme.colors.onSurface }]}
              >
                • Access to your personal information
              </ThemedText>
              <ThemedText
                style={[styles.bulletItem, { color: theme.colors.onSurface }]}
              >
                • Correction of inaccurate information
              </ThemedText>
              <ThemedText
                style={[styles.bulletItem, { color: theme.colors.onSurface }]}
              >
                • Deletion of your personal information
              </ThemedText>
              <ThemedText
                style={[styles.bulletItem, { color: theme.colors.onSurface }]}
              >
                • Data portability
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
              7. Cookies and Tracking
            </ThemedText>
            <ThemedText
              style={[styles.sectionContent, { color: theme.colors.onSurface }]}
            >
              We may use cookies and similar tracking technologies to enhance
              your experience with our service. You can control cookie settings
              through your browser preferences.
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
              8. Children&apos;s Privacy
            </ThemedText>
            <ThemedText
              style={[styles.sectionContent, { color: theme.colors.onSurface }]}
            >
              Our service is not intended for children under 13. We do not
              knowingly collect personal information from children under 13. If
              we become aware that we have collected personal information from a
              child under 13, we will take steps to delete such information.
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
              9. Changes to This Policy
            </ThemedText>
            <ThemedText
              style={[styles.sectionContent, { color: theme.colors.onSurface }]}
            >
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new Privacy Policy on
              this page and updating the &quot;Last updated&quot; date.
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
              10. Contact Us
            </ThemedText>
            <ThemedText
              style={[styles.sectionContent, { color: theme.colors.onSurface }]}
            >
              If you have any questions about this Privacy Policy, please
              contact us at privacy@klyntl.com.
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
    paddingTop: hp(20),
  },
  container: {
    paddingHorizontal: wp(20),
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
