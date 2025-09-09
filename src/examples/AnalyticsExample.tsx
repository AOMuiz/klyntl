import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import {
  useAnalytics,
  useCustomerAnalytics,
  useRevenueAnalytics,
} from "../hooks/useAnalytics";

export function AnalyticsExample() {
  const { data: analytics, isLoading, error, refetch } = useAnalytics();
  const { data: customerAnalytics, isLoading: customerLoading } =
    useCustomerAnalytics();
  const { data: revenueAnalytics, isLoading: revenueLoading } =
    useRevenueAnalytics();

  const {
    health,
    isHealthy,
    clearAllData,
    isClearing,
    invalidateAnalytics,
    refreshHealth,
  } = useDatabaseUtils();

  if (error) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Error loading analytics: {error.message}</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        Analytics Dashboard
      </Text>

      {/* Database Health */}
      <View
        style={{
          marginBottom: 20,
          padding: 15,
          backgroundColor: "#f0f0f0",
          borderRadius: 5,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
          Database Health
        </Text>
        <Text>Status: {isHealthy ? "✅ Healthy" : "❌ Unhealthy"}</Text>
        {health && <Text>Message: {health.message}</Text>}
        {health?.customerCount !== undefined && (
          <Text>Customer Count: {health.customerCount}</Text>
        )}
        <TouchableOpacity
          onPress={() => refreshHealth()}
          style={{
            backgroundColor: "#007AFF",
            padding: 10,
            borderRadius: 5,
            marginTop: 10,
          }}
        >
          <Text style={{ color: "white", textAlign: "center" }}>
            Refresh Health
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Analytics */}
      {analytics && (
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
            Overview
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <View
              style={{
                flex: 1,
                minWidth: 150,
                padding: 15,
                backgroundColor: "#e6f7ff",
                borderRadius: 5,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                Total Customers
              </Text>
              <Text style={{ fontSize: 24, color: "#007AFF" }}>
                {analytics.totalCustomers}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                minWidth: 150,
                padding: 15,
                backgroundColor: "#f6ffed",
                borderRadius: 5,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                Total Revenue
              </Text>
              <Text style={{ fontSize: 24, color: "#52c41a" }}>
                ${analytics.totalRevenue.toFixed(2)}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                minWidth: 150,
                padding: 15,
                backgroundColor: "#fff7e6",
                borderRadius: 5,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                Total Transactions
              </Text>
              <Text style={{ fontSize: 24, color: "#fa8c16" }}>
                {analytics.totalTransactions}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Customer Analytics */}
      {customerAnalytics && !customerLoading && (
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
            Customer Analytics
          </Text>
          <Text>Total Customers: {customerAnalytics.totalCustomers}</Text>
          <Text>Top Customers: {customerAnalytics.topCustomers.length}</Text>
        </View>
      )}

      {/* Revenue Analytics */}
      {revenueAnalytics && !revenueLoading && (
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
            Revenue Analytics
          </Text>
          <Text>
            Total Revenue: ${revenueAnalytics.totalRevenue.toFixed(2)}
          </Text>
          <Text>Total Transactions: {revenueAnalytics.totalTransactions}</Text>
          {revenueAnalytics.totalTransactions > 0 && (
            <Text>
              Average Transaction: $
              {(
                revenueAnalytics.totalRevenue /
                revenueAnalytics.totalTransactions
              ).toFixed(2)}
            </Text>
          )}
        </View>
      )}

      {/* Top Customers */}
      {analytics?.topCustomers && analytics.topCustomers.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
            Top Customers
          </Text>
          {analytics.topCustomers.map((customer, index) => (
            <View
              key={customer.id}
              style={{
                padding: 10,
                backgroundColor: "#f9f9f9",
                borderRadius: 5,
                marginBottom: 5,
              }}
            >
              <Text style={{ fontWeight: "bold" }}>
                #{index + 1} {customer.name}
              </Text>
              <Text>${customer.totalSpent.toFixed(2)} spent</Text>
              <Text>{customer.phone}</Text>
              {customer.company && <Text>Company: {customer.company}</Text>}
            </View>
          ))}
        </View>
      )}

      {/* Utility Actions */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
          Utilities
        </Text>
        <View style={{ gap: 10 }}>
          <TouchableOpacity
            onPress={() => invalidateAnalytics()}
            style={{
              backgroundColor: "#52c41a",
              padding: 15,
              borderRadius: 5,
            }}
          >
            <Text style={{ color: "white", textAlign: "center" }}>
              Refresh Analytics
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => refetch()}
            style={{
              backgroundColor: "#1890ff",
              padding: 15,
              borderRadius: 5,
            }}
          >
            <Text style={{ color: "white", textAlign: "center" }}>
              Reload All Data
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (confirm("Are you sure you want to clear all data?")) {
                clearAllData();
              }
            }}
            disabled={isClearing}
            style={{
              backgroundColor: isClearing ? "#ccc" : "#ff4d4f",
              padding: 15,
              borderRadius: 5,
            }}
          >
            <Text style={{ color: "white", textAlign: "center" }}>
              {isClearing ? "Clearing..." : "Clear All Data"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
