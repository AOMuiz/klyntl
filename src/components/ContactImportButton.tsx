import { useCustomerStore } from "@/stores/customerStore";
import React, { useState } from "react";
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
  const { importFromContacts } = useCustomerStore();
  const [importing, setImporting] = useState(false);

  const handleImportContacts = async () => {
    try {
      setImporting(true);

      Alert.alert(
        "Import Contacts",
        "This will import contacts from your phone. Only Nigerian phone numbers will be imported and duplicates will be skipped.",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setImporting(false),
          },
          {
            text: "Import",
            onPress: async () => {
              try {
                const result = await importFromContacts();
                onImportComplete?.(result);

                Alert.alert(
                  "Import Complete",
                  `Successfully imported ${result.imported} contacts. ${result.skipped} contacts were skipped (duplicates or invalid numbers).`
                );
              } catch (error) {
                Alert.alert(
                  "Import Failed",
                  error instanceof Error
                    ? error.message
                    : "Failed to import contacts"
                );
              } finally {
                setImporting(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      setImporting(false);
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
        disabled={disabled || importing}
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
        disabled={disabled || importing}
      >
        <Text style={styles.textButtonText}>
          {importing ? "Importing..." : "Import Contacts"}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        size === "small" && styles.buttonSmall,
        size === "large" && styles.buttonLarge,
        (disabled || importing) && styles.buttonDisabled,
        style,
      ]}
      onPress={handleImportContacts}
      disabled={disabled || importing}
    >
      <IconSymbol
        name="person.badge.plus"
        size={getIconSize()}
        color="white"
        style={styles.buttonIcon}
      />
      <Text style={styles.buttonText}>
        {importing ? "Importing..." : "Import Contacts"}
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
