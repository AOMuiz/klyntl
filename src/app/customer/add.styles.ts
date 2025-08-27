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
    input: {
      backgroundColor: theme.colors.elevation.level1,
    },
    phonePresetsContainer: {
      marginBottom: 12,
    },
    phonePresetsLabel: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 8,
      color: theme.colors.onSurface,
      opacity: 0.8,
    },
    phonePresets: {
      flexDirection: "row",
      gap: 8,
    },
    phonePresetButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    phonePresetText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurfaceVariant,
    },
    contactMethodContainer: {
      flexDirection: "row",
      gap: 8,
      marginTop: 4,
    },
    contactMethodButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: theme.colors.outline,
      backgroundColor: "transparent",
      gap: 6,
    },
    contactMethodButtonActive: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
    contactMethodText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    contactMethodTextActive: {
      color: theme.colors.primary,
    },
    businessFieldsContainer: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    businessFieldsHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      gap: 8,
    },
    businessFieldsTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    businessFieldsSubtitle: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 16,
    },
    nicknameSuggestions: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 8,
      gap: 8,
    },
    nicknameSuggestionButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    nicknameSuggestionText: {
      fontSize: 12,
      fontWeight: "500",
      color: theme.colors.onSurfaceVariant,
    },
    buttonContainer: {
      marginTop: 24,
      marginBottom: 16,
    },
    submitButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
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
      lineHeight: 16,
      color: theme.colors.onSurfaceVariant,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.outlineVariant,
      marginVertical: 16,
    },
    importSection: {
      alignItems: "center",
      gap: 8,
    },
    importLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurface,
      textAlign: "center",
    },
    customerPreviewContainer: {
      alignItems: "center",
      marginTop: 12,
      padding: 16,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
    },
    customerPreviewAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    customerPreviewAvatarText: {
      color: theme.colors.onPrimary,
      fontSize: 20,
      fontWeight: "bold",
    },
    customerPreviewName: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.onSurface,
      textAlign: "center",
    },
    customerPreviewPhone: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
      textAlign: "center",
    },
    customerPreviewCompany: {
      fontSize: 12,
      color: theme.colors.primary,
      marginTop: 2,
      textAlign: "center",
      fontWeight: "600",
    },
    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
  });
