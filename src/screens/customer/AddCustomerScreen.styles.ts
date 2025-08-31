import { StyleSheet } from "react-native";
import { rs } from "react-native-full-responsive";
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
      paddingHorizontal: rs(16),
      paddingVertical: rs(12),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.elevation.level1,
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: rs(18),
      fontWeight: "600",
    },
    cancelButton: {
      padding: rs(8),
    },
    cancelText: {
      color: theme.colors.primary,
      fontSize: rs(16),
    },
    placeholder: {
      width: rs(60),
    },
    form: {
      flex: 1,
    },
    formContent: {
      padding: rs(16),
    },
    iconContainer: {
      alignItems: "center",
      marginBottom: rs(20),
      paddingVertical: rs(8),
    },
    subtitle: {
      marginTop: rs(12),
      opacity: 0.7,
      textAlign: "center",
    },
    fieldContainer: {
      marginBottom: rs(20),
    },
    fieldLabel: {
      fontSize: rs(16),
      fontWeight: "600",
      marginBottom: rs(8),
      color: theme.colors.onSurface,
    },
    input: {
      backgroundColor: theme.colors.elevation.level1,
    },
    phonePresetsContainer: {
      marginBottom: rs(12),
    },
    phonePresetsLabel: {
      fontSize: rs(14),
      fontWeight: "600",
      marginBottom: rs(8),
      color: theme.colors.onSurface,
      opacity: 0.8,
    },
    phonePresets: {
      flexDirection: "row",
      gap: rs(8),
    },
    phonePresetButton: {
      paddingHorizontal: rs(16),
      paddingVertical: rs(8),
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: rs(20),
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    phonePresetText: {
      fontSize: rs(14),
      fontWeight: "600",
      color: theme.colors.onSurfaceVariant,
    },
    contactMethodContainer: {
      flexDirection: "row",
      gap: rs(8),
      marginTop: rs(4),
    },
    contactMethodButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: rs(12),
      paddingHorizontal: rs(8),
      borderRadius: rs(8),
      borderWidth: 2,
      borderColor: theme.colors.outline,
      backgroundColor: "transparent",
      gap: rs(6),
    },
    contactMethodButtonActive: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
    contactMethodText: {
      fontSize: rs(12),
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    contactMethodTextActive: {
      color: theme.colors.primary,
    },
    businessFieldsContainer: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: rs(12),
      padding: rs(16),
      marginBottom: rs(20),
    },
    businessFieldsHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: rs(12),
      gap: rs(8),
    },
    businessFieldsTitle: {
      fontSize: rs(16),
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    businessFieldsSubtitle: {
      fontSize: rs(12),
      color: theme.colors.onSurfaceVariant,
      marginBottom: rs(16),
    },
    nicknameSuggestions: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: rs(8),
      gap: rs(8),
    },
    nicknameSuggestionButton: {
      paddingHorizontal: rs(12),
      paddingVertical: rs(6),
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: rs(16),
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    nicknameSuggestionText: {
      fontSize: rs(12),
      fontWeight: "500",
      color: theme.colors.onSurfaceVariant,
    },
    buttonContainer: {
      marginTop: rs(24),
      marginBottom: rs(16),
    },
    submitButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
      paddingVertical: rs(16),
      borderRadius: rs(12),
      gap: rs(8),
    },
    disabledButton: {
      opacity: 0.6,
    },
    submitButtonText: {
      color: theme.colors.onPrimary,
      fontSize: rs(16),
      fontWeight: "600",
    },
    helpText: {
      marginTop: rs(24),
      paddingTop: rs(16),
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    helpLabel: {
      fontSize: rs(14),
      fontWeight: "600",
      color: theme.colors.onSurface,
      marginBottom: rs(8),
    },
    helpDescription: {
      fontSize: rs(12),
      opacity: 0.8,
      lineHeight: rs(16),
      color: theme.colors.onSurfaceVariant,
    },
    divider: {
      height: rs(1),
      backgroundColor: theme.colors.outlineVariant,
      marginVertical: rs(16),
    },
    importSection: {
      alignItems: "center",
      gap: rs(8),
    },
    importLabel: {
      fontSize: rs(14),
      fontWeight: "600",
      color: theme.colors.onSurface,
      textAlign: "center",
    },
    customerPreviewContainer: {
      alignItems: "center",
      marginTop: rs(12),
      padding: rs(16),
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: rs(12),
    },
    customerPreviewAvatar: {
      width: rs(60),
      height: rs(60),
      borderRadius: rs(30),
      backgroundColor: theme.colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: rs(8),
    },
    customerPreviewAvatarText: {
      color: theme.colors.onPrimary,
      fontSize: rs(20),
      fontWeight: "bold",
    },
    customerPreviewName: {
      fontSize: rs(18),
      fontWeight: "600",
      color: theme.colors.onSurface,
      textAlign: "center",
    },
    customerPreviewPhone: {
      fontSize: rs(14),
      color: theme.colors.onSurfaceVariant,
      marginTop: rs(4),
      textAlign: "center",
    },
    customerPreviewCompany: {
      fontSize: rs(12),
      color: theme.colors.primary,
      marginTop: rs(2),
      textAlign: "center",
      fontWeight: "600",
    },
    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
  });
