import { ContactImportButton } from "@/components/ContactImportButton";
import { CustomerCard } from "@/components/CustomerCard";
import { FilterBar } from "@/components/FilterBar";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useCustomerStore } from "@/stores/customerStore";
import { Customer } from "@/types/customer";
import { CustomerFilters, SortOptions } from "@/types/filters";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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

  // Use the store instead of hooks
  const {
    customers,
    loading,
    searchQuery,
    appliedFilterDescription,
    filteredCustomersCount,
    totalCustomersCount,
    hasNextPage,
    loadingMore,
    fetchCustomers,
    searchCustomers,
    setFilters,
    setSortOptions,
    applyFilters,
    importFromContacts,
    checkContactAccess,
    loadMoreCustomers,
    resetPagination,
  } = useCustomerStore();

  const [refreshing, setRefreshing] = useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      await fetchCustomers();
    } catch (error) {
      console.error("Failed to load customers:", error);
      Alert.alert("Error", "Failed to load customers");
    }
  }, [fetchCustomers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCustomers();
    setRefreshing(false);
  }, [loadCustomers]);

  // Load customers on mount only - store will handle updates automatically
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleSearch = useCallback(
    async (query: string) => {
      // Reset pagination when search changes
      resetPagination();

      if (query.trim() === "") {
        await fetchCustomers(); // Get all customers
      } else {
        await searchCustomers(query); // Use store's search function
      }
    },
    [fetchCustomers, searchCustomers, resetPagination]
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
    await loadCustomers(); // Reload the customer list
  };

  const handleFiltersChange = async (
    filters: CustomerFilters,
    sort: SortOptions
  ) => {
    // Reset pagination when filters change
    resetPagination();

    // Update store with new filters and sort options
    setFilters(filters);
    setSortOptions(sort);

    // Apply the filters to get updated customer list
    await applyFilters();

    console.log("Filters applied:", filters, sort);
  };

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !loadingMore) {
      loadMoreCustomers();
    }
  }, [hasNextPage, loadingMore, loadMoreCustomers]);

  const renderLoadingFooter = () => {
    if (!loadingMore) return null;

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

  const [fabOpen, setFabOpen] = useState(false);

  const renderHeader = () => (
    <View style={styles.header}>
      <ThemedText type="title">Customers</ThemedText>
      <View style={styles.headerInfo}>
        <ThemedText style={styles.customerCount}>
          Showing {filteredCustomersCount} of {totalCustomersCount}{" "}
          {totalCustomersCount === 1 ? "customer" : "customers"}
          {hasNextPage && " (loading more as you scroll)"}
        </ThemedText>
        {appliedFilterDescription !== "All customers" && (
          <ThemedText style={styles.filterDescription}>
            {appliedFilterDescription}
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
          value={searchQuery}
          style={styles.searchbar}
        />

        <FilterBar onFiltersChange={handleFiltersChange} />

        {customers.length === 0 && !loading ? (
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
                  // Check current contact access status
                  const accessStatus = await checkContactAccess();

                  let alertTitle = "Import Contacts";
                  let alertMessage =
                    "This will import contacts from your phone. Only Nigerian phone numbers will be imported and duplicates will be skipped.";

                  if (!accessStatus.hasAccess) {
                    alertMessage =
                      "This app needs permission to access your contacts. You'll be prompted to grant permission.";
                  } else if (accessStatus.isLimited) {
                    alertTitle = "Limited Contact Access Detected";
                    alertMessage = `You currently have limited access to contacts (${accessStatus.contactCount} contacts available). You can:\n\n• Import available contacts, or\n• Grant access to more contacts for a better import experience`;
                  } else {
                    alertMessage += `\n\n${accessStatus.contactCount} contacts available for import.`;
                  }

                  const buttons = [];

                  // Cancel button
                  buttons.push({
                    text: "Cancel",
                    style: "cancel" as const,
                  });

                  // If limited access, offer option to grant more access
                  if (accessStatus.isLimited) {
                    buttons.push({
                      text: "Grant More Access",
                      onPress: async () => {
                        try {
                          const result = await importFromContacts(true);
                          await loadCustomers();

                          const message =
                            result.imported > 0
                              ? `Successfully imported ${result.imported} contacts. ${result.skipped} contacts were skipped (duplicates or invalid numbers).`
                              : result.skipped > 0
                              ? `No new contacts imported. ${result.skipped} contacts were skipped (duplicates or invalid numbers). You may still have limited contact access.`
                              : "No contacts found to import.";

                          Alert.alert("Import Complete", message);
                        } catch (error) {
                          Alert.alert(
                            "Import Failed",
                            error instanceof Error
                              ? error.message
                              : "Failed to import contacts"
                          );
                        }
                      },
                    });
                  }

                  // Always offer import option
                  buttons.push({
                    text: accessStatus.isLimited
                      ? "Import Available"
                      : "Import",
                    onPress: async () => {
                      try {
                        const result = await importFromContacts(
                          !accessStatus.isLimited
                        );
                        await loadCustomers();

                        const message =
                          result.imported > 0
                            ? `Successfully imported ${result.imported} contacts. ${result.skipped} contacts were skipped (duplicates or invalid numbers).`
                            : result.skipped > 0
                            ? `No new contacts imported. ${result.skipped} contacts were skipped (duplicates or invalid numbers).`
                            : "No contacts found to import.";

                        Alert.alert("Import Complete", message);
                      } catch (error) {
                        Alert.alert(
                          "Import Failed",
                          error instanceof Error
                            ? error.message
                            : "Failed to import contacts"
                        );
                      }
                    },
                  });

                  Alert.alert(alertTitle, alertMessage, buttons);
                } catch (error) {
                  console.error("Failed to check contact access:", error);
                  Alert.alert(
                    "Error",
                    "Failed to check contact access. Please try again."
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
