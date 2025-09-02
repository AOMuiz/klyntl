/**
 * Updated HomeScreen using Simplified Klyntl Theme
 *
 * This shows how to replace the complex Colors/ExtendedColors approach
 * with the simplified theme system.
 */

import ScreenContainer from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol, IconSymbolName } from "@/components/ui/IconSymbol";
import { ExtendedKlyntlTheme, useKlyntlColors } from "@/constants/KlyntlTheme";
import { useColorScheme } from "@/hooks/useColorScheme";
import { createThemedAvatarUrl } from "@/utils/avatar-utils";
import { fontSize, hp, wp } from "@/utils/responsive_dimensions_system";

import { useRouter } from "expo-router";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "react-native-paper";

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = useTheme<ExtendedKlyntlTheme>();
  const colors = useKlyntlColors(theme);

  // Mock data
  const userData = {
    name: "Aisha Bello",
    avatar: createThemedAvatarUrl("Aisha Bello", "primary", 100),
  };

  const overviewData = {
    totalCustomers: 250,
    recentTransactions: 12,
    pendingTasks: 3,
    totalRevenue: 125000,
  };

  const recentActivity = [
    {
      id: 1,
      type: "customer",
      title: "New customer added",
      subtitle: "Aisha Bello",
      time: "2m ago",
      icon: "person.badge.plus",
      color: colors.success[500], // Direct shade access!
    },
    {
      id: 2,
      type: "transaction",
      title: "Transaction recorded",
      subtitle: "Sale of goods - ₦15,000",
      time: "1h ago",
      icon: "creditcard",
      color: colors.primary[600], // Much simpler!
    },
    {
      id: 3,
      type: "task",
      title: "Task completed",
      subtitle: "Follow up with client",
      time: "3h ago",
      icon: "checkmark.circle",
      color: colors.warning[500],
    },
  ];

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "add-customer":
        router.push("/customer/add");
        break;
      case "record-sale":
        router.push("/transaction/add");
        break;
    }
  };

  const renderQuickAction = (
    title: string,
    icon: IconSymbolName,
    backgroundColor: string,
    onPress: () => void,
    iconAndTextColor?: string
  ) => (
    <TouchableOpacity
      style={[styles.quickActionCard, { backgroundColor }]}
      onPress={onPress}
    >
      <IconSymbol
        name={icon}
        size={20}
        color={iconAndTextColor ?? theme.colors.onPrimary} // Use Paper's semantic colors
      />
      <ThemedText
        style={[
          styles.quickActionText,
          { color: iconAndTextColor ?? theme.colors.onPrimary },
        ]}
      >
        {title}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer
      scrollable={true}
      withPadding={false}
      scrollViewProps={{ showsVerticalScrollIndicator: false }}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary[50] }]}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Image
                source={{ uri: userData.avatar }}
                style={styles.avatarImage}
              />
            </View>
            <View>
              <ThemedText
                style={[styles.welcomeText, { color: colors.neutral.gray600 }]}
              >
                Welcome back,
              </ThemedText>
              <ThemedText
                style={[styles.userName, { color: colors.neutral.gray900 }]}
              >
                {userData.name}
              </ThemedText>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.notificationButton,
              { backgroundColor: theme.colors.surfaceVariant }, // Paper semantic color
            ]}
          >
            <IconSymbol
              name="bell"
              size={24}
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Overview Section */}
      <View
        style={[styles.section, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.overviewContainer}>
          <ThemedText
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          >
            Overview
          </ThemedText>
          <View style={styles.overviewCards}>
            {/* Primary Card */}
            <TouchableOpacity
              style={[
                styles.overviewCard,
                {
                  backgroundColor: colors.primary[100], // Light primary shade
                  borderColor: colors.primary[200],
                },
              ]}
            >
              <View style={styles.cardIcon}>
                <IconSymbol
                  name="person.2"
                  size={24}
                  color={colors.primary[700]}
                />
              </View>
              <View style={styles.cardContent}>
                <ThemedText
                  style={[styles.cardValue, { color: colors.primary[900] }]}
                >
                  {overviewData.totalCustomers}
                </ThemedText>
                <ThemedText
                  style={[styles.cardLabel, { color: colors.primary[600] }]}
                >
                  Total Customers
                </ThemedText>
              </View>
            </TouchableOpacity>

            {/* Secondary Card */}
            <TouchableOpacity
              style={[
                styles.overviewCard,
                {
                  backgroundColor: colors.secondary[100],
                  borderColor: colors.secondary[200],
                },
              ]}
            >
              <View style={styles.cardIcon}>
                <IconSymbol
                  name="arrow.up.arrow.down"
                  size={24}
                  color={colors.secondary[700]}
                />
              </View>
              <View style={styles.cardContent}>
                <ThemedText
                  style={[styles.cardValue, { color: colors.secondary[900] }]}
                >
                  {overviewData.recentTransactions}
                </ThemedText>
                <ThemedText
                  style={[styles.cardLabel, { color: colors.secondary[600] }]}
                >
                  Total Transactions
                </ThemedText>
              </View>
            </TouchableOpacity>

            {/* Accent Card */}
            <TouchableOpacity
              style={[
                styles.overviewCard,
                {
                  backgroundColor: colors.accent[100],
                  borderColor: colors.accent[200],
                },
              ]}
            >
              <View style={styles.cardIcon}>
                <IconSymbol
                  name="chart.line.uptrend.xyaxis"
                  size={24}
                  color={colors.accent[700]}
                />
              </View>
              <View style={styles.cardContent}>
                <ThemedText
                  style={[styles.cardValue, { color: colors.accent[900] }]}
                >
                  ₦{overviewData.totalRevenue.toLocaleString()}
                </ThemedText>
                <ThemedText
                  style={[styles.cardLabel, { color: colors.accent[600] }]}
                >
                  Total Revenue
                </ThemedText>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View
        style={[styles.section, { backgroundColor: theme.colors.background }]}
      >
        <ThemedText
          style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
        >
          Quick Actions
        </ThemedText>
        <View style={styles.quickActionsGrid}>
          {renderQuickAction(
            "Add Customer",
            "person.badge.plus",
            theme.colors.primary, // Paper's primary color
            () => handleQuickAction("add-customer")
          )}
          {renderQuickAction(
            "Record Sale",
            "doc.text",
            theme.colors.secondary,
            () => handleQuickAction("record-sale")
          )}
          {renderQuickAction(
            "View Reports",
            "chart.bar",
            theme.colors.tertiary, // Paper's tertiary (our accent)
            () => handleQuickAction("view-reports")
          )}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.recentActivityContainer}>
        <View style={styles.sectionHeader}>
          <ThemedText
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          >
            Recent Activity
          </ThemedText>
          <TouchableOpacity>
            <ThemedText
              style={[styles.seeAllText, { color: theme.colors.primary }]}
            >
              See All
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.activityList}>
          {recentActivity.map((activity, index) => (
            <View
              key={index}
              style={[
                styles.activityItem,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outline,
                },
              ]}
            >
              <View style={styles.activityIcon}>
                <IconSymbol
                  name={activity.icon as IconSymbolName}
                  size={20}
                  color={activity.color}
                />
              </View>
              <View style={styles.activityContent}>
                <ThemedText
                  style={[
                    styles.activityTitle,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {activity.title}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.activitySubtitle,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {activity.subtitle}
                </ThemedText>
              </View>
              <ThemedText
                style={[
                  styles.activityTime,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {activity.time}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: wp(20),
    paddingBottom: hp(20),
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  welcomeText: {
    fontSize: fontSize(14),
    marginBottom: 2,
  },
  userName: {
    fontSize: fontSize(20),
    fontWeight: "bold",
  },
  notificationButton: {
    padding: 8,
    borderRadius: 20,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: fontSize(18),
    fontWeight: "600",
    marginBottom: 16,
  },
  overviewContainer: {
    marginBottom: 24,
  },
  overviewCards: {
    flexDirection: "row",
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    minHeight: hp(100),
    justifyContent: "center",
    gap: 8,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  cardContent: {
    alignItems: "center",
  },
  cardValue: {
    fontSize: fontSize(24),
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: fontSize(14),
    textAlign: "center",
    lineHeight: 18,
  },
  quickActionsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
    gap: 12,
  },
  quickActionText: {
    fontSize: fontSize(16),
    fontWeight: "600",
    textAlign: "center",
  },
  recentActivityContainer: {
    backgroundColor: "transparent",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "transparent",
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  seeAllText: {
    fontSize: fontSize(14),
    fontWeight: "600",
  },
  activityList: {
    gap: 16,
    padding: 16,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: fontSize(16),
    fontWeight: "600",
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: fontSize(14),
  },
  activityTime: {
    fontSize: fontSize(12),
  },
});

/*
Key Changes in This Simplified Approach:

1. **Removed Complex Imports**: No more Colors, ExtendedColors, or complex shade calculations
2. **Single Theme Source**: Everything comes from useKlyntlColors(theme)
3. **Direct Shade Access**: colors.primary[100], colors.secondary[600], etc.
4. **Paper Integration**: theme.colors.primary works automatically with Paper components
5. **Type Safety**: Full autocomplete and type checking
6. **Cleaner Code**: Much more readable and maintainable

Benefits:
- React Native Paper components automatically use your brand colors
- Easy access to any shade of any color
- No more complex color mapping or calculations
- Consistent with Material Design 3 principles
- Full TypeScript support
*/
