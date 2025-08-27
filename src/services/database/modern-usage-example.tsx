import { FlashList } from "@shopify/flash-list";
import React from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { useCustomerStore } from "../../stores/customerStore";
import { useAnalyticsStore } from "../../stores/analyticsStore";

// Example component showing how to use the modern store hooks
const CustomersScreen: React.FC = () => {
  const [loading, setLoading] = React.useState(false);

  // Use the modern store hooks
  const { customers, createCustomer, deleteCustomer, fetchCustomers } = useCustomerStore();
  const { analytics, fetchAnalytics } = useAnalyticsStore();

  const loadCustomers = React.useCallback(async () => {
    setLoading(true);
    try {
      await fetchCustomers();
    } catch (err) {
      console.error("Failed to load customers:", err);
      Alert.alert("Error", "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [fetchCustomers]);

  // Load customers when component mounts
  React.useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleCreateCustomer = async () => {
    try {
      const newCustomer = await createCustomer({
        name: "John Doe",
        phone: "+1234567890",
        email: "john@example.com",
        address: "123 Main St",
      });

      Alert.alert("Success", `Customer ${newCustomer.name} created!`);
    } catch (err) {
      console.error("Failed to create customer:", err);
      Alert.alert("Error", "Failed to create customer");
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this customer?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCustomer(customerId);
              Alert.alert("Success", "Customer deleted!");
            } catch (err) {
              console.error("Failed to delete customer:", err);
              Alert.alert("Error", "Failed to delete customer");
            }
          },
        },
      ]
    );
  };

  const viewAnalytics = async () => {
    try {
      await fetchAnalytics();
      if (analytics) {
        Alert.alert(
          "Analytics",
          `Total Customers: ${analytics.totalCustomers}\n` +
            `Total Revenue: $${analytics.totalRevenue}\n` +
            `Total Transactions: ${analytics.totalTransactions}`
        );
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
      Alert.alert("Error", "Failed to load analytics");
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16 }}>
        Customers ({customers.length})
      </Text>

      <View style={{ flexDirection: "row", marginBottom: 16 }}>
        <TouchableOpacity
          onPress={handleCreateCustomer}
          style={{
            backgroundColor: "#007AFF",
            padding: 12,
            borderRadius: 8,
            marginRight: 8,
            flex: 1,
          }}
        >
          <Text style={{ color: "white", textAlign: "center" }}>
            Add Customer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={viewAnalytics}
          style={{
            backgroundColor: "#34C759",
            padding: 12,
            borderRadius: 8,
            flex: 1,
          }}
        >
          <Text style={{ color: "white", textAlign: "center" }}>
            View Analytics
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text style={{ textAlign: "center" }}>Loading...</Text>
      ) : (
        <FlashList
          data={customers}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: { item: any }) => (
            <View
              style={{
                backgroundColor: "#f0f0f0",
                padding: 16,
                marginBottom: 8,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                {item.name}
              </Text>
              <Text>{item.phone}</Text>
              {item.email && <Text>{item.email}</Text>}
              <Text style={{ marginTop: 8 }}>
                Total Spent: ${item.totalSpent}
              </Text>

              <TouchableOpacity
                onPress={() => handleDeleteCustomer(item.id)}
                style={{
                  backgroundColor: "#FF3B30",
                  padding: 8,
                  borderRadius: 4,
                  marginTop: 8,
                  alignSelf: "flex-start",
                }}
              >
                <Text style={{ color: "white" }}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 32 }}>
              No customers found. Add your first customer!
            </Text>
          }
        />
      )}
    </View>
  );
};

// Example of a complete app structure using modern stores
export const ModernStoreExample: React.FC = () => {
  return <CustomersScreen />;
};

export default ModernStoreExample;
