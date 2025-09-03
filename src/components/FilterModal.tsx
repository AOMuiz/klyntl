import { ExtendedKlyntlTheme, useKlyntlColors } from "@/constants/KlyntlTheme";
import {
  CUSTOMER_FILTER_PRESETS,
  CustomerFilters,
  SortOptions,
} from "@/types/filters";
import { hp, wp } from "@/utils/responsive_dimensions_system";
import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Chip,
  Divider,
  IconButton,
  Modal,
  Portal,
  Surface,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

export type FilterOptions = CustomerFilters;

interface FilterModalProps {
  visible: boolean;
  onDismiss: () => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions, sort: SortOptions) => void;
  sortOptions: SortOptions;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onDismiss,
  filters,
  onFiltersChange,
  sortOptions,
}) => {
  const theme = useTheme<ExtendedKlyntlTheme>();
  const colors = useKlyntlColors(theme);
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);
  const [localSort, setLocalSort] = useState<SortOptions>(sortOptions);

  const handleApply = () => {
    onFiltersChange(localFilters, localSort);
    onDismiss();
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      customerType: "all",
    };
    const resetSort: SortOptions = {
      field: "name",
      direction: "asc",
    };
    setLocalFilters(resetFilters);
    setLocalSort(resetSort);
  };

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSortChange = (field: SortOptions["field"]) => {
    setLocalSort((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handlePresetApply = (presetId: string) => {
    const preset = CUSTOMER_FILTER_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setLocalFilters(preset.filters as FilterOptions);
      if (preset.sort) {
        setLocalSort(preset.sort);
      }
    }
  };

  const updateSpendingRange = (type: "min" | "max", value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    setLocalFilters((prev) => ({
      ...prev,
      spendingRange: {
        min: type === "min" ? numValue || 0 : prev.spendingRange?.min || 0,
        max:
          type === "max"
            ? numValue || Number.MAX_SAFE_INTEGER
            : prev.spendingRange?.max || Number.MAX_SAFE_INTEGER,
      },
    }));
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.container,
          { backgroundColor: colors.paper.surface },
        ]}
      >
        <Surface style={styles.surface} elevation={0}>
          {/* Header */}
          <View style={styles.header}>
            <Text
              variant="headlineSmall"
              style={[styles.title, { color: colors.paper.onSurface }]}
            >
              Filter & Sort
            </Text>
            <IconButton
              icon="close"
              size={24}
              onPress={onDismiss}
              iconColor={colors.paper.onSurface}
            />
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Quick Presets */}
            <View style={styles.section}>
              <Text
                variant="titleMedium"
                style={[styles.sectionTitle, { color: colors.paper.onSurface }]}
              >
                Quick Filters
              </Text>
              <View style={styles.chipContainer}>
                {CUSTOMER_FILTER_PRESETS.map((preset) => (
                  <Chip
                    key={preset.id}
                    onPress={() => handlePresetApply(preset.id)}
                    style={[
                      styles.chip,
                      { backgroundColor: colors.primary[50] },
                    ]}
                    textStyle={{ color: colors.primary[700], fontSize: 12 }}
                    mode="outlined"
                  >
                    {preset.name}
                  </Chip>
                ))}
              </View>
            </View>

            <Divider
              style={{
                backgroundColor: colors.paper.outline,
                marginVertical: 16,
              }}
            />

            {/* Customer Type Filter */}
            <View style={styles.section}>
              <Text
                variant="titleMedium"
                style={[styles.sectionTitle, { color: colors.paper.onSurface }]}
              >
                Customer Type
              </Text>
              <View style={styles.chipContainer}>
                {[
                  { key: "all", label: "All Types" },
                  { key: "individual", label: "Individual" },
                  { key: "business", label: "Business" },
                ].map((item) => (
                  <Chip
                    key={item.key}
                    selected={localFilters.customerType === item.key}
                    onPress={() => handleFilterChange("customerType", item.key)}
                    style={[
                      styles.chip,
                      localFilters.customerType === item.key && {
                        backgroundColor: colors.primary[100],
                      },
                    ]}
                    textStyle={{
                      color:
                        localFilters.customerType === item.key
                          ? colors.primary[700]
                          : colors.paper.onSurface,
                    }}
                  >
                    {item.label}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Spending Range */}
            <View style={styles.section}>
              <Text
                variant="titleMedium"
                style={[styles.sectionTitle, { color: colors.paper.onSurface }]}
              >
                Spending Range (₦)
              </Text>
              <View style={styles.rangeContainer}>
                <TextInput
                  mode="outlined"
                  label="Min amount"
                  value={localFilters.spendingRange?.min?.toString() || ""}
                  onChangeText={(value) => updateSpendingRange("min", value)}
                  keyboardType="numeric"
                  style={styles.rangeInput}
                  dense
                />
                <Text
                  style={[
                    styles.rangeSeparator,
                    { color: colors.paper.onSurface },
                  ]}
                >
                  -
                </Text>
                <TextInput
                  mode="outlined"
                  label="Max amount"
                  value={
                    localFilters.spendingRange?.max === Number.MAX_SAFE_INTEGER
                      ? ""
                      : localFilters.spendingRange?.max?.toString() || ""
                  }
                  onChangeText={(value) => updateSpendingRange("max", value)}
                  keyboardType="numeric"
                  style={styles.rangeInput}
                  dense
                />
              </View>
            </View>

            {/* Purchase History */}
            <View style={styles.section}>
              <Text
                variant="titleMedium"
                style={[styles.sectionTitle, { color: colors.paper.onSurface }]}
              >
                Purchase History
              </Text>
              <View style={styles.chipContainer}>
                {[
                  { key: undefined, label: "All Customers" },
                  { key: true, label: "Has Purchases" },
                  { key: false, label: "No Purchases" },
                ].map((item) => (
                  <Chip
                    key={item.label}
                    selected={localFilters.hasTransactions === item.key}
                    onPress={() =>
                      handleFilterChange("hasTransactions", item.key)
                    }
                    style={[
                      styles.chip,
                      localFilters.hasTransactions === item.key && {
                        backgroundColor: colors.primary[100],
                      },
                    ]}
                    textStyle={{
                      color:
                        localFilters.hasTransactions === item.key
                          ? colors.primary[700]
                          : colors.paper.onSurface,
                    }}
                  >
                    {item.label}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Contact Source */}
            <View style={styles.section}>
              <Text
                variant="titleMedium"
                style={[styles.sectionTitle, { color: colors.paper.onSurface }]}
              >
                Contact Source
              </Text>
              <View style={styles.chipContainer}>
                {[
                  { key: "all", label: "All Sources" },
                  { key: "manual", label: "Manual Entry" },
                  { key: "imported", label: "Imported" },
                  { key: "updated", label: "Updated" },
                ].map((item) => (
                  <Chip
                    key={item.key}
                    selected={localFilters.contactSource === item.key}
                    onPress={() =>
                      handleFilterChange("contactSource", item.key)
                    }
                    style={[
                      styles.chip,
                      localFilters.contactSource === item.key && {
                        backgroundColor: colors.primary[100],
                      },
                    ]}
                    textStyle={{
                      color:
                        localFilters.contactSource === item.key
                          ? colors.primary[700]
                          : colors.paper.onSurface,
                    }}
                  >
                    {item.label}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Customer Status */}
            <View style={styles.section}>
              <Text
                variant="titleMedium"
                style={[styles.sectionTitle, { color: colors.paper.onSurface }]}
              >
                Customer Status
              </Text>
              <View style={styles.chipContainer}>
                {[
                  { key: undefined, label: "All Customers" },
                  { key: true, label: "Active" },
                  { key: false, label: "Inactive" },
                ].map((item) => (
                  <Chip
                    key={item.label}
                    selected={localFilters.isActive === item.key}
                    onPress={() => handleFilterChange("isActive", item.key)}
                    style={[
                      styles.chip,
                      localFilters.isActive === item.key && {
                        backgroundColor: colors.primary[100],
                      },
                    ]}
                    textStyle={{
                      color:
                        localFilters.isActive === item.key
                          ? colors.primary[700]
                          : colors.paper.onSurface,
                    }}
                  >
                    {item.label}
                  </Chip>
                ))}
              </View>
            </View>

            <Divider
              style={{
                backgroundColor: colors.paper.outline,
                marginVertical: 16,
              }}
            />

            {/* Sort Options */}
            <View style={styles.section}>
              <Text
                variant="titleMedium"
                style={[styles.sectionTitle, { color: colors.paper.onSurface }]}
              >
                Sort By
              </Text>
              <View style={styles.chipContainer}>
                {[
                  { key: "name", label: "Name" },
                  { key: "totalSpent", label: "Total Spent" },
                  { key: "createdAt", label: "Date Added" },
                  { key: "lastPurchase", label: "Last Purchase" },
                ].map((item) => (
                  <Chip
                    key={item.key}
                    selected={localSort.field === item.key}
                    onPress={() =>
                      handleSortChange(item.key as SortOptions["field"])
                    }
                    style={[
                      styles.chip,
                      localSort.field === item.key && {
                        backgroundColor: colors.secondary[100],
                      },
                    ]}
                    textStyle={{
                      color:
                        localSort.field === item.key
                          ? colors.secondary[700]
                          : colors.paper.onSurface,
                    }}
                    icon={
                      localSort.field === item.key
                        ? localSort.direction === "asc"
                          ? "arrow-up"
                          : "arrow-down"
                        : undefined
                    }
                  >
                    {item.label}
                  </Chip>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={handleReset}
              style={[styles.button, { borderColor: colors.paper.outline }]}
              labelStyle={{ color: colors.paper.onSurface }}
            >
              Reset
            </Button>
            <Button
              mode="contained"
              onPress={handleApply}
              style={[styles.button, { backgroundColor: colors.primary[600] }]}
              labelStyle={{ color: colors.paper.onPrimary }}
            >
              Apply Filters
            </Button>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 20,
    borderRadius: 20,
    // maxHeight: "85%",
  },
  surface: {
    padding: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: wp(24),
    paddingVertical: hp(16),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  title: {
    fontWeight: "600",
  },
  scrollView: {
    maxHeight: hp(400),
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: "600",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    marginBottom: 8,
  },
  rangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rangeInput: {
    flex: 1,
  },
  rangeSeparator: {
    fontSize: 16,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  button: {
    flex: 1,
    borderRadius: 12,
  },
});
