import ScreenContainer from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol, IconSymbolName } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { fontSize, hp, wp } from "@/utils/responsive_dimensions_system";
import { useRouter } from "expo-router";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Mock data - replace with actual hooks/data
  const userData = {
    name: "Aisha Bello",
    avatar: "https://via.placeholder.com/50.png", // Replace with actual avatar
  };

  const overviewData = {
    totalCustomers: 250,
    recentTransactions: 12,
    pendingTasks: 3,
  };

  const recentActivity = [
    {
      id: 1,
      type: "customer",
      title: "New customer added",
      subtitle: "Aisha Bello",
      time: "2m ago",
      icon: "person.badge.plus",
      color: colors.success,
    },
    {
      id: 2,
      type: "transaction",
      title: "Transaction recorded",
      subtitle: "Sale of goods - ₦15,000",
      time: "1h ago",
      icon: "creditcard",
      color: colors.primary,
    },
    {
      id: 3,
      type: "task",
      title: "Task completed",
      subtitle: "Follow up with client",
      time: "3h ago",
      icon: "checkmark.circle",
      color: colors.warning,
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

  const renderOverviewCard = (
    title: string,
    value: string | number,
    subtitle: string,
    backgroundColor: string,
    textColor: string
  ) => (
    <View style={[styles.overviewCard, { backgroundColor }]}>
      <ThemedText style={[styles.overviewValue, { color: textColor }]}>
        {value}
      </ThemedText>
      <ThemedText style={[styles.overviewSubtitle, { color: textColor }]}>
        {subtitle}
      </ThemedText>
    </View>
  );

  const renderQuickAction = (
    title: string,
    icon: IconSymbolName,
    backgroundColor: string,
    onPress: () => void,
    iconAndTextColor?: string // add this
  ) => (
    <TouchableOpacity
      style={[styles.quickActionCard, { backgroundColor }]}
      onPress={onPress}
    >
      <IconSymbol
        name={icon}
        size={24}
        color={iconAndTextColor ?? colors.surface}
      />
      <ThemedText
        style={[
          styles.quickActionText,
          { color: iconAndTextColor ?? colors.surface },
        ]}
      >
        {title}
      </ThemedText>
    </TouchableOpacity>
  );

  const renderActivityItem = (item: any) => (
    <View key={item.id} style={styles.activityItem}>
      <View
        style={[styles.activityIcon, { backgroundColor: item.color + "20" }]}
      >
        <IconSymbol name={item.icon} size={20} color={item.color} />
      </View>
      <View style={styles.activityContent}>
        <ThemedText style={[styles.activityTitle, { color: colors.text }]}>
          {item.title}
        </ThemedText>
        <ThemedText
          style={[styles.activitySubtitle, { color: colors.textSecondary }]}
        >
          {item.subtitle}
        </ThemedText>
      </View>
      <ThemedText
        style={[styles.activityTime, { color: colors.textSecondary }]}
      >
        {item.time}
      </ThemedText>
    </View>
  );

  return (
    <ScreenContainer
      scrollable={true}
      withPadding={false}
      scrollViewProps={{ showsVerticalScrollIndicator: false }}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
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
                style={[styles.welcomeText, { color: colors.textSecondary }]}
              >
                Welcome back,
              </ThemedText>
              <ThemedText style={[styles.userName, { color: colors.text }]}>
                {userData.name}
              </ThemedText>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <IconSymbol name="bell" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Overview Section */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
          Overview
        </ThemedText>
        <View style={styles.overviewGrid}>
          {renderOverviewCard(
            "Total Customers",
            overviewData.totalCustomers,
            "Total\nCustomers",
            colors.success + "20",
            colors.success
          )}
          {renderOverviewCard(
            "Recent Transactions",
            overviewData.recentTransactions,
            "Recent\nTransactions",
            colors.primary + "20",
            colors.primary
          )}
          {renderOverviewCard(
            "Pending Tasks",
            overviewData.pendingTasks,
            "Pending\nTasks",
            colors.warning + "20",
            colors.warning
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
          Quick Actions
        </ThemedText>
        <View style={styles.quickActionsGrid}>
          {renderQuickAction(
            "Add Customer",
            "person.badge.plus",
            colors.secondary,
            () => handleQuickAction("add-customer")
          )}
          {renderQuickAction(
            "Record Sale",
            "doc.text",
            colors.surfaceVariant,
            () => handleQuickAction("record-sale"),
            colors.text // <-- new prop for better contrast
          )}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <View style={styles.activityHeader}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Activity
          </ThemedText>
          <TouchableOpacity>
            <ThemedText
              style={[styles.viewAllText, { color: colors.secondary }]}
            >
              View All
            </ThemedText>
          </TouchableOpacity>
        </View>
        <View style={styles.activityList}>
          {recentActivity.map(renderActivityItem)}
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
  overviewGrid: {
    flexDirection: "row",
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    borderRadius: 16,
    alignItems: "center",
    minHeight: hp(100),
    justifyContent: "center",
  },
  overviewValue: {
    fontSize: fontSize(32),
    fontWeight: "bold",
    marginBottom: 8,
    paddingTop: 10,
  },
  overviewSubtitle: {
    fontSize: fontSize(12),
    textAlign: "center",
    lineHeight: 16,
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
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: fontSize(14),
    fontWeight: "600",
  },
  activityList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
