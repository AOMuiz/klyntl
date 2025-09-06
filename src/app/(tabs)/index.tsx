import { CustomerCard } from "@/components/CustomerCard";
import ScreenContainer from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol, IconSymbolName } from "@/components/ui/IconSymbol";
import { ExtendedKlyntlTheme, useKlyntlColors } from "@/constants/KlyntlTheme";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useCustomers } from "@/hooks/useCustomers";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import { formatCurrency } from "@/utils/currency";
import { fontSize, hp, wp } from "@/utils/responsive_dimensions_system";
import { useRouter } from "expo-router";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { Button, Divider, useTheme } from "react-native-paper";

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme<ExtendedKlyntlTheme>();
  const colors = useKlyntlColors(theme);
  const {
    customers,
    isLoading: customersLoading,
    error: customersError,
  } = useCustomers();
  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useAnalytics();
  const {
    storeConfig,
    isLoading: storeConfigLoading,
    error: storeConfigError,
  } = useStoreConfig();

  // Loading state for the entire screen
  const isLoading = customersLoading || analyticsLoading || storeConfigLoading;

  // Error state
  const hasError = customersError || analyticsError || storeConfigError;

  // Mock data - replace with actual hooks/data
  const userData = {
    name: storeConfig?.storeName || "Your Store",
    avatar:
      storeConfig?.logoUrl ||
      "https://pbs.twimg.com/profile_images/1944623608719912960/jFs_gxjP_400x400.jpg",
  };

  // Use real analytics data with safe fallbacks
  const overviewData = {
    totalCustomers: analytics?.totalCustomers ?? 0,
    recentTransactions: analytics?.totalTransactions ?? 0,
    totalRevenue: analytics?.totalRevenue ?? 0,
    totalOutstandingDebts: analytics?.totalOutstandingDebts ?? 0,
  };

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
        size={wp(20)}
        color={iconAndTextColor ?? theme.colors.onPrimary}
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
      // containerStyle={styles.exampleContainer}
    >
      {hasError ? (
        <View style={styles.errorContainer}>
          <ThemedText style={[styles.errorText, { color: colors.error[600] }]}>
            Failed to load data. Please try again.
          </ThemedText>
          <Button
            mode="outlined"
            onPress={() => {
              // Refetch all data
              // Note: This would require adding refetch functions from the hooks
            }}
            style={styles.retryButton}
          >
            Retry
          </Button>
        </View>
      ) : (
        <>
          {/* Header */}
          <View
            style={[styles.header, { backgroundColor: theme.colors.surface }]}
          >
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
                    style={[
                      styles.welcomeText,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    Welcome back,
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.userName,
                      { color: theme.colors.onBackground },
                    ]}
                  >
                    {userData.name}
                  </ThemedText>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.notificationButton,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
              >
                <IconSymbol
                  name="bell"
                  size={wp(24)}
                  color={theme.colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            </View>
          </View>

          <Divider />

          {/* Overview Section */}
          <View
            style={[
              styles.section,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <View style={styles.overviewContainer}>
              <ThemedText
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.onBackground },
                ]}
              >
                Overview
              </ThemedText>
              <View style={styles.overviewCards}>
                <View style={styles.topRow}>
                  {/* Primary Card */}
                  <TouchableOpacity
                    style={[
                      styles.overviewCard,
                      {
                        backgroundColor: colors.primary[50],
                        borderColor: colors.primary[100],
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.cardIcon,
                        { backgroundColor: colors.primary[100] },
                      ]}
                    >
                      <IconSymbol
                        name="person.2"
                        size={wp(32)}
                        color={colors.primary[700]}
                      />
                    </View>
                    <View style={styles.cardContent}>
                      <ThemedText
                        style={[
                          styles.cardValue,
                          { color: colors.primary[900] },
                        ]}
                      >
                        {isLoading ? "..." : overviewData.totalCustomers}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.cardLabel,
                          { color: colors.primary[600] },
                        ]}
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
                        backgroundColor: colors.secondary[50],
                        borderColor: colors.secondary[100],
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.cardIcon,
                        { backgroundColor: colors.secondary[100] },
                      ]}
                    >
                      <IconSymbol
                        name="arrow.up.arrow.down"
                        size={wp(32)}
                        color={colors.secondary[700]}
                      />
                    </View>
                    <View style={styles.cardContent}>
                      <ThemedText
                        style={[
                          styles.cardValue,
                          { color: colors.secondary[900] },
                        ]}
                      >
                        {isLoading ? "..." : overviewData.recentTransactions}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.cardLabel,
                          { color: colors.secondary[600] },
                        ]}
                      >
                        Total Transactions
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.bottomRow}>
                  {/* Accent Card */}
                  <TouchableOpacity
                    style={[
                      styles.overviewCard,
                      {
                        backgroundColor: colors.accent[50],
                        borderColor: colors.accent[100],
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.cardIcon,
                        { backgroundColor: colors.accent[100] },
                      ]}
                    >
                      <IconSymbol
                        name="chart.line.uptrend.xyaxis"
                        size={wp(32)}
                        color={colors.accent[700]}
                      />
                    </View>
                    <View style={styles.cardContent}>
                      <ThemedText
                        style={[
                          styles.cardValue,
                          { color: colors.accent[900] },
                        ]}
                      >
                        {isLoading
                          ? "..."
                          : overviewData.totalRevenue >= 1000
                          ? `${formatCurrency(overviewData.totalRevenue, {
                              short: true,
                            })}`
                          : `${formatCurrency(overviewData.totalRevenue)}`}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.cardLabel,
                          { color: colors.accent[600] },
                        ]}
                      >
                        Total Revenue
                      </ThemedText>
                    </View>
                  </TouchableOpacity>

                  {/* Outstanding Debts Card */}
                  <TouchableOpacity
                    style={[
                      styles.overviewCard,
                      {
                        backgroundColor: colors.error[50],
                        borderColor: colors.error[100],
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.cardIcon,
                        { backgroundColor: colors.error[100] },
                      ]}
                    >
                      <IconSymbol
                        name="creditcard"
                        size={wp(32)}
                        color={colors.error[700]}
                      />
                    </View>
                    <View style={styles.cardContent}>
                      <ThemedText
                        style={[styles.cardValue, { color: colors.error[900] }]}
                      >
                        {isLoading
                          ? "..."
                          : overviewData.totalOutstandingDebts >= 1000
                          ? `${formatCurrency(
                              overviewData.totalOutstandingDebts,
                              {
                                short: true,
                              }
                            )}`
                          : `${formatCurrency(
                              overviewData.totalOutstandingDebts
                            )}`}
                      </ThemedText>
                      <ThemedText
                        style={[styles.cardLabel, { color: colors.error[600] }]}
                      >
                        Outstanding Debts
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View
            style={[
              styles.section,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <ThemedText
              style={[
                styles.sectionTitle,
                { color: theme.colors.onBackground },
              ]}
            >
              Quick Actions
            </ThemedText>
            <View style={styles.quickActionsGrid}>
              {renderQuickAction(
                "Add Customer",
                "person.badge.plus",
                theme.colors.primary,
                () => handleQuickAction("add-customer")
              )}
              {renderQuickAction(
                "Record Sale",
                "doc.text",
                theme.colors.secondary,
                () => handleQuickAction("record-sale")
              )}
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.recentActivityContainer}>
            <View style={styles.sectionHeader}>
              <ThemedText
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.onBackground },
                ]}
              >
                Recent Customers
              </ThemedText>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/customers")}
              >
                <ThemedText
                  style={[styles.seeAllText, { color: theme.colors.primary }]}
                >
                  See All
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Recent Customers */}
            <View style={styles.customersSection}>
              {customersLoading ? (
                <View style={styles.loadingContainer}>
                  <ThemedText
                    style={[
                      styles.loadingText,
                      { color: colors.paper.onSurfaceVariant },
                    ]}
                  >
                    Loading customers...
                  </ThemedText>
                </View>
              ) : customers && customers.length > 0 ? (
                <>
                  {customers.slice(0, 3).map((customer) => (
                    <CustomerCard
                      key={customer.id}
                      customer={customer}
                      onPress={() => router.push(`/customer/${customer.id}`)}
                      testID={`home-customer-${customer.id}`}
                    />
                  ))}
                  <View style={styles.viewAllContainer}>
                    <Button
                      mode="text"
                      onPress={() => router.push("/(tabs)/customers")}
                      labelStyle={{
                        color: colors.primary[600],
                        fontSize: fontSize(16),
                      }}
                    >
                      View All Customers
                    </Button>
                  </View>
                </>
              ) : (
                <View style={styles.emptyCustomers}>
                  <ThemedText
                    style={[
                      styles.emptyText,
                      { color: colors.paper.onSurfaceVariant },
                    ]}
                  >
                    No customers yet
                  </ThemedText>
                  <Button
                    mode="contained"
                    onPress={() => router.push("/customer/add")}
                    style={styles.addCustomerButton}
                  >
                    Add First Customer
                  </Button>
                </View>
              )}
            </View>
          </View>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: wp(20),
    elevation: 2,
    shadowOffset: {
      width: 3,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowColor: "#000",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(12),
  },
  avatar: {
    width: wp(50),
    height: hp(50),
    borderRadius: wp(25),
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
    padding: wp(8),
    borderRadius: wp(20),
  },
  section: {
    paddingHorizontal: wp(20),
    paddingVertical: hp(20),
  },
  sectionTitle: {
    fontSize: fontSize(18),
    fontWeight: "600",
    marginBottom: 16,
  },
  overviewContainer: {
    marginBottom: 8,
  },
  overviewCards: {
    flexDirection: "column",
    gap: wp(20),
    marginTop: 8,
  },
  topRow: {
    flexDirection: "row",
    gap: wp(16),
  },
  bottomRow: {
    flexDirection: "row",
    gap: wp(16),
  },
  overviewCard: {
    flex: 1,
    padding: wp(24),
    borderRadius: wp(16),
    borderWidth: 1,
    alignItems: "center",
    minHeight: hp(140),
    justifyContent: "center",
    gap: wp(16),
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardIcon: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(24),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: wp(12),
  },
  cardContent: {
    alignItems: "center",
  },
  cardValue: {
    fontSize: wp(24),
    fontWeight: "bold",
    marginBottom: wp(6),
  },
  cardLabel: {
    fontSize: wp(12),
    textAlign: "center",
    lineHeight: wp(18),
    fontWeight: "500",
  },
  quickActionsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    padding: wp(24),
    borderRadius: wp(16),
    alignItems: "center",
    justifyContent: "center",
    minHeight: hp(120),
    gap: wp(12),
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
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: wp(16),
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  seeAllText: {
    fontSize: fontSize(14),
    fontWeight: "600",
  },
  activityList: {
    gap: wp(16),
    padding: wp(16),
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(12),
    padding: wp(12),
    borderRadius: wp(8),
    borderWidth: 1,
    borderColor: "transparent",
  },
  activityIcon: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
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
  exampleContainer: {
    backgroundColor: "lightgray",
  },
  exampleText: {
    fontSize: fontSize(16),
    textAlign: "center",
  },
  searchSection: {
    paddingHorizontal: wp(16),
    paddingBottom: hp(16),
  },
  searchbar: {
    elevation: 0,
    borderRadius: 25,
  },
  customersSection: {
    paddingHorizontal: wp(10),
  },
  viewAllContainer: {
    alignItems: "center",
    paddingVertical: hp(16),
  },
  emptyCustomers: {
    alignItems: "center",
    paddingVertical: hp(40),
    paddingHorizontal: wp(20),
  },
  emptyText: {
    fontSize: fontSize(16),
    marginBottom: 16,
  },
  addCustomerButton: {
    borderRadius: wp(12),
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: hp(40),
    paddingHorizontal: wp(20),
  },
  loadingText: {
    fontSize: fontSize(16),
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(20),
  },
  errorText: {
    fontSize: fontSize(16),
    textAlign: "center",
    marginBottom: hp(20),
  },
  retryButton: {
    marginTop: hp(10),
  },
});
