import { CustomerCard } from "@/components/CustomerCard";
import { FilterModal, FilterOptions } from "@/components/FilterModal";
import { ExtendedKlyntlTheme, useKlyntlColors } from "@/constants/KlyntlTheme";
import { useCustomers } from "@/hooks/useCustomers";
import { SortOptions, getFilterDescription } from "@/types/filters";
import { wp } from "@/utils/responsive_dimensions_system";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Divider,
  IconButton,
  Menu,
  Searchbar,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

type SortOption = "name" | "totalSpent" | "lastPurchase" | "createdAt";
type SortDirection = "asc" | "desc";

export default function CustomersScreen() {
  const router = useRouter();
  const theme = useTheme<ExtendedKlyntlTheme>();
  const colors = useKlyntlColors(theme);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

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

  const handleCustomerPress = (customerId: string) => {
    router.push(`/customer/${customerId}`);
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
    return (
      filters.customerType !== "all" ||
      filters.hasTransactions !== undefined ||
      filters.isActive !== undefined ||
      filters.contactSource !== "all" ||
      filters.spendingRange !== undefined ||
      filters.dateRange !== undefined
    );
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
            size={24}
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
            <Text variant="bodySmall" style={{ color: colors.primary[600] }}>
              {getFilterDescription(filters)}
            </Text>
            <Button
              mode="text"
              compact
              onPress={() =>
                handleFiltersChange(
                  { customerType: "all" },
                  { field: "name", direction: "asc" }
                )
              }
              labelStyle={{ color: colors.primary[600], fontSize: 12 }}
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
                labelStyle={{ color: colors.primary[600], fontSize: 14 }}
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
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } =
              nativeEvent;
            const paddingToBottom = 20;
            if (
              layoutMeasurement.height + contentOffset.y >=
              contentSize.height - paddingToBottom
            ) {
              // Load more if available
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }
          }}
          scrollEventThrottle={400}
        >
          {isLoading ? (
            <View style={styles.centerContainer}>
              <Text
                variant="bodyLarge"
                style={{ color: colors.paper.onSurfaceVariant }}
              >
                Loading customers...
              </Text>
            </View>
          ) : filteredCustomers.length === 0 ? (
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
          ) : (
            <>
              {filteredCustomers.map((customer) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  onPress={() => handleCustomerPress(customer.id)}
                  testID={`customer-card-${customer.id}`}
                />
              ))}
              {isFetchingNextPage && (
                <View style={styles.loadingMore}>
                  <Text
                    variant="bodyMedium"
                    style={{ color: colors.paper.onSurfaceVariant }}
                  >
                    Loading more customers...
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Filter Modal */}
        <FilterModal
          visible={filterVisible}
          onDismiss={() => setFilterVisible(false)}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          sortOptions={sortOptions}
        />
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
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 16,
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 8,
    backgroundColor: "rgba(52, 168, 83, 0.05)",
    borderRadius: 8,
  },
  resultsInfo: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  sortButtonContent: {
    flexDirection: "row-reverse",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
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
    padding: 16,
    alignItems: "center",
  },
  retryButton: {
    marginTop: 8,
  },
  loadingMore: {
    padding: 16,
    alignItems: "center",
  },
});
