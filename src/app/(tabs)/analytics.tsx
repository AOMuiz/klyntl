import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAnalytics } from "@/services/database/context";
import { Analytics as AnalyticsType } from "@/types/analytics";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme();
  const { getAnalytics } = useAnalytics();

  const [analytics, setAnalytics] = useState<AnalyticsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [getAnalytics]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  }, [loadAnalytics]);

  useFocusEffect(
    useCallback(() => {
      loadAnalytics();
    }, [loadAnalytics])
  );

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
  };

  const chartConfig = {
    backgroundColor: Colors[colorScheme ?? "light"].background,
    backgroundGradientFrom: Colors[colorScheme ?? "light"].background,
    backgroundGradientTo: Colors[colorScheme ?? "light"].background,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => Colors[colorScheme ?? "light"].text,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#007AFF",
    },
  };

  const renderStatCard = (
    title: string,
    value: string | number,
    icon: any,
    color: string = "#007AFF"
  ) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <IconSymbol name={icon} size={24} color={color} />
        <ThemedText style={styles.statTitle}>{title}</ThemedText>
      </View>
      <ThemedText type="title" style={[styles.statValue, { color }]}>
        {value}
      </ThemedText>
    </View>
  );

  const renderTopCustomers = () => {
    if (!analytics?.topCustomers || analytics.topCustomers.length === 0) {
      return (
        <View style={styles.emptyState}>
          <ThemedText>No customer data available</ThemedText>
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

  const mockChartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        data: [0, 0, 0, 0, analytics?.totalRevenue || 0, 0],
      },
    ],
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
              Business insights at a glance
            </ThemedText>
          </View>

          <View style={styles.statsContainer}>
            {renderStatCard(
              "Total Customers",
              analytics?.totalCustomers || 0,
              "person.2.fill",
              "#007AFF"
            )}
            {renderStatCard(
              "Total Revenue",
              formatCurrency(analytics?.totalRevenue || 0),
              "dollarsign.circle.fill",
              "#34C759"
            )}
            {renderStatCard(
              "Total Transactions",
              analytics?.totalTransactions || 0,
              "list.bullet",
              "#FF9500"
            )}
            {renderStatCard(
              "Average Order",
              analytics?.totalTransactions
                ? formatCurrency(
                    (analytics.totalRevenue || 0) / analytics.totalTransactions
                  )
                : formatCurrency(0),
              "chart.bar.fill",
              "#FF3B30"
            )}
          </View>

          {analytics && analytics.totalRevenue > 0 && (
            <View style={styles.chartContainer}>
              <ThemedText type="subtitle" style={styles.chartTitle}>
                Revenue Trend
              </ThemedText>
              <LineChart
                data={mockChartData}
                width={screenWidth - 32}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
                bezier
              />
            </View>
          )}

          <View style={styles.topCustomersContainer}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Top Customers
            </ThemedText>
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
  statsContainer: {
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statTitle: {
    marginLeft: 8,
    opacity: 0.8,
  },
  statValue: {
    fontWeight: "bold",
    fontSize: 24,
  },
  chartContainer: {
    padding: 16,
    marginTop: 8,
  },
  chartTitle: {
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
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
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
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
