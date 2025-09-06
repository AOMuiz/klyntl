import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useThemeColor } from "../hooks/useThemeColor";
import { useCustomerStore } from "../stores/customerStore";
import {
  CUSTOMER_FILTER_PRESETS,
  CustomerFilters,
  SortOptions,
} from "../types/filters";

interface FilterBarProps {
  onFiltersChange?: (filters: CustomerFilters, sort: SortOptions) => void;
}

const { width: screenWidth } = Dimensions.get("window");

export const FilterBar: React.FC<FilterBarProps> = ({ onFiltersChange }) => {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [localFilters, setLocalFilters] = useState<CustomerFilters>({});
  const [localSort, setLocalSort] = useState<SortOptions>({
    field: "name",
    direction: "asc",
  });

  const {
    activeFilters,
    sortOptions,
    appliedFilterDescription,
    totalCustomersCount,
    filteredCustomersCount,
    setFilters,
    setSortOptions,
    applyFilters,
    clearFilters,
    applyFilterPreset,
  } = useCustomerStore();

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const primaryColor = useThemeColor({}, "tint");
  const cardColor = useThemeColor({}, "background");
  const borderColor = useThemeColor({}, "text");

  const hasActiveFilters = Object.keys(localFilters).length > 0;

  const openFilterModal = () => {
    setLocalFilters({});
    setLocalSort(sortOptions);
    setShowFilterModal(true);
  };

  const applyLocalFilters = async () => {
    setFilters(localFilters);
    setSortOptions(localSort);
    onFiltersChange?.(localFilters, localSort);
    setShowFilterModal(false);
  };

  const resetFilters = async () => {
    setLocalFilters({});
    setLocalSort({ field: "name", direction: "asc" });
    clearFilters();
    onFiltersChange?.({}, { field: "name", direction: "asc" });
    setShowFilterModal(false);
  };

  const applyPreset = async (presetId: string) => {
    const preset = CUSTOMER_FILTER_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setLocalFilters(preset.filters);
      setLocalSort(preset.sort || { field: "name", direction: "asc" });
      applyFilterPreset(presetId);
      onFiltersChange?.(
        preset.filters,
        preset.sort || { field: "name", direction: "asc" }
      );
    }
    setShowFilterModal(false);
  };

  const updateLocalFilter = (key: keyof CustomerFilters, value: any) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
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

  const styles = StyleSheet.create({
    container: {
      backgroundColor: cardColor,
      paddingHorizontal: 20,
      paddingVertical: 16,
      marginBottom: 8,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    filterButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: hasActiveFilters ? primaryColor : backgroundColor,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: primaryColor,
      elevation: hasActiveFilters ? 2 : 0,
      shadowColor: primaryColor,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: hasActiveFilters ? 0.2 : 0,
      shadowRadius: 2,
    },
    filterButtonText: {
      color: hasActiveFilters ? "#fff" : primaryColor,
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 4,
    },
    sortButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: backgroundColor,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: borderColor,
      elevation: 1,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 1,
    },
    sortButtonText: {
      color: textColor,
      fontSize: 12,
      marginLeft: 4,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    statsText: {
      color: textColor,
      fontSize: 12,
      opacity: 0.7,
    },
    filterDescription: {
      color: primaryColor,
      fontSize: 12,
      fontWeight: "500",
    },
    modal: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: cardColor,
      borderRadius: 12,
      padding: 20,
      width: screenWidth - 40,
      maxHeight: "80%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: textColor,
    },
    closeButton: {
      padding: 4,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: textColor,
      marginBottom: 12,
    },
    presetContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 16,
    },
    presetChip: {
      backgroundColor: backgroundColor,
      borderWidth: 1,
      borderColor: borderColor,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 8,
      marginBottom: 8,
    },
    presetChipText: {
      color: textColor,
      fontSize: 12,
    },
    filterOption: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    filterOptionLabel: {
      fontSize: 14,
      color: textColor,
      flex: 1,
    },
    filterOptionValue: {
      fontSize: 14,
      color: primaryColor,
      fontWeight: "500",
    },
    input: {
      borderWidth: 1,
      borderColor: borderColor,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 14,
      color: textColor,
      backgroundColor: backgroundColor,
      marginTop: 4,
    },
    rangeInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
    },
    rangeInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: borderColor,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 14,
      color: textColor,
      backgroundColor: backgroundColor,
    },
    rangeSeparator: {
      marginHorizontal: 8,
      color: textColor,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 20,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
      marginHorizontal: 4,
    },
    primaryButton: {
      backgroundColor: primaryColor,
    },
    secondaryButton: {
      backgroundColor: backgroundColor,
      borderWidth: 1,
      borderColor: borderColor,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: "600",
    },
    primaryButtonText: {
      color: "#fff",
    },
    secondaryButtonText: {
      color: textColor,
    },
  });

  const customerTypeOptions = [
    { label: "All Types", value: "all" },
    { label: "Individual", value: "individual" },
    { label: "Business", value: "business" },
  ];

  const sortFieldOptions = [
    { label: "Name", value: "name" },
    { label: "Total Spent", value: "totalSpent" },
    { label: "Date Added", value: "createdAt" },
    { label: "Last Purchase", value: "lastPurchase" },
  ];

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="fade"
      transparent
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modal}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter & Sort</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Quick Presets */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Filters</Text>
              <View style={styles.presetContainer}>
                {CUSTOMER_FILTER_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    style={styles.presetChip}
                    onPress={() => applyPreset(preset.id)}
                  >
                    <Text style={styles.presetChipText}>{preset.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Customer Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customer Type</Text>
              {customerTypeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.filterOption}
                  onPress={() =>
                    updateLocalFilter("customerType", option.value)
                  }
                >
                  <Text style={styles.filterOptionLabel}>{option.label}</Text>
                  {(localFilters.customerType || "all") === option.value && (
                    <Ionicons name="checkmark" size={20} color={primaryColor} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Spending Range */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Spending Range (₦)</Text>
              <View style={styles.rangeInputContainer}>
                <TextInput
                  style={styles.rangeInput}
                  placeholder="Min amount"
                  placeholderTextColor={textColor + "80"}
                  value={localFilters.spendingRange?.min?.toString() || ""}
                  onChangeText={(value) => updateSpendingRange("min", value)}
                  keyboardType="numeric"
                />
                <Text style={styles.rangeSeparator}>-</Text>
                <TextInput
                  style={styles.rangeInput}
                  placeholder="Max amount"
                  placeholderTextColor={textColor + "80"}
                  value={
                    localFilters.spendingRange?.max === Number.MAX_SAFE_INTEGER
                      ? ""
                      : localFilters.spendingRange?.max?.toString() || ""
                  }
                  onChangeText={(value) => updateSpendingRange("max", value)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Transaction Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Purchase History</Text>
              <TouchableOpacity
                style={styles.filterOption}
                onPress={() => updateLocalFilter("hasTransactions", true)}
              >
                <Text style={styles.filterOptionLabel}>Has made purchases</Text>
                {localFilters.hasTransactions === true && (
                  <Ionicons name="checkmark" size={20} color={primaryColor} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterOption}
                onPress={() => updateLocalFilter("hasTransactions", false)}
              >
                <Text style={styles.filterOptionLabel}>No purchases yet</Text>
                {localFilters.hasTransactions === false && (
                  <Ionicons name="checkmark" size={20} color={primaryColor} />
                )}
              </TouchableOpacity>
            </View>

            {/* Sort Options */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sort By</Text>
              {sortFieldOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.filterOption}
                  onPress={() =>
                    setLocalSort({
                      field: option.value as any,
                      direction: localSort.direction,
                    })
                  }
                >
                  <Text style={styles.filterOptionLabel}>{option.label}</Text>
                  {localSort.field === option.value && (
                    <TouchableOpacity
                      onPress={() =>
                        setLocalSort({
                          field: option.value as any,
                          direction:
                            localSort.direction === "asc" ? "desc" : "asc",
                        })
                      }
                    >
                      <Ionicons
                        name={
                          localSort.direction === "asc"
                            ? "arrow-up"
                            : "arrow-down"
                        }
                        size={20}
                        color={primaryColor}
                      />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={resetFilters}
            >
              <Text
                style={[styles.actionButtonText, styles.secondaryButtonText]}
              >
                Clear All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={applyLocalFilters}
            >
              <Text style={[styles.actionButtonText, styles.primaryButtonText]}>
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={openFilterModal}
          >
            <Ionicons
              name="funnel-outline"
              size={16}
              color={hasActiveFilters ? "#fff" : primaryColor}
            />
            <Text style={styles.filterButtonText}>
              {hasActiveFilters ? "Filtered" : "Filter"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sortButton} onPress={openFilterModal}>
            <Ionicons
              name="swap-vertical-outline"
              size={16}
              color={textColor}
            />
            <Text style={styles.sortButtonText}>
              {localSort.field} {localSort.direction === "asc" ? "↑" : "↓"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            {filteredCustomersCount} of {totalCustomersCount} customers
          </Text>
          <Text style={styles.filterDescription}>
            {appliedFilterDescription}
          </Text>
        </View>
      </View>

      {renderFilterModal()}
    </>
  );
};
