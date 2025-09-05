import ScreenContainer, {
  edgesHorizontal,
} from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { ExtendedKlyntlTheme, useKlyntlColors } from "@/constants/KlyntlTheme";
import { ds, fontSize, spacing } from "@/utils/responsive_dimensions_system";
import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "react-native-paper";

export default function SettingsIndex() {
  const theme = useTheme<ExtendedKlyntlTheme>();
  const colors = useKlyntlColors(theme);
  const router = useRouter();

  // Theme-aware color tokens for ThemedText (pass as light/dark overrides)
  // Use Paper semantic colors from colors.paper which already adapt to theme
  const lightText = colors.paper.onBackground;
  const darkText = colors.paper.onBackground;
  const lightSubtitle = colors.paper.onSurfaceVariant;
  const darkSubtitle = colors.paper.onSurfaceVariant;
  const lightError = colors.paper.error;
  const darkError = colors.paper.error;

  return (
    <ScreenContainer scrollable={true} edges={edgesHorizontal}>
      <ThemedText
        style={styles.sectionHeader}
        lightColor={lightText}
        darkColor={darkText}
      >
        Account
      </ThemedText>
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.item, { backgroundColor: colors.paper.surface }]}
          onPress={() => router.push("/(tabs)/settings/profile")}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.paper.surfaceVariant },
            ]}
          >
            <IconSymbol
              size={18}
              name="person.crop.circle"
              color={colors.paper.onSurfaceVariant}
            />
          </View>
          <View style={styles.itemText}>
            <ThemedText
              lightColor={lightText}
              darkColor={darkText}
              style={styles.itemTitle}
            >
              Profile
            </ThemedText>
            <ThemedText
              lightColor={lightSubtitle}
              darkColor={darkSubtitle}
              style={styles.itemSubtitle}
            >
              Manage your profile
            </ThemedText>
          </View>
          <IconSymbol
            size={18}
            name="chevron.right"
            color={colors.paper.onSurfaceVariant}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.item, { backgroundColor: colors.paper.surface }]}
          onPress={() => router.push("/(tabs)/settings/business")}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.paper.surfaceVariant },
            ]}
          >
            <IconSymbol
              size={18}
              name="briefcase"
              color={colors.paper.onSurfaceVariant}
            />
          </View>
          <View style={styles.itemText}>
            <ThemedText
              lightColor={lightText}
              darkColor={darkText}
              style={styles.itemTitle}
            >
              Business
            </ThemedText>
            <ThemedText
              lightColor={lightSubtitle}
              darkColor={darkSubtitle}
              style={styles.itemSubtitle}
            >
              Manage your business
            </ThemedText>
          </View>
          <IconSymbol
            size={18}
            name="chevron.right"
            color={colors.paper.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>

      <ThemedText
        style={styles.sectionHeader}
        lightColor={lightText}
        darkColor={darkText}
      >
        Preferences
      </ThemedText>
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.item, { backgroundColor: colors.paper.surface }]}
          onPress={() => router.push("/(tabs)/settings/language")}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.paper.surfaceVariant },
            ]}
          >
            <IconSymbol
              size={18}
              name="globe"
              color={colors.paper.onSurfaceVariant}
            />
          </View>
          <View style={styles.itemText}>
            <ThemedText
              lightColor={lightText}
              darkColor={darkText}
              style={styles.itemTitle}
            >
              Language
            </ThemedText>
            <ThemedText
              lightColor={lightSubtitle}
              darkColor={darkSubtitle}
              style={styles.itemSubtitle}
            >
              English
            </ThemedText>
          </View>
          <IconSymbol
            size={18}
            name="chevron.right"
            color={colors.paper.onSurfaceVariant}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.item, { backgroundColor: colors.paper.surface }]}
          onPress={() => router.push("/(tabs)/settings/timezone")}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.paper.surfaceVariant },
            ]}
          >
            <IconSymbol
              size={18}
              name="clock"
              color={colors.paper.onSurfaceVariant}
            />
          </View>
          <View style={styles.itemText}>
            <ThemedText
              lightColor={lightText}
              darkColor={darkText}
              style={styles.itemTitle}
            >
              Timezone
            </ThemedText>
            <ThemedText
              lightColor={lightSubtitle}
              darkColor={darkSubtitle}
              style={styles.itemSubtitle}
            >
              GMT +1
            </ThemedText>
          </View>
          <IconSymbol
            size={18}
            name="chevron.right"
            color={colors.paper.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>

      <ThemedText
        style={styles.sectionHeader}
        lightColor={lightText}
        darkColor={darkText}
      >
        Support
      </ThemedText>
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.item, { backgroundColor: colors.paper.surface }]}
          onPress={() => router.push("/(tabs)/settings/help")}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.paper.surfaceVariant },
            ]}
          >
            <IconSymbol
              size={18}
              name="questionmark.circle"
              color={colors.paper.onSurfaceVariant}
            />
          </View>
          <View style={styles.itemText}>
            <ThemedText
              lightColor={lightText}
              darkColor={darkText}
              style={styles.itemTitle}
            >
              Help Center
            </ThemedText>
            <ThemedText
              lightColor={lightSubtitle}
              darkColor={darkSubtitle}
              style={styles.itemSubtitle}
            >
              Get help and support
            </ThemedText>
          </View>
          <IconSymbol
            size={18}
            name="chevron.right"
            color={colors.paper.onSurfaceVariant}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.item, { backgroundColor: colors.paper.surface }]}
          onPress={() => router.push("/(tabs)/settings/contact")}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.paper.surfaceVariant },
            ]}
          >
            <IconSymbol
              size={18}
              name="phone"
              color={colors.paper.onSurfaceVariant}
            />
          </View>
          <View style={styles.itemText}>
            <ThemedText
              lightColor={lightText}
              darkColor={darkText}
              style={styles.itemTitle}
            >
              Contact Us
            </ThemedText>
            <ThemedText
              lightColor={lightSubtitle}
              darkColor={darkSubtitle}
              style={styles.itemSubtitle}
            >
              Contact support
            </ThemedText>
          </View>
          <IconSymbol
            size={18}
            name="chevron.right"
            color={colors.paper.onSurfaceVariant}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.item, { backgroundColor: colors.paper.surface }]}
          onPress={() => router.push("/(tabs)/settings/terms")}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.paper.surfaceVariant },
            ]}
          >
            <IconSymbol
              size={18}
              name="document"
              color={colors.paper.onSurfaceVariant}
            />
          </View>
          <View style={styles.itemText}>
            <ThemedText
              lightColor={lightText}
              darkColor={darkText}
              style={styles.itemTitle}
            >
              Terms of Service
            </ThemedText>
            <ThemedText
              lightColor={lightSubtitle}
              darkColor={darkSubtitle}
              style={styles.itemSubtitle}
            >
              View terms
            </ThemedText>
          </View>
          <IconSymbol
            size={18}
            name="chevron.right"
            color={colors.paper.onSurfaceVariant}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.item, { backgroundColor: colors.paper.surface }]}
          onPress={() => router.push("/(tabs)/settings/privacy")}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.paper.surfaceVariant },
            ]}
          >
            <IconSymbol
              size={18}
              name="shield.checkerboard"
              color={colors.paper.onSurfaceVariant}
            />
          </View>
          <View style={styles.itemText}>
            <ThemedText
              lightColor={lightText}
              darkColor={darkText}
              style={styles.itemTitle}
            >
              Privacy Policy
            </ThemedText>
            <ThemedText
              lightColor={lightSubtitle}
              darkColor={darkSubtitle}
              style={styles.itemSubtitle}
            >
              View privacy policy
            </ThemedText>
          </View>
          <IconSymbol
            size={18}
            name="chevron.right"
            color={colors.paper.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.logoutButton,
          { borderColor: colors.paper.errorContainer },
        ]}
      >
        <ThemedText
          style={styles.logoutText}
          lightColor={lightError}
          darkColor={darkError}
        >
          Log Out
        </ThemedText>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize(24), marginBottom: spacing(12) },
  section: { marginVertical: spacing(8) },
  sectionHeader: {
    fontSize: fontSize(18),
    fontWeight: "700",
    marginTop: spacing(18),
    marginBottom: spacing(6),
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing(16),
    borderRadius: spacing(12),
    marginBottom: spacing(8),
  },
  iconCircle: {
    width: ds(44, "width"),
    height: ds(44, "width"),
    borderRadius: ds(22, "width"),
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing(12),
  },
  itemText: { flex: 1 },
  itemTitle: { fontSize: fontSize(16), fontWeight: "700" },
  itemSubtitle: { fontSize: fontSize(14) },
  logoutButton: {
    marginTop: spacing(24),
    padding: spacing(14),
    borderRadius: spacing(14),
    borderWidth: 2,
    alignItems: "center",
  },
  logoutText: { fontSize: fontSize(16), fontWeight: "700" },
});
