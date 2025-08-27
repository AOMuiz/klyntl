import { ContactImportButton } from "@/components/ContactImportButton";
import { CustomerCard } from "@/components/CustomerCard";
import { FilterBar } from "@/components/FilterBar";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useCustomers } from "@/hooks/useCustomers";
import { useCustomerFilters } from "@/stores/uiStore";
import { Customer } from "@/types/customer";
import { CustomerFilters, SortOptions } from "@/types/filters";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { FAB, Searchbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CustomerListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  // UI state management
  const { filters, updateFilters } = useCustomerFilters();

  // Use infinite query without pagination state
  const {
    customers,
    totalCount,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
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
    20 // pageSize
  );

  const [refreshing, setRefreshing] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Failed to refresh customers:", error);
      Alert.alert("Error", "Failed to refresh customers");
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleSearch = useCallback(
    (query: string) => {
      updateFilters({ searchQuery: query });
    },
    [updateFilters]
  );

  const handleCustomerPress = (customer: Customer) => {
    router.push(`/customer/${customer.id}`);
  };

  const handleAddCustomer = () => {
    router.push("/customer/add");
  };

  const handleImportComplete = async (result: {
    imported: number;
    skipped: number;
  }) => {
    await refetch(); // Reload the customer list
  };

  const handleFiltersChange = async (
    newFilters: CustomerFilters,
    sort: SortOptions
  ) => {
    updateFilters({
      customerType: newFilters.customerType || "all",
      isActive: newFilters.isActive,
      sortBy: sort.field,
      sortOrder: sort.direction,
    });
  };

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderLoadingFooter = () => {
    if (!isFetchingNextPage) return null;

    return (
      <View style={styles.loadingFooter}>
        <ThemedText style={styles.loadingText}>
          Loading more customers...
        </ThemedText>
      </View>
    );
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
      <View style={styles.emptyActions}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddCustomer}>
          <ThemedText style={styles.addButtonText}>Add Customer</ThemedText>
        </TouchableOpacity>
        <ContactImportButton
          variant="button"
          size="medium"
          onImportComplete={handleImportComplete}
        />
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <ThemedText type="title">Customers</ThemedText>
      <View style={styles.headerInfo}>
        <ThemedText style={styles.customerCount}>
          Showing {customers.length} of {totalCount}{" "}
          {totalCount === 1 ? "customer" : "customers"}
          {customers.length < totalCount && " (scroll for more)"}
        </ThemedText>
        {filters.customerType !== "all" && (
          <ThemedText style={styles.filterDescription}>
            Filtered by: {filters.customerType}
          </ThemedText>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content}>
        {renderHeader()}

        <Searchbar
          placeholder="Search customers..."
          onChangeText={handleSearch}
          value={filters.searchQuery}
          style={styles.searchbar}
        />

        <FilterBar onFiltersChange={handleFiltersChange} />

        {error && (
          <View style={styles.errorState}>
            <ThemedText style={styles.errorText}>
              Error loading customers: {error.message}
            </ThemedText>
            <TouchableOpacity
              onPress={() => refetch()}
              style={styles.retryButton}
            >
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {customers.length === 0 && !isLoading ? (
          renderEmptyState()
        ) : (
          <FlashList
            data={customers}
            renderItem={renderCustomerItem}
            keyExtractor={(item: Customer) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderLoadingFooter}
          />
        )}

        {/* FAB Group for Add and Import actions */}
        <FAB.Group
          visible={true}
          open={fabOpen}
          icon={fabOpen ? "close" : "plus"}
          actions={[
            {
              icon: "account-plus",
              label: "Add Customer",
              onPress: handleAddCustomer,
              color: "#007AFF",
            },
            {
              icon: "account-multiple-plus",
              label: "Import Contacts",
              onPress: async () => {
                try {
                  // For now, show a simple message
                  Alert.alert(
                    "Contact Import",
                    "Contact import functionality will be available soon. For now, you can add customers manually.",
                    [{ text: "OK" }]
                  );
                } catch (error) {
                  console.error("Contact import error:", error);
                  Alert.alert(
                    "Error",
                    "Failed to import contacts. Please try again."
                  );
                }
              },
              color: "#007AFF",
            },
          ]}
          onStateChange={(state: { open: boolean }) => setFabOpen(state.open)}
          style={styles.fabGroup}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fabGroup: {
    position: "absolute",
    bottom: 16,
  },
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
  headerInfo: {
    marginTop: 4,
  },
  customerCount: {
    opacity: 0.7,
    fontSize: 12,
  },
  filterDescription: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
    fontStyle: "italic",
  },
  searchbar: {
    margin: 16,
    marginTop: 8,
  },
  errorState: {
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    color: "#ff4444",
    textAlign: "center",
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
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
  emptyActions: {
    flexDirection: "row",
    gap: 12,
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
  importFab: {
    position: "absolute",
    right: 16,
    bottom: 140, // Position above main FAB
  },
  loadingFooter: {
    padding: 16,
    alignItems: "center",
  },
  loadingText: {
    opacity: 0.7,
  },
});
