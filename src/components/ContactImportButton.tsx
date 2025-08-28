import { useContactImport } from "@/hooks/useContactImport";
import React from "react";
import { Alert, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { IconSymbol } from "./ui/IconSymbol";

interface ContactImportButtonProps {
  onImportComplete?: (result: { imported: number; skipped: number }) => void;
  style?: any;
  disabled?: boolean;
  variant?: "fab" | "button" | "text";
  size?: "small" | "medium" | "large";
}

export const ContactImportButton: React.FC<ContactImportButtonProps> = ({
  onImportComplete,
  style,
  disabled = false,
  variant = "button",
  size = "medium",
}) => {
  const {
    importFromContacts,
    clearImportCache,
    checkContactAccess,
    isImporting,
  } = useContactImport();

  const handleImportContacts = async () => {
    try {
      // Check current contact access status
      const accessStatus = await checkContactAccess();

      let alertTitle = "Import Contacts";
      let alertMessage =
        "This will import contacts from your phone. Only Nigerian phone numbers will be imported and duplicates will be skipped.";

      if (!accessStatus.hasAccess) {
        alertMessage =
          "This app needs permission to access your contacts. You'll be prompted to grant permission.";
      } else if (accessStatus.isLimited) {
        alertTitle = "Limited Contact Access Detected";
        alertMessage = `You currently have limited access to contacts (${accessStatus.contactCount} contacts available). You can:\n\n• Import available contacts, or\n• Grant access to more contacts for a better import experience`;
      } else {
        alertMessage += `\n\n${accessStatus.contactCount} contacts available for import.`;
      }

      const buttons = [];

      // Cancel button
      buttons.push({
        text: "Cancel",
        style: "cancel" as const,
      });

      // If limited access, offer option to grant more access
      if (accessStatus.isLimited) {
        buttons.push({
          text: "Grant More Access",
          onPress: async () => {
            try {
              await clearImportCache();
              const result = await importFromContacts(true);
              onImportComplete?.(result);

              const message =
                result.imported > 0
                  ? `Successfully imported ${result.imported} contacts. ${result.skipped} contacts were skipped (duplicates or invalid numbers).`
                  : result.skipped > 0
                  ? `No new contacts imported. ${result.skipped} contacts were skipped (duplicates or invalid numbers). You may still have limited contact access.`
                  : "No contacts found to import.";

              Alert.alert("Import Complete", message);
            } catch (error) {
              Alert.alert(
                "Import Failed",
                error instanceof Error
                  ? error.message
                  : "Failed to import contacts"
              );
            }
          },
        });
      }

      // Always offer import option
      buttons.push({
        text: accessStatus.isLimited ? "Import Available" : "Import",
        onPress: async () => {
          try {
            const result = await importFromContacts(!accessStatus.isLimited);
            onImportComplete?.(result);

            const message =
              result.imported > 0
                ? `Successfully imported ${result.imported} contacts. ${result.skipped} contacts were skipped (duplicates or invalid numbers).`
                : result.skipped > 0
                ? `No new contacts imported. ${result.skipped} contacts were skipped (duplicates or invalid numbers).`
                : "No contacts found to import.";

            Alert.alert("Import Complete", message);
          } catch (error) {
            Alert.alert(
              "Import Failed",
              error instanceof Error
                ? error.message
                : "Failed to import contacts"
            );
          }
        },
      });

      Alert.alert(alertTitle, alertMessage, buttons);
    } catch (error) {
      console.error("Failed to start contact import:", error);
      Alert.alert("Error", "Failed to start contact import");
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "small":
        return 16;
      case "large":
        return 24;
      default:
        return 20;
    }
  };

  if (variant === "fab") {
    return (
      <TouchableOpacity
        style={[styles.fab, size === "small" && styles.fabSmall, style]}
        onPress={handleImportContacts}
        disabled={disabled || isImporting}
      >
        <IconSymbol
          name="person.badge.plus"
          size={getIconSize()}
          color="white"
        />
      </TouchableOpacity>
    );
  }

  if (variant === "text") {
    return (
      <TouchableOpacity
        style={[styles.textButton, style]}
        onPress={handleImportContacts}
        disabled={disabled || isImporting}
      >
        <Text style={styles.textButtonText}>
          {isImporting ? "Importing..." : "Import Contacts"}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      testID="contact-import-button"
      style={[
        styles.button,
        size === "small" && styles.buttonSmall,
        size === "large" && styles.buttonLarge,
        (disabled || isImporting) && styles.buttonDisabled,
        style,
      ]}
      onPress={handleImportContacts}
      disabled={disabled || isImporting}
    >
      <IconSymbol
        name="person.badge.plus"
        size={getIconSize()}
        color="white"
        style={styles.buttonIcon}
      />
      <Text style={styles.buttonText}>
        {isImporting ? "Importing..." : "Import Contacts"}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#34C759",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  button: {
    backgroundColor: "#34C759",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonLarge: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  buttonDisabled: {
    backgroundColor: "#A3A3A3",
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  textButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  textButtonText: {
    color: "#34C759",
    fontWeight: "600",
    fontSize: 16,
  },
});
