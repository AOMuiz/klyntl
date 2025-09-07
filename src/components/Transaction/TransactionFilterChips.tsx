import { styles } from "@/screens/transaction/TransactionsScreen.styles";
import { TransactionFilterType } from "@/types/transaction";
import { getFilterLabel } from "@/utils/transactionUtils";
import { ScrollView, TouchableOpacity } from "react-native";
import { ThemedText } from "../ThemedText";
import { IconSymbol } from "../ui/IconSymbol";

export const TransactionFilterChips = ({
  statusFilter,
  dateFilter,
  debtStatusFilter,
  customers,
  colors,
  resetAllFilters,
  setActiveFilter,
}: {
  statusFilter: string;
  dateFilter: string;
  debtStatusFilter: string;
  customers: any[];
  colors: any;
  resetAllFilters: () => void;
  setActiveFilter: (filter: TransactionFilterType) => void;
}) => {
  const isDateActive = dateFilter !== "all";
  const isStatusActive = statusFilter !== "all";
  const isDebtStatusActive = debtStatusFilter !== "all";

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filtersContent}
    >
      <TouchableOpacity
        style={[
          styles.filterChip,
          statusFilter === "all" ? styles.activeChip : styles.inactiveChip,
        ]}
        onPress={resetAllFilters}
      >
        <ThemedText
          style={[
            styles.filterChipText,
            statusFilter === "all"
              ? styles.activeChipText
              : styles.inactiveChipText,
          ]}
        >
          All
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.filterChip,
          styles.inactiveChip,
          isDateActive && styles.activeFilterChip,
        ]}
        onPress={() => setActiveFilter("date")}
      >
        <ThemedText style={[styles.filterChipText, styles.inactiveChipText]}>
          {getFilterLabel(
            "date",
            statusFilter,
            dateFilter,
            debtStatusFilter,
            "",
            customers
          )}
        </ThemedText>
        <IconSymbol
          name="chevron.down"
          size={16}
          color={colors.paper.onSurface}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.filterChip,
          styles.inactiveChip,
          isStatusActive && styles.activeFilterChip,
        ]}
        onPress={() => setActiveFilter("status")}
      >
        <ThemedText style={[styles.filterChipText, styles.inactiveChipText]}>
          {getFilterLabel(
            "status",
            statusFilter,
            dateFilter,
            debtStatusFilter,
            "",
            customers
          )}
        </ThemedText>
        <IconSymbol
          name="chevron.down"
          size={16}
          color={colors.paper.onSurface}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.filterChip,
          styles.inactiveChip,
          isDebtStatusActive && styles.activeFilterChip,
        ]}
        onPress={() => setActiveFilter("debtStatus")}
      >
        <ThemedText style={[styles.filterChipText, styles.inactiveChipText]}>
          {debtStatusFilter === "all"
            ? "Debt Status"
            : debtStatusFilter.charAt(0).toUpperCase() +
              debtStatusFilter.slice(1)}
        </ThemedText>
        <IconSymbol
          name="chevron.down"
          size={16}
          color={colors.paper.onSurface}
        />
      </TouchableOpacity>
    </ScrollView>
  );
};
