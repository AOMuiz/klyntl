import { CustomerCard } from "@/components/CustomerCard";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useCustomers } from "@/services/database/context";
import { Customer } from "@/types/customer";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Searchbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CustomerListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { getCustomers } = useCustomers();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const customerList = await getCustomers();
      setCustomers(customerList);
      setFilteredCustomers(customerList);
    } catch (error) {
      console.error("Failed to load customers:", error);
      Alert.alert("Error", "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [getCustomers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCustomers();
    setRefreshing(false);
  }, [loadCustomers]);

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [loadCustomers])
  );

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (query.trim() === "") {
        setFilteredCustomers(customers);
      } else {
        const filtered = customers.filter(
          (customer) =>
            customer.name.toLowerCase().includes(query.toLowerCase()) ||
            customer.phone.includes(query)
        );
        setFilteredCustomers(filtered);
      }
    },
    [customers]
  );

  const handleCustomerPress = (customer: Customer) => {
    router.push(`/customer/${customer.id}`);
  };

  const handleAddCustomer = () => {
    router.push("/customer/add");
  };

  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <CustomerCard customer={item} onPress={() => handleCustomerPress(item)} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconSymbol
        name="person.2.fill"
        size={64}
        color={Colors[colorScheme ?? "light"].tabIconDefault}
      />
      <ThemedText type="title" style={styles.emptyTitle}>
        No customers yet
      </ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        Add your first customer to get started
      </ThemedText>
      <TouchableOpacity style={styles.addButton} onPress={handleAddCustomer}>
        <ThemedText style={styles.addButtonText}>Add Customer</ThemedText>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <ThemedText type="title">Customers</ThemedText>
      <ThemedText style={styles.customerCount}>
        {filteredCustomers.length}{" "}
        {filteredCustomers.length === 1 ? "customer" : "customers"}
      </ThemedText>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content}>
        {renderHeader()}

        <Searchbar
          placeholder="Search customers..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
        />

        {filteredCustomers.length === 0 && !loading ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredCustomers}
            renderItem={renderCustomerItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        <TouchableOpacity style={styles.fab} onPress={handleAddCustomer}>
          <IconSymbol name="plus" size={24} color="white" />
        </TouchableOpacity>
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
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  customerCount: {
    marginTop: 4,
    opacity: 0.7,
  },
  searchbar: {
    margin: 16,
    marginTop: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    right: 16,
    bottom: 70, // Increased from 16 to avoid tab bar
    backgroundColor: "#007AFF",
    borderRadius: 28,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
