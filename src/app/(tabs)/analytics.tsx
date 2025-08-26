import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAnalyticsStore } from "@/stores/analyticsStore";
import { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";

const screenWidth = Dimensions.get("window").width;

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme();
  const {
    analytics,
    transactions,
    loading,
    fetchAnalytics,
    fetchTransactions,
    refreshAll,
    clearError,
  } = useAnalyticsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "year"
  >("month");

  // Load data on mount only (no useFocusEffect needed)
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchAnalytics(), // Uses cache if available
        fetchTransactions(), // Uses cache if available
      ]);
    };

    loadInitialData();
    clearError();
  }, [fetchAnalytics, fetchTransactions, clearError]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll(); // Force refresh all data
    setRefreshing(false);
  }, [refreshAll]);

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
  };

  const getTransactionTypeData = () => {
    const saleCount = transactions.filter((t) => t.type === "sale").length;
    const paymentCount = transactions.filter(
      (t) => t.type === "payment"
    ).length;
    const refundCount = transactions.filter((t) => t.type === "refund").length;

    return [
      {
        value: saleCount,
        text: "Sales",
        color: "#34C759",
        textColor: Colors[colorScheme ?? "light"].text,
      },
      {
        value: paymentCount,
        text: "Payments",
        color: "#007AFF",
        textColor: Colors[colorScheme ?? "light"].text,
      },
      {
        value: refundCount,
        text: "Refunds",
        color: "#FF3B30",
        textColor: Colors[colorScheme ?? "light"].text,
      },
    ].filter((item) => item.value > 0);
  };

  const getRevenueData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split("T")[0];
    });

    const revenueByDay = last7Days.map((date, index) => {
      const dayTransactions = transactions.filter(
        (t) => t.date === date && t.type === "sale"
      );
      const revenue = dayTransactions.reduce((sum, t) => sum + t.amount, 0);

      const d = new Date(date);
      const label = d.toLocaleDateString("en-US", { weekday: "short" });

      return {
        value: revenue,
        label: label,
        labelTextStyle: {
          color: colorScheme === "dark" ? "#FFFFFF" : "#000000",
          fontSize: 12,
        },
        dataPointText: revenue > 0 ? `₦${(revenue / 1000).toFixed(0)}k` : "₦0",
      };
    });

    return revenueByDay;
  };

  const getMonthlyBarData = () => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return {
        month: date.toISOString().substr(0, 7), // YYYY-MM format
        label: date.toLocaleDateString("en-US", { month: "short" }),
      };
    });

    const revenueByMonth = last6Months.map(({ month, label }) => {
      const monthTransactions = transactions.filter(
        (t) => t.date.startsWith(month) && t.type === "sale"
      );
      const revenue = monthTransactions.reduce((sum, t) => sum + t.amount, 0);

      return {
        value: revenue,
        label: label,
        labelTextStyle: {
          color: colorScheme === "dark" ? "#FFFFFF" : "#000000",
          fontSize: 12,
        },
        frontColor: "#007AFF",
        topLabelComponent: () => (
          <ThemedText style={{ fontSize: 10, marginBottom: 6 }}>
            {revenue > 0 ? `₦${(revenue / 1000).toFixed(0)}k` : "₦0"}
          </ThemedText>
        ),
      };
    });

    return revenueByMonth;
  };

  const renderStatCard = (
    title: string,
    value: string | number,
    icon: any,
    color: string = "#007AFF",
    subtitle?: string
  ) => (
    <View style={[styles.statCard, { borderColor: color + "30" }]}>
      <View style={styles.statHeader}>
        <View
          style={[styles.statIconContainer, { backgroundColor: color + "20" }]}
        >
          <IconSymbol name={icon} size={20} color={color} />
        </View>
        <View style={styles.statTextContainer}>
          <ThemedText style={styles.statTitle}>{title}</ThemedText>
          {subtitle && (
            <ThemedText style={styles.statSubtitle}>{subtitle}</ThemedText>
          )}
        </View>
      </View>
      <ThemedText style={[styles.statValue, { color }]}>{value}</ThemedText>
    </View>
  );

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(["week", "month", "year"] as const).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive,
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <ThemedText
            style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.periodButtonTextActive,
            ]}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTopCustomers = () => {
    if (!analytics?.topCustomers || analytics.topCustomers.length === 0) {
      return (
        <View style={styles.emptyState}>
          <IconSymbol
            name="person.2"
            size={32}
            color={Colors[colorScheme ?? "light"].tabIconDefault}
          />
          <ThemedText style={{ marginTop: 8, opacity: 0.7 }}>
            No customer data available
          </ThemedText>
        </View>
      );
    }

    return analytics.topCustomers.map((customer, index) => (
      <View key={customer.id} style={styles.customerRow}>
        <View style={styles.customerRank}>
          <ThemedText style={styles.rankNumber}>{index + 1}</ThemedText>
        </View>
        <View style={styles.customerInfo}>
          <ThemedText style={styles.customerName}>{customer.name}</ThemedText>
          <ThemedText style={styles.customerPhone}>{customer.phone}</ThemedText>
        </View>
        <View style={styles.customerAmount}>
          <ThemedText style={styles.spentAmount}>
            {formatCurrency(customer.totalSpent)}
          </ThemedText>
        </View>
      </View>
    ));
  };

  if (loading && !analytics) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText>Loading analytics...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <ThemedText type="title">Analytics</ThemedText>
            <ThemedText style={styles.subtitle}>
              Business insights and performance
            </ThemedText>
          </View>

          {/* Period Selector */}
          {renderPeriodSelector()}

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              {renderStatCard(
                "Customers",
                analytics?.totalCustomers || 0,
                "person.2.fill",
                "#007AFF",
                "Total registered"
              )}
              {renderStatCard(
                "Revenue",
                formatCurrency(analytics?.totalRevenue || 0),
                "dollarsign.circle.fill",
                "#34C759",
                "Total sales"
              )}
            </View>
            <View style={styles.statsRow}>
              {renderStatCard(
                "Transactions",
                analytics?.totalTransactions || 0,
                "list.bullet",
                "#FF9500",
                "Completed"
              )}
              {renderStatCard(
                "Avg. Order",
                analytics?.totalTransactions
                  ? formatCurrency(
                      (analytics.totalRevenue || 0) /
                        analytics.totalTransactions
                    )
                  : formatCurrency(0),
                "chart.bar.fill",
                "#FF3B30",
                "Per transaction"
              )}
            </View>
          </View>

          {/* Revenue Trend Chart */}
          {transactions.length > 0 && (
            <View style={styles.chartContainer}>
              <View style={styles.chartHeader}>
                <ThemedText type="subtitle">Revenue Trend</ThemedText>
                <ThemedText style={styles.chartSubtitle}>
                  Last 7 days
                </ThemedText>
              </View>
              <View style={styles.chartWrapper}>
                <LineChart
                  data={getRevenueData()}
                  width={screenWidth - 48}
                  height={200}
                  curved
                  isAnimated
                  animationDuration={1000}
                  color="#007AFF"
                  thickness={3}
                  dataPointsColor="#007AFF"
                  dataPointsRadius={4}
                  textColor1={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
                  textFontSize={12}
                  hideDataPoints={false}
                  showVerticalLines={false}
                  verticalLinesColor={
                    colorScheme === "dark"
                      ? "rgba(255, 255, 255, 0.3)"
                      : "rgba(0, 0, 0, 0.2)"
                  }
                  rulesColor={
                    colorScheme === "dark"
                      ? "rgba(255, 255, 255, 0.3)"
                      : "rgba(0, 0, 0, 0.2)"
                  }
                  rulesType="solid"
                  initialSpacing={0}
                  endSpacing={0}
                  yAxisColor={
                    colorScheme === "dark"
                      ? "rgba(255, 255, 255, 0.3)"
                      : "rgba(0, 0, 0, 0.2)"
                  }
                  xAxisColor={
                    colorScheme === "dark"
                      ? "rgba(255, 255, 255, 0.3)"
                      : "rgba(0, 0, 0, 0.2)"
                  }
                />
              </View>
            </View>
          )}

          {/* Monthly Bar Chart */}
          {transactions.length > 0 && (
            <View style={styles.chartContainer}>
              <View style={styles.chartHeader}>
                <ThemedText type="subtitle">Monthly Performance</ThemedText>
                <ThemedText style={styles.chartSubtitle}>
                  Last 6 months
                </ThemedText>
              </View>
              <View style={styles.chartWrapper}>
                <BarChart
                  data={getMonthlyBarData()}
                  width={screenWidth - 48}
                  height={200}
                  isAnimated
                  animationDuration={1000}
                  showGradient
                  gradientColor="#007AFF"
                  frontColor="#007AFF"
                  spacing={24}
                  roundedTop
                  roundedBottom
                  hideRules={false}
                  rulesColor={
                    colorScheme === "dark"
                      ? "rgba(255, 255, 255, 0.3)"
                      : "rgba(0, 0, 0, 0.2)"
                  }
                  rulesType="solid"
                  yAxisColor={
                    colorScheme === "dark"
                      ? "rgba(255, 255, 255, 0.3)"
                      : "rgba(0, 0, 0, 0.2)"
                  }
                  xAxisColor={
                    colorScheme === "dark"
                      ? "rgba(255, 255, 255, 0.3)"
                      : "rgba(0, 0, 0, 0.2)"
                  }
                  yAxisTextStyle={{
                    color: colorScheme === "dark" ? "#FFFFFF" : "#000000",
                    fontSize: 12,
                  }}
                  yAxisLabelPrefix="₦"
                  initialSpacing={10}
                  endSpacing={10}
                />
              </View>
            </View>
          )}

          {/* Transaction Types Pie Chart */}
          {transactions.length > 0 && getTransactionTypeData().length > 0 && (
            <View style={styles.chartContainer}>
              <View style={styles.chartHeader}>
                <ThemedText type="subtitle">Transaction Types</ThemedText>
                <ThemedText style={styles.chartSubtitle}>
                  Distribution breakdown
                </ThemedText>
              </View>
              <View style={styles.chartWrapper}>
                <PieChart
                  data={getTransactionTypeData()}
                  radius={80}
                  isAnimated
                  animationDuration={1000}
                  showText
                  textColor={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
                  textSize={12}
                  showTextBackground
                  textBackgroundColor={
                    colorScheme === "dark"
                      ? "rgba(0, 0, 0, 0.7)"
                      : "rgba(255, 255, 255, 0.7)"
                  }
                  textBackgroundRadius={16}
                  showValuesAsLabels
                  labelsPosition="onBorder"
                  centerLabelComponent={() => (
                    <View
                      style={{ justifyContent: "center", alignItems: "center" }}
                    >
                      <ThemedText style={{ fontSize: 16, fontWeight: "bold" }}>
                        {transactions.length}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                        Total
                      </ThemedText>
                    </View>
                  )}
                />
              </View>
            </View>
          )}

          {/* Empty State for No Data */}
          {transactions.length === 0 && (
            <View style={styles.emptyChartState}>
              <IconSymbol
                name="chart.bar.fill"
                size={64}
                color={Colors[colorScheme ?? "light"].tabIconDefault}
              />
              <ThemedText type="subtitle" style={styles.emptyChartTitle}>
                No Data Available
              </ThemedText>
              <ThemedText style={styles.emptyChartSubtitle}>
                Start adding transactions to see detailed analytics and charts
              </ThemedText>
            </View>
          )}

          {/* Top Customers Section */}
          <View style={styles.topCustomersContainer}>
            <View style={styles.chartHeader}>
              <ThemedText type="subtitle">Top Customers</ThemedText>
              <ThemedText style={styles.chartSubtitle}>
                Highest spending customers
              </ThemedText>
            </View>
            {renderTopCustomers()}
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
  },
  periodSelector: {
    flexDirection: "row",
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: "rgba(128, 128, 128, 0.1)",
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  periodButtonActive: {
    backgroundColor: "#007AFF",
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.8,
  },
  periodButtonTextActive: {
    color: "white",
    opacity: 1,
    fontWeight: "600",
  },
  statsGrid: {
    padding: 16,
    paddingTop: 8,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(128, 128, 128, 0.1)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  statTextContainer: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.8,
    textTransform: "uppercase",
  },
  statSubtitle: {
    fontSize: 10,
    opacity: 0.6,
  },
  statValue: {
    fontWeight: "bold",
    fontSize: 20,
  },
  chartContainer: {
    margin: 16,
    marginTop: 8,
    // backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitle: {
    marginBottom: 16,
  },
  chartSubtitle: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  chartWrapper: {
    alignItems: "center",
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  chart: {
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  emptyChartState: {
    padding: 48,
    alignItems: "center",
    margin: 16,
    // backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
  },
  emptyChartTitle: {
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyChartSubtitle: {
    textAlign: "center",
    opacity: 0.7,
    lineHeight: 20,
  },
  topCustomersContainer: {
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.1)",
  },
  customerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rankNumber: {
    color: "white",
    fontWeight: "bold",
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontWeight: "600",
  },
  customerPhone: {
    opacity: 0.7,
    marginTop: 2,
  },
  customerAmount: {
    alignItems: "flex-end",
  },
  spentAmount: {
    fontWeight: "bold",
    color: "#34C759",
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
  },
});
