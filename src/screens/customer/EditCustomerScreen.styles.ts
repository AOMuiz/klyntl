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
    padding: 32,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  backButton: {
    marginTop: 24,
  },
  // Modern Header Styles
  header: {
    borderBottomWidth: 0,
    paddingVertical: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontWeight: "600",
    marginHorizontal: 16,
  },
  cancelButton: {
    minWidth: 60,
  },
  // Form Container
  form: {
    flex: 1,
  },
  formContent: {
    padding: 16,
  },
  // Info Card Styles
  infoCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
  },
  infoCardContent: {
    alignItems: "center",
    paddingVertical: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  infoText: {
    textAlign: "center",
    fontWeight: "500",
  },
  // Form Fields
  fieldsContainer: {
    gap: 16,
  },
  fieldContainer: {
    marginBottom: 4,
  },
  input: {
    backgroundColor: "transparent",
  },
  inputContent: {
    paddingHorizontal: 16,
  },
  // Submit Button
  submitContainer: {
    marginTop: 32,
    marginBottom: 24,
  },
  submitButton: {
    borderRadius: 12,
  },
  submitButtonContent: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  // Help Card
  helpCard: {
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  helpContent: {
    gap: 8,
  },
  helpTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  helpDescription: {
    lineHeight: 18,
  },
});
