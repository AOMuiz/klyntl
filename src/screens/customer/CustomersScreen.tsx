import { CustomerCard } from "@/components/CustomerCard";
import { FilterModal, FilterOptions } from "@/components/FilterModal";
import { ExtendedKlyntlTheme, useKlyntlColors } from "@/constants/KlyntlTheme";
import { useContactImport } from "@/hooks/useContactImport";
import { useContactPicker } from "@/hooks/useContactPicker";
import { useCustomers } from "@/hooks/useCustomers";
import {
  SortOptions,
  areFiltersEmpty,
  getFilterDescription,
} from "@/types/filters";
import { fontSize, hp, wp } from "@/utils/responsive_dimensions_system";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import {
  Button,
  Divider,
  FAB,
  IconButton,
  Menu,
  Searchbar,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

type SortOption = "name" | "totalSpent" | "lastPurchase" | "createdAt";

export default function CustomersScreen() {
  const router = useRouter();
  const theme = useTheme<ExtendedKlyntlTheme>();
  const colors = useKlyntlColors(theme);
  const { importFromContacts, importSelectedContacts, isImporting } =
    useContactImport();
  const contactPicker = useContactPicker();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  // Enhanced filter state using the original filter types
  const [filters, setFilters] = useState<FilterOptions>({
    customerType: "all",
  });

  const [sortOptions, setSortOptions] = useState<SortOptions>({
    field: "name",
    direction: "asc",
  });

  // Use the enhanced useCustomers hook with all filter parameters
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
    searchQuery,
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
    sortOptions,
    20 // pageSize
  );

  // Apply additional client-side filtering for complex logic
  const filteredCustomers = useMemo(() => {
    let filtered = customers || [];

    // Apply client-side search if the server doesn't handle it
    if (searchQuery && (!customers || customers.length === 0)) {
      filtered = filtered.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.phone.includes(searchQuery)
      );
    }

    return filtered;
  }, [customers, searchQuery]);

  // Memoized existing phone numbers for duplicate checking
  const existingPhones = useMemo(() => {
    return (customers || [])
      .filter((c) => c.phone)
      .map((c) => c.phone.replace(/\D/g, ""));
  }, [customers]);

  const handleCustomerPress = (customerId: string) => {
    router.push(`/customer/${customerId}`);
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

  const handleImportContacts = async () => {
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
  };
  const handleFiltersChange = (
    newFilters: FilterOptions,
    newSort: SortOptions
  ) => {
    setFilters(newFilters);
    setSortOptions(newSort);
    // The useCustomers hook will automatically refetch with new parameters
  };

  const handleSort = (option: SortOption) => {
    const newSort: SortOptions = {
      field: option,
      direction:
        sortOptions.field === option && sortOptions.direction === "asc"
          ? "desc"
          : "asc",
    };
    setSortOptions(newSort);
    setSortMenuVisible(false);
  };

  const getSortLabel = () => {
    const labels = {
      name: "Name",
      totalSpent: "Total Spent",
      lastPurchase: "Last Purchase",
      createdAt: "Date Added",
    };
    return `Sort by ${labels[sortOptions.field as keyof typeof labels]} ${
      sortOptions.direction === "desc" ? "↓" : "↑"
    }`;
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return !areFiltersEmpty(filters);
  }, [filters]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.paper.background }]}
    >
      <Surface style={styles.surface} elevation={0}>
        {/* Header */}
        <View style={styles.header}>
          <Text
            variant="headlineLarge"
            style={[styles.title, { color: colors.paper.onBackground }]}
          >
            Customers
          </Text>
        </View>

        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search customers..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[
              styles.searchbar,
              { backgroundColor: colors.paper.surfaceVariant },
            ]}
            inputStyle={{ color: colors.paper.onSurfaceVariant }}
            placeholderTextColor={colors.paper.onSurfaceVariant}
            iconColor={colors.paper.onSurfaceVariant}
          />
          <IconButton
            icon="tune"
            size={wp(28)}
            onPress={() => setFilterVisible(true)}
            style={[
              styles.filterButton,
              {
                backgroundColor: hasActiveFilters
                  ? colors.primary[100]
                  : colors.paper.surfaceVariant,
              },
            ]}
            iconColor={
              hasActiveFilters
                ? colors.primary[700]
                : colors.paper.onSurfaceVariant
            }
          />
        </View>

        {/* Filter Status Bar */}
        {hasActiveFilters && (
          <View style={styles.filterStatusBar}>
            <Text
              variant="bodySmall"
              style={[
                styles.filterDescriptionText,
                { color: colors.primary[600] },
              ]}
            >
              {getFilterDescription(filters)}
            </Text>
            <Button
              mode="text"
              compact
              onPress={() =>
                handleFiltersChange(
                  {
                    customerType: "all",
                    hasTransactions: undefined,
                    isActive: undefined,
                    contactSource: "all",
                    spendingRange: undefined,
                    dateRange: undefined,
                    preferredContactMethod: undefined,
                  },
                  { field: "name", direction: "asc" }
                )
              }
              labelStyle={[
                { color: colors.primary[600], fontSize: fontSize(12) },
              ]}
              contentStyle={styles.clearFiltersButtonContent}
            >
              Clear Filters
            </Button>
          </View>
        )}

        {/* Results Info */}
        <View style={styles.resultsInfo}>
          <Text
            variant="bodyMedium"
            style={{ color: colors.paper.onSurfaceVariant }}
          >
            Showing {filteredCustomers.length} of {totalCount || 0} customers
            {filteredCustomers.length < (totalCount || 0) &&
              " (scroll for more)"}
          </Text>
        </View>

        {/* Sort and List Header */}
        <View style={styles.listHeader}>
          <Text
            variant="titleMedium"
            style={{ color: colors.paper.onBackground }}
          >
            All customers
          </Text>
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <Button
                mode="text"
                onPress={() => setSortMenuVisible(true)}
                contentStyle={styles.sortButtonContent}
                labelStyle={{
                  color: colors.primary[600],
                  fontSize: fontSize(14),
                }}
              >
                {getSortLabel()}
              </Button>
            }
            contentStyle={{ backgroundColor: colors.paper.surface }}
          >
            <Menu.Item
              onPress={() => handleSort("name")}
              title="Name"
              titleStyle={{ color: colors.paper.onSurface }}
            />
            <Menu.Item
              onPress={() => handleSort("totalSpent")}
              title="Total Spent"
              titleStyle={{ color: colors.paper.onSurface }}
            />
            <Menu.Item
              onPress={() => handleSort("lastPurchase")}
              title="Last Purchase"
              titleStyle={{ color: colors.paper.onSurface }}
            />
            <Menu.Item
              onPress={() => handleSort("createdAt")}
              title="Date Added"
              titleStyle={{ color: colors.paper.onSurface }}
            />
          </Menu>
        </View>

        <Divider />

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Text variant="bodyLarge" style={{ color: colors.error[600] }}>
              Error loading customers:{" "}
              {error instanceof Error ? error.message : "Unknown error"}
            </Text>
            <Button
              mode="outlined"
              onPress={() => refetch()}
              style={styles.retryButton}
            >
              Retry
            </Button>
          </View>
        )}

        {/* Customer List */}
        <FlashList
          data={filteredCustomers}
          renderItem={({ item: customer }) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onPress={() => handleCustomerPress(customer.id)}
              testID={`customer-card-${customer.id}`}
            />
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.1}
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.centerContainer}>
                <Text
                  variant="bodyLarge"
                  style={{ color: colors.paper.onSurfaceVariant }}
                >
                  Loading customers...
                </Text>
              </View>
            ) : (
              <View style={styles.centerContainer}>
                <Text
                  variant="bodyLarge"
                  style={{ color: colors.paper.onSurfaceVariant }}
                >
                  {searchQuery || hasActiveFilters
                    ? "No customers match your filters"
                    : "No customers yet"}
                </Text>
                {!searchQuery && !hasActiveFilters && (
                  <Button
                    mode="contained"
                    onPress={() => router.push("/customer/add")}
                    style={styles.addButton}
                  >
                    Add First Customer
                  </Button>
                )}
              </View>
            )
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.loadingMore}>
                <Text
                  variant="bodyMedium"
                  style={{ color: colors.paper.onSurfaceVariant }}
                >
                  Loading more customers...
                </Text>
              </View>
            ) : null
          }
        />

        {/* Filter Modal */}
        <FilterModal
          visible={filterVisible}
          onDismiss={() => setFilterVisible(false)}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          sortOptions={sortOptions}
        />

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
              color: colors.primary[600],
            },
            {
              icon: "account-multiple-plus",
              label: "Import Contacts",
              onPress: handleImportContacts,
              color: colors.primary[600],
            },
          ]}
          onStateChange={(state: { open: boolean }) => setFabOpen(state.open)}
          style={styles.fabGroup}
          color={`${colors.paper.onPrimary}`}
          fabStyle={{ backgroundColor: colors.primary[600] }}
        />

        {/* Contact Picker Component */}
        {contactPicker.ContactPickerComponent()}
      </Surface>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  surface: {
    flex: 1,
    paddingHorizontal: wp(16),
  },
  header: {
    paddingVertical: hp(16),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  searchbar: {
    flex: 1,
    elevation: 0,
  },
  filterButton: {
    margin: 0,
  },
  filterStatusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: hp(6),
    paddingHorizontal: wp(12),
    marginBottom: hp(8),
    backgroundColor: "rgba(52, 168, 83, 0.05)",
    borderRadius: wp(8),
  },
  clearFiltersButtonContent: {
    paddingHorizontal: wp(8),
    paddingVertical: hp(4),
  },
  filterDescriptionText: {
    flex: 1,
    flexWrap: "wrap",
    marginRight: wp(8),
  },
  resultsInfo: {
    paddingVertical: hp(8),
    paddingHorizontal: wp(4),
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: hp(16),
  },
  sortButtonContent: {
    flexDirection: "row-reverse",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(16),
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: wp(32),
  },
  addButton: {
    marginTop: 16,
  },
  errorContainer: {
    padding: wp(16),
    alignItems: "center",
  },
  retryButton: {
    marginTop: 8,
  },
  loadingMore: {
    padding: wp(16),
    alignItems: "center",
  },
  fabGroup: {
    position: "absolute",
    right: wp(16),
    bottom: hp(16),
  },
});
