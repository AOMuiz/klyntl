import { ContactImportButton } from "@/components/ContactImportButton";
import { CustomerCard } from "@/components/CustomerCard";
import { FilterBar } from "@/components/FilterBar";
import ScreenContainer from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useContactImport } from "@/hooks/useContactImport";
import { useCustomers } from "@/hooks/useCustomers";
import { useCustomerFilters } from "@/stores/uiStore";
import { Customer } from "@/types/customer";
import {
  CustomerFilters,
  SortOptions,
  getFilterDescription,
} from "@/types/filters";
import { ds, fontSize } from "@/utils/responsive_dimensions_system";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { FAB, Searchbar } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CustomerListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  // UI state management
  const { filters, updateFilters } = useCustomerFilters();

  // Use infinite query without pagination state
  const {
    customers,
    totalCount,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useCustomers(
    filters.searchQuery,
    {
      customerType:
        filters.customerType !== "all" ? filters.customerType : undefined,
      isActive: filters.isActive,
      spendingRange: filters.spendingRange,
      dateRange: filters.dateRange,
      hasTransactions: filters.hasTransactions,
      contactSource:
        filters.contactSource !== "all" ? filters.contactSource : undefined,
      preferredContactMethod:
        filters.preferredContactMethod !== "all"
          ? filters.preferredContactMethod
          : undefined,
    },
    {
      field: filters.sortBy as "name" | "totalSpent" | "createdAt",
      direction: filters.sortOrder,
    },
    20 // pageSize
  );

  const [refreshing, setRefreshing] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const { importFromContacts, isImporting } = useContactImport();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      refetch();
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
    refetch(); // Reload the customer list
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
        size={ds(64)}
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
        <ThemedText style={styles.filterDescription}>
          {getFilterDescription({
            customerType:
              filters.customerType !== "all" ? filters.customerType : undefined,
            spendingRange: filters.spendingRange,
            dateRange: filters.dateRange,
            hasTransactions: filters.hasTransactions,
            isActive: filters.isActive,
            contactSource:
              filters.contactSource !== "all"
                ? filters.contactSource
                : undefined,
            preferredContactMethod:
              filters.preferredContactMethod !== "all"
                ? filters.preferredContactMethod
                : undefined,
          })}
        </ThemedText>
      </View>
    </View>
  );

  return (
    <ScreenContainer
      withPadding={false} // Handle padding manually for different sections
      edges={["left", "right", "top"]} // Standard edges for this screen
    >
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
            Error loading customers:{" "}
            {error instanceof Error
              ? error.message || "An unexpected error occurred"
              : typeof error === "string"
              ? error
              : "An unexpected error occurred"}
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
      {/* <Portal> */}
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
              if (isImporting) {
                Alert.alert(
                  "Import in Progress",
                  "Please wait for the current import to complete."
                );
                return;
              }

              try {
                const result = await importFromContacts(true);

                // Show import results
                Alert.alert(
                  "Import Complete",
                  `Successfully imported ${result.imported} contacts.\n${result.skipped} contacts were skipped.`,
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        // Refresh the customer list
                        refetch();
                        // Close the FAB
                        setFabOpen(false);
                      },
                    },
                  ]
                );
              } catch (error) {
                console.error("Contact import error:", error);
                Alert.alert(
                  "Import Error",
                  error instanceof Error
                    ? error.message
                    : "Failed to import contacts. Please try again."
                );
              }
            },
            color: "#007AFF",
          },
        ]}
        onStateChange={(state: { open: boolean }) => setFabOpen(state.open)}
        style={[
          styles.fabGroup,
          // { bottom: insets.bottom + ds(16) }, // 👈 dynamic padding
        ]}
      />
      {/* </Portal> */}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  fabGroup: {
    bottom: Platform.OS === "ios" ? ds(40) : ds(4),
  },
  header: {
    padding: ds(16),
    paddingBottom: ds(8),
  },
  headerInfo: {
    // marginTop: ds(4),
  },
  customerCount: {
    opacity: 0.7,
    fontSize: fontSize(12),
  },
  filterDescription: {
    fontSize: ds(12, "text"),
    opacity: 0.6,
    marginTop: ds(2),
    fontStyle: "italic",
  },
  searchbar: {
    margin: ds(16),
    marginTop: ds(8),
  },
  errorState: {
    padding: ds(20),
    alignItems: "center",
  },
  errorText: {
    color: "#ff4444",
    textAlign: "center",
    marginBottom: ds(10),
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: ds(20),
    paddingVertical: ds(10),
    borderRadius: ds(8),
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: ds(14, "text"),
  },
  list: {
    flex: 1,
  },
  listContent: {
    marginTop: ds(8),
    paddingBottom: ds(100),
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: ds(32),
  },
  emptyTitle: {
    textAlign: "center",
    marginTop: ds(16),
    marginBottom: ds(8),
  },
  emptySubtitle: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: ds(24),
  },
  emptyActions: {
    flexDirection: "row",
    gap: ds(12),
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: ds(24),
    paddingVertical: ds(12),
    borderRadius: ds(8),
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: ds(16, "text"),
  },
  fab: {
    position: "absolute",
    width: ds(56),
    height: ds(56),
    alignItems: "center",
    justifyContent: "center",
    right: ds(16),
    bottom: ds(70), // Increased from 16 to avoid tab bar
    backgroundColor: "#007AFF",
    borderRadius: ds(28),
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: ds(2) },
    shadowOpacity: 0.25,
    shadowRadius: ds(4),
  },
  importFab: {
    position: "absolute",
    right: ds(16),
    bottom: ds(140), // Position above main FAB
  },
  loadingFooter: {
    padding: ds(16),
    alignItems: "center",
  },
  loadingText: {
    opacity: 0.7,
  },
});
