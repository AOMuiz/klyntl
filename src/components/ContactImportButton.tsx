import { useContactImport } from "@/hooks/useContactImport";
import { useContactPicker } from "@/hooks/useContactPicker";
import { useDatabase } from "@/services/database";
import { createDatabaseService } from "@/services/database/service";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { IconSymbol } from "./ui/IconSymbol";

interface ContactImportButtonProps {
  onImportComplete?: (result: {
    imported: number;
    skipped: number;
    totalProcessed: number;
    errors: string[];
  }) => void;
  style?: any;
  disabled?: boolean;
  variant?: "fab" | "button" | "text";
  size?: "small" | "medium" | "large";
  maxImportCount?: number;
  importMode?: "full" | "limited" | "partial" | "select"; // Added "select" mode
  showSelectOption?: boolean; // Whether to show contact picker option
}

export const ContactImportButton: React.FC<ContactImportButtonProps> = ({
  onImportComplete,
  style,
  disabled = false,
  variant = "button",
  size = "medium",
  maxImportCount = 100, // Default reasonable limit
  importMode = "limited", // Default to limited import
  showSelectOption = true, // Show contact picker by default
}) => {
  const {
    importFromContacts,
    importSelectedContacts, // New function for selected contacts
    clearImportCache,
    checkContactAccess,
    isImporting,
  } = useContactImport();

  const { db } = useDatabase();
  const databaseService = createDatabaseService(db);
  const { showContactPicker, ContactPickerComponent } = useContactPicker();

  const [existingPhones, setExistingPhones] = useState<string[]>([]);

  // Load existing phone numbers when component mounts
  useEffect(() => {
    const loadExistingPhones = async () => {
      try {
        const customers = await databaseService.getCustomersWithFilters();
        const phones = customers
          .filter((c) => c.phone)
          .map((c) => c.phone.replace(/\D/g, ""));
        setExistingPhones(phones);
      } catch (error) {
        console.error("Failed to load existing phones:", error);
      }
    };

    loadExistingPhones();
  }, [databaseService]);

  const handleContactsSelected = async (selectedContacts: any[]) => {
    try {
      if (selectedContacts.length === 0) {
        Alert.alert("No Selection", "No contacts were selected for import.");
        return;
      }

      const result = await importSelectedContacts(selectedContacts);
      onImportComplete?.(result);

      let message = `Import completed!\n\n`;
      message += `• Selected: ${selectedContacts.length} contacts\n`;
      message += `• Imported: ${result.imported} customers\n`;
      message += `• Skipped: ${result.skipped} contacts`;

      if (result.errors.length > 0) {
        message += `\n• Errors: ${result.errors.length}`;
      }

      Alert.alert("Import Complete", message);
    } catch (error) {
      Alert.alert(
        "Import Failed",
        error instanceof Error
          ? error.message
          : "Failed to import selected contacts"
      );
    }
  };

  const openContactPicker = () => {
    showContactPicker({
      existingPhones,
      maxSelection: maxImportCount,
      onContactsSelected: handleContactsSelected,
    });
  };

  const handleImportContacts = async () => {
    try {
      // Check current contact access status
      const accessStatus = await checkContactAccess();

      let alertTitle = "Import Contacts";
      let alertMessage = `Choose how you want to import contacts:\n\nOnly Nigerian phone numbers will be imported and duplicates will be skipped.`;

      if (!accessStatus.hasAccess) {
        alertMessage =
          "This app needs permission to access your contacts. You'll be prompted to grant permission.";
      } else {
        alertMessage += `\n\n${accessStatus.contactCount} contacts available.`;
      }

      const buttons = [];

      // Cancel button
      buttons.push({
        text: "Cancel",
        style: "cancel" as const,
      });

      // Contact picker option (recommended)
      if (showSelectOption && accessStatus.hasAccess) {
        buttons.push({
          text: "Select Contacts",
          onPress: openContactPicker,
        });
      }

      // If limited access, offer import limited option
      if (accessStatus.isLimited) {
        buttons.push({
          text: `Import Limited (${Math.min(
            accessStatus.contactCount,
            maxImportCount
          )})`,
          onPress: async () => {
            try {
              const result = await importFromContacts({
                maxImportCount,
                importMode: "limited",
                forceRefresh: false,
              });
              onImportComplete?.(result);

              const message =
                result.imported > 0
                  ? `Successfully imported ${result.imported} contacts. ${result.skipped} contacts were skipped.`
                  : result.skipped > 0
                  ? `No new contacts imported. ${result.skipped} contacts were skipped.`
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

        // Option to grant more access
        if (importMode !== "limited") {
          buttons.push({
            text: "Grant More Access",
            onPress: async () => {
              try {
                await clearImportCache();
                const result = await importFromContacts({
                  maxImportCount: importMode === "full" ? 500 : maxImportCount,
                  importMode: importMode === "full" ? "full" : "partial",
                  forceRefresh: true,
                });
                onImportComplete?.(result);

                const message =
                  result.imported > 0
                    ? `Successfully imported ${result.imported} contacts. ${result.skipped} contacts were skipped.`
                    : result.skipped > 0
                    ? `No new contacts imported. ${result.skipped} contacts were skipped. You may still have limited contact access.`
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
      } else if (accessStatus.hasAccess) {
        // Standard import option for full access
        buttons.push({
          text: `Import All (up to ${maxImportCount})`,
          onPress: async () => {
            try {
              const result = await importFromContacts({
                maxImportCount: importMode === "full" ? 500 : maxImportCount,
                importMode: importMode === "full" ? "full" : "partial",
                forceRefresh: false,
              });
              onImportComplete?.(result);

              let message =
                result.imported > 0
                  ? `Successfully imported ${result.imported} contacts. ${result.skipped} contacts were skipped.`
                  : result.skipped > 0
                  ? `No new contacts imported. ${result.skipped} contacts were skipped.`
                  : "No contacts found to import.";

              if (result.errors.length > 0) {
                message += `\n\nSome errors occurred during import. Check console for details.`;
              }

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
    <>
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
        />
        <Text style={styles.buttonText}>
          {isImporting ? "Importing..." : "Import Contacts"}
        </Text>
      </TouchableOpacity>

      {/* Contact Picker Modal */}
      <ContactPickerComponent />
    </>
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
