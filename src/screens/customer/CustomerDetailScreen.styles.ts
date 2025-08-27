import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  backButton: {
    marginTop: 24,
    borderRadius: 12,
  },
  backButtonContent: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  scrollView: {
    flex: 1,
  },
  customerHeader: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  customerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
  },
  customerAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  avatarText: {
    fontWeight: "700",
    letterSpacing: 0.5,
    fontSize: 24,
  },
  customerInfo: {
    flex: 1,
    justifyContent: "center",
  },
  customerPhone: {
    marginTop: 6,
    fontWeight: "500",
    fontSize: 16,
  },
  customerEmail: {
    marginTop: 4,
    fontSize: 14,
  },
  customerAddress: {
    marginTop: 4,
    lineHeight: 20,
    fontSize: 14,
  },
  actionButtonsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  segmentedButtons: {
    borderRadius: 12,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  statCardContent: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  statValue: {
    fontWeight: "700",
    marginBottom: 6,
    fontSize: 18,
  },
  statLabel: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 22,
  },
  addTransactionButton: {
    borderRadius: 20,
    minWidth: 80,
  },
  emptyTransactions: {
    borderRadius: 16,
    overflow: "hidden",
  },
  emptyTransactionsContent: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyText: {
    marginBottom: 20,
    textAlign: "center",
    fontSize: 16,
  },
  firstTransactionButton: {
    borderRadius: 12,
    paddingHorizontal: 32,
  },
  transactionsList: {
    borderRadius: 16,
    overflow: "hidden",
  },
  transactionAmount: {
    fontWeight: "700",
    fontSize: 16,
  },
  viewAllButton: {
    marginVertical: 8,
    borderRadius: 0,
  },
  detailsCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  detailValue: {
    fontWeight: "600",
    fontSize: 13,
    textAlign: "right",
    flex: 1,
    marginLeft: 20,
  },
  bottomActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 120, // Space for FAB
    gap: 16,
  },
  editButton: {
    flex: 2,
    borderRadius: 50,
  },
  deleteButton: {
    flex: 1,
    borderRadius: 50,
  },
  bottomButtonContent: {
    paddingVertical: 10,
  },
  fab: {
    position: "absolute",
    margin: 20,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
});
