import { fontSize, hp, wp } from "@/utils/responsive_dimensions_system";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(16),
  },
  header: {
    paddingVertical: hp(16),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
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
    // right: wp(16),
    bottom: hp(16),
  },
  clearButtonText: {
    fontSize: fontSize(12),
  },
});
