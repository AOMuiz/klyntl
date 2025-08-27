import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    color: "#007AFF",
    fontSize: 16,
  },
  placeholder: {
    width: 60,
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 16,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 8,
  },
  subtitle: {
    marginTop: 12,
    opacity: 0.7,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    marginBottom: 8,
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  customerAvatarText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 14,
    opacity: 0.7,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#8E8E93",
    gap: 6,
  },
  typeOptionSelected: {
    borderWidth: 2,
  },
  typeOptionText: {
    fontWeight: "600",
    fontSize: 14,
  },
  input: {
    backgroundColor: "transparent",
  },
  quickAmountsContainer: {
    marginBottom: 16,
  },
  quickAmountsLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    opacity: 0.8,
  },
  quickAmountsScroll: {
    marginBottom: 8,
  },
  quickAmountButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  quickAmountButtonSelected: {
    backgroundColor: "rgba(0, 122, 255, 0.2)",
    borderColor: "#007AFF",
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.8,
  },
  quickAmountTextSelected: {
    color: "#007AFF",
    opacity: 1,
  },
  amountPreviewContainer: {
    alignItems: "center",
    marginTop: 12,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
  },
  amountPreview: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  amountPreviewLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
    textAlign: "center",
  },
  datePresetContainer: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  datePresetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  datePresetText: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.8,
  },
  descriptionPresets: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 8,
  },
  descriptionPresetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  descriptionPresetText: {
    fontSize: 12,
    fontWeight: "500",
    opacity: 0.8,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  helpText: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  helpLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  helpDescription: {
    fontSize: 12,
    opacity: 0.8,
    lineHeight: 18,
  },
  helpType: {
    fontWeight: "600",
  },
});
