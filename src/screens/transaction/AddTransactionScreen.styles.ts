import { StyleSheet } from "react-native";
import { MD3Theme } from "react-native-paper";

// Create dynamic styles based on theme
export const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.elevation.level1,
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
      color: theme.colors.primary,
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
    fieldContainer: {
      marginBottom: 20,
    },
    fieldLabel: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
      color: theme.colors.onSurface,
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
      borderColor: theme.colors.outline,
      gap: 6,
    },
    typeOptionText: {
      fontWeight: "600",
      fontSize: 14,
    },
    input: {
      backgroundColor: theme.colors.elevation.level1,
    },
    searchInput: {
      marginBottom: 12,
    },
    customerSelector: {
      maxHeight: 100,
    },
    customerOption: {
      alignItems: "center",
      marginRight: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: "transparent",
      minWidth: 80,
    },
    customerOptionSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryContainer,
    },
    customerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 4,
    },
    customerAvatarText: {
      color: theme.colors.onPrimary,
      fontSize: 14,
      fontWeight: "bold",
    },
    customerName: {
      fontSize: 12,
      textAlign: "center",
      maxWidth: 70,
      color: theme.colors.onSurface,
    },
    customerNameSelected: {
      fontWeight: "700",
      color: theme.colors.primary,
    },
    dateButton: {
      marginBottom: 8,
    },
    datePresetContainer: {
      flexDirection: "row",
      marginTop: 8,
      gap: 8,
    },
    datePresetButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
    },
    datePresetText: {
      fontSize: 12,
      fontWeight: "600",
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
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: "600",
    },
    helpText: {
      marginTop: 24,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    helpLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurface,
      marginBottom: 8,
    },
    helpDescription: {
      fontSize: 12,
      opacity: 0.8,
      lineHeight: 18,
      color: theme.colors.onSurfaceVariant,
    },
    helpType: {
      fontWeight: "600",
    },
    typeOptionSelected: {
      borderWidth: 2,
    },
    quickAmountsContainer: {
      marginBottom: 16,
    },
    quickAmountsLabel: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 8,
      color: theme.colors.onSurface,
      opacity: 0.8,
    },
    quickAmountsScroll: {
      marginBottom: 8,
    },
    quickAmountButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 20,
      marginRight: 8,
      borderWidth: 1,
      borderColor: "transparent",
    },
    quickAmountButtonSelected: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
    quickAmountText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurfaceVariant,
    },
    quickAmountTextSelected: {
      color: theme.colors.primary,
    },
    amountPreviewContainer: {
      alignItems: "center",
      marginTop: 12,
      padding: 16,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
    },
    amountPreview: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
    },
    amountPreviewLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
      textAlign: "center",
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
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    descriptionPresetText: {
      fontSize: 12,
      fontWeight: "500",
      color: theme.colors.onSurfaceVariant,
    },
    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
  });
