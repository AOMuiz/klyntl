import ScreenContainer from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { ExtendedKlyntlTheme, useKlyntlColors } from "@/constants/KlyntlTheme";
import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "react-native-paper";

export default function SettingsIndex() {
  const theme = useTheme<ExtendedKlyntlTheme>();
  const colors = useKlyntlColors(theme);
  const router = useRouter();

  return (
    <ScreenContainer>
      <ThemedText type="title" style={styles.title}>
        Settings
      </ThemedText>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.item}
          onPress={() => router.push("/(tabs)/settings/profile")}
        >
          <View style={styles.iconCircle}>
            <IconSymbol
              size={18}
              name="person.crop.circle"
              color={colors.paper.onSurfaceVariant}
            />
          </View>
          <View style={styles.itemText}>
            <ThemedText style={styles.itemTitle}>Profile</ThemedText>
            <ThemedText style={styles.itemSubtitle}>
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
          style={styles.item}
          onPress={() => router.push("/(tabs)/settings/business")}
        >
          <View style={styles.iconCircle}>
            <IconSymbol
              size={18}
              name="briefcase"
              color={colors.paper.onSurfaceVariant}
            />
          </View>
          <View style={styles.itemText}>
            <ThemedText style={styles.itemTitle}>Business</ThemedText>
            <ThemedText style={styles.itemSubtitle}>
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

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.item}
          onPress={() => router.push("/(tabs)/settings/language")}
        >
          <View style={styles.iconCircle}>
            <IconSymbol
              size={18}
              name="globe"
              color={colors.paper.onSurfaceVariant}
            />
          </View>
          <View style={styles.itemText}>
            <ThemedText style={styles.itemTitle}>Language</ThemedText>
            <ThemedText style={styles.itemSubtitle}>English</ThemedText>
          </View>
          <IconSymbol
            size={18}
            name="chevron.right"
            color={colors.paper.onSurfaceVariant}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.item}
          onPress={() => router.push("/(tabs)/settings/timezone")}
        >
          <View style={styles.iconCircle}>
            <IconSymbol
              size={18}
              name="clock"
              color={colors.paper.onSurfaceVariant}
            />
          </View>
          <View style={styles.itemText}>
            <ThemedText style={styles.itemTitle}>Timezone</ThemedText>
            <ThemedText style={styles.itemSubtitle}>GMT +1</ThemedText>
          </View>
          <IconSymbol
            size={18}
            name="chevron.right"
            color={colors.paper.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.item}
          onPress={() => router.push("/(tabs)/settings/help")}
        >
          <View style={styles.iconCircle}>
            <IconSymbol
              size={18}
              name="questionmark.circle"
              color={colors.paper.onSurfaceVariant}
            />
          </View>
          <View style={styles.itemText}>
            <ThemedText style={styles.itemTitle}>Help Center</ThemedText>
            <ThemedText style={styles.itemSubtitle}>
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
          style={styles.item}
          onPress={() => router.push("/(tabs)/settings/contact")}
        >
          <View style={styles.iconCircle}>
            <IconSymbol
              size={18}
              name="phone"
              color={colors.paper.onSurfaceVariant}
            />
          </View>
          <View style={styles.itemText}>
            <ThemedText style={styles.itemTitle}>Contact Us</ThemedText>
            <ThemedText style={styles.itemSubtitle}>Contact support</ThemedText>
          </View>
          <IconSymbol
            size={18}
            name="chevron.right"
            color={colors.paper.onSurfaceVariant}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.item}
          onPress={() => router.push("/(tabs)/settings/terms")}
        >
          <View style={styles.iconCircle}>
            <IconSymbol
              size={18}
              name="document"
              color={colors.paper.onSurfaceVariant}
            />
          </View>
          <View style={styles.itemText}>
            <ThemedText style={styles.itemTitle}>Terms of Service</ThemedText>
            <ThemedText style={styles.itemSubtitle}>View terms</ThemedText>
          </View>
          <IconSymbol
            size={18}
            name="chevron.right"
            color={colors.paper.onSurfaceVariant}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.item}
          onPress={() => router.push("/(tabs)/settings/privacy")}
        >
          <View style={styles.iconCircle}>
            <IconSymbol
              size={18}
              name="shield.checkerboard"
              color={colors.paper.onSurfaceVariant}
            />
          </View>
          <View style={styles.itemText}>
            <ThemedText style={styles.itemTitle}>Privacy Policy</ThemedText>
            <ThemedText style={styles.itemSubtitle}>
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

      <TouchableOpacity style={styles.logoutButton}>
        <ThemedText style={styles.logoutText}>Log Out</ThemedText>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, marginBottom: 12 },
  section: { marginVertical: 8 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemText: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: "700" },
  itemSubtitle: { fontSize: 14, color: "#9CA3AF" },
  logoutButton: {
    marginTop: 24,
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#FFCDD2",
    alignItems: "center",
  },
  logoutText: { color: "#FF3B30", fontSize: 16, fontWeight: "700" },
});
