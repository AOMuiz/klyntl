import { useState } from "react";
import {
  Alert,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useCustomers } from "../hooks/useCustomers";
import { useCustomerFilters, usePagination } from "../stores/uiStore";
import { CreateCustomerInput } from "../types/customer";

export function CustomerListExample() {
  const { filters, updateFilters } = useCustomerFilters();
  const { pagination, updatePagination } = usePagination();

  const {
    customers,
    totalCount,
    isLoading,
    isFetching,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    isCreating,
    isUpdating,
    isDeleting,
    createSuccess,
    refetch,
  } = useCustomers(
    filters.searchQuery,
    {
      customerType: filters.customerType,
      isActive: filters.isActive,
    },
    {
      field: filters.sortBy as "name" | "totalSpent" | "createdAt",
      direction: filters.sortOrder,
    },
    pagination.customers.page,
    pagination.customers.pageSize
  );

  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");

  const handleCreateCustomer = () => {
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
      Alert.alert("Error", "Please enter name and phone");
      return;
    }

    const customerData: CreateCustomerInput = {
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim(),
      contactSource: "manual",
    };

    createCustomer(customerData);

    // Clear form on success
    if (createSuccess) {
      setNewCustomerName("");
      setNewCustomerPhone("");
    }
  };

  const handleDeleteCustomer = (id: string, name: string) => {
    Alert.alert("Delete Customer", `Are you sure you want to delete ${name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteCustomer(id),
      },
    ]);
  };

  const handleSearchChange = (query: string) => {
    updateFilters({ searchQuery: query });
    // Reset to first page when searching
    updatePagination("customers", { page: 1 });
  };

  const handleLoadMore = () => {
    if (!isFetching && customers.length < totalCount) {
      updatePagination("customers", { page: pagination.customers.page + 1 });
    }
  };

  if (error) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Error: {error.message}</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        Customers ({totalCount})
      </Text>

      {/* Search */}
      <TextInput
        value={filters.searchQuery}
        onChangeText={handleSearchChange}
        placeholder="Search customers..."
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 10,
          marginBottom: 20,
        }}
      />

      {/* Create Customer Form */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
          Add New Customer
        </Text>
        <TextInput
          value={newCustomerName}
          onChangeText={setNewCustomerName}
          placeholder="Customer name"
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            marginBottom: 10,
          }}
        />
        <TextInput
          value={newCustomerPhone}
          onChangeText={setNewCustomerPhone}
          placeholder="Phone number"
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            marginBottom: 10,
          }}
        />
        <TouchableOpacity
          onPress={handleCreateCustomer}
          disabled={isCreating}
          style={{
            backgroundColor: isCreating ? "#ccc" : "#007AFF",
            padding: 15,
            borderRadius: 5,
          }}
        >
          <Text style={{ color: "white", textAlign: "center" }}>
            {isCreating ? "Creating..." : "Add Customer"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Customer List */}
      {isLoading ? (
        <Text>Loading customers...</Text>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={{
                padding: 15,
                borderWidth: 1,
                borderColor: "#eee",
                marginBottom: 10,
                borderRadius: 5,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                {item.name}
              </Text>
              <Text>{item.phone}</Text>
              {item.email && <Text>{item.email}</Text>}
              <Text>Total Spent: ${item.totalSpent}</Text>
              <Text>Type: {item.customerType}</Text>
              <Text>Active: {item.isActive ? "Yes" : "No"}</Text>

              <View style={{ flexDirection: "row", marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() =>
                    updateCustomer({
                      id: item.id,
                      updates: { notes: "Updated via example" },
                    })
                  }
                  disabled={isUpdating}
                  style={{
                    backgroundColor: "#28a745",
                    padding: 10,
                    borderRadius: 5,
                    marginRight: 10,
                  }}
                >
                  <Text style={{ color: "white" }}>
                    {isUpdating ? "Updating..." : "Update"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDeleteCustomer(item.id, item.name)}
                  disabled={isDeleting}
                  style={{
                    backgroundColor: "#dc3545",
                    padding: 10,
                    borderRadius: 5,
                  }}
                >
                  <Text style={{ color: "white" }}>
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() =>
            isFetching ? <Text>Loading more...</Text> : null
          }
        />
      )}
    </View>
  );
}
