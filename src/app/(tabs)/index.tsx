import { ContactImportButton } from "@/components/ContactImportButton";
import { CustomerCard } from "@/components/CustomerCard";
import { FilterBar } from "@/components/FilterBar";
import ScreenContainer from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useContactImport } from "@/hooks/useContactImport";
import { useContactPicker } from "@/hooks/useContactPicker";
import { useCustomers } from "@/hooks/useCustomers";
import { useDatabase } from "@/services/database";
import { createDatabaseService } from "@/services/database/service";
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
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { FAB, Searchbar } from "react-native-paper";

export default function CustomerListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  // Contact picker hook (single instance)
  const contactPicker = useContactPicker();

  // UI state management
  const { filters, updateFilters } = useCustomerFilters();

  // Database service for dev operations
  const { db } = useDatabase();
  const databaseService = createDatabaseService(db);

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
  const { isImporting, importSelectedContacts } = useContactImport();
  // Memoized existing phone numbers for duplicate checking
  const existingPhones = useMemo(() => {
    return customers
      .filter((c) => c.phone)
      .map((c) => c.phone.replace(/\D/g, ""));
  }, [customers]);

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

  // Handle contact selection from picker
  const handleContactsSelected = async (selectedContacts: any[]) => {
    try {
      if (selectedContacts.length === 0) {
        Alert.alert("No Selection", "No contacts were selected for import.");
        return;
      }

      const result = await importSelectedContacts(selectedContacts);
      handleImportComplete(result);
    } catch (error) {
      Alert.alert(
        "Import Failed",
        error instanceof Error
          ? error.message
          : "Failed to import selected contacts"
      );
    }
  };

  const handleImportComplete = async (result: {
    imported: number;
    skipped: number;
    totalProcessed: number;
    errors: string[];
  }) => {
    // Show detailed import results
    let message = `Import completed!\n\n`;
    message += `• Imported: ${result.imported} customers\n`;
    message += `• Skipped: ${result.skipped} contacts\n`;
    message += `• Total processed: ${result.totalProcessed} contacts`;

    if (result.errors.length > 0) {
      message += `\n\nSome errors occurred:\n${result.errors
        .slice(0, 3)
        .join("\n")}`;
      if (result.errors.length > 3) {
        message += `\n... and ${result.errors.length - 3} more errors`;
      }
    }

    Alert.alert("Import Results", message, [
      {
        text: "OK",
        onPress: () => {
          refetch(); // Reload the customer list
        },
      },
    ]);
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

  // Dev mode function to clear database
  const handleClearDatabase = useCallback(async () => {
    Alert.alert(
      "Clear Database",
      "This will delete ALL customers and transactions. This action cannot be undone. Are you sure?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear Database",
          style: "destructive",
          onPress: async () => {
            try {
              await databaseService.clearAllData();
              Alert.alert("Success", "Database cleared successfully!");
              // Refresh the customer list
              refetch();
            } catch (error) {
              console.error("Failed to clear database:", error);
              Alert.alert(
                "Error",
                "Failed to clear database. Please try again."
              );
            }
          },
        },
      ]
    );
  }, [databaseService, refetch]);

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
          maxImportCount={50} // Limit initial imports in empty state
          importMode="limited"
          showSelectOption={true} // Enable contact picker
          onImportComplete={handleImportComplete}
        />
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTitleRow}>
        <ThemedText type="title">Customers</ThemedText>
        {__DEV__ && (
          <TouchableOpacity
            style={styles.clearDbButton}
            onPress={handleClearDatabase}
            testID="clear-database-button"
          >
            <IconSymbol name="trash.fill" size={16} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>
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
            onPress: () => {
              if (isImporting) {
                Alert.alert(
                  "Import in Progress",
                  "Please wait for the current import to complete."
                );
                return;
              }

              // Use the contact picker for selective import
              contactPicker.showContactPicker({
                existingPhones,
                maxSelection: 100,
                onContactsSelected: handleContactsSelected,
              });
              setFabOpen(false);
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

      {contactPicker.ContactPickerComponent()}
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
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  clearDbButton: {
    marginLeft: ds(8),
    padding: ds(4),
    borderRadius: ds(4),
    backgroundColor: "rgba(255, 59, 48, 0.1)",
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
