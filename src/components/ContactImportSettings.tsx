import { useContactImport } from "@/hooks/useContactImport";
import { useDatabase } from "@/services/database";
import { createDatabaseService } from "@/services/database/service";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  Divider,
  Modal,
  Portal,
  SegmentedButtons,
  Switch,
  Text,
  TextInput,
} from "react-native-paper";
import { ContactPicker } from "./ContactPicker";

interface ContactImportSettingsProps {
  visible: boolean;
  onDismiss: () => void;
  onImportComplete: (result: {
    imported: number;
    skipped: number;
    totalProcessed: number;
    errors: string[];
  }) => void;
}

export const ContactImportSettings: React.FC<ContactImportSettingsProps> = ({
  visible,
  onDismiss,
  onImportComplete,
}) => {
  const {
    importFromContacts,
    importSelectedContacts,
    isImporting,
    checkContactAccess,
  } = useContactImport();

  const { db } = useDatabase();
  const databaseService = createDatabaseService(db);

  const [importMode, setImportMode] = useState<
    "limited" | "partial" | "full" | "select"
  >("limited");
  const [maxImportCount, setMaxImportCount] = useState("100");
  const [batchSize, setBatchSize] = useState("50");
  const [forceRefresh, setForceRefresh] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [existingPhones, setExistingPhones] = useState<string[]>([]);

  // Load existing phone numbers when component mounts
  useEffect(() => {
    const loadExistingPhones = async () => {
      try {
        const customers = await databaseService.getCustomers();
        const phones = customers
          .filter((c) => c.phone)
          .map((c) => c.phone.replace(/\D/g, ""));
        setExistingPhones(phones);
      } catch (error) {
        console.error("Failed to load existing phones:", error);
      }
    };

    if (visible) {
      loadExistingPhones();
    }
  }, [visible, databaseService]);

  const handleContactsSelected = async (selectedContacts: any[]) => {
    try {
      setShowContactPicker(false);

      if (selectedContacts.length === 0) {
        Alert.alert("No Selection", "No contacts were selected for import.");
        return;
      }

      const result = await importSelectedContacts(selectedContacts);
      onImportComplete(result);
      onDismiss();

      Alert.alert(
        "Import Complete",
        `Successfully processed ${result.totalProcessed} contacts.\nImported: ${
          result.imported
        }\nSkipped: ${result.skipped}${
          result.errors.length > 0 ? `\nErrors: ${result.errors.length}` : ""
        }`
      );
    } catch (error) {
      Alert.alert(
        "Import Failed",
        error instanceof Error
          ? error.message
          : "Failed to import selected contacts"
      );
    }
  };

  const handleImport = async () => {
    try {
      const maxCount = parseInt(maxImportCount) || 100;
      const batch = parseInt(batchSize) || 50;

      if (maxCount < 1 || maxCount > 1000) {
        Alert.alert(
          "Invalid Settings",
          "Max import count must be between 1 and 1000"
        );
        return;
      }

      if (batch < 10 || batch > 100) {
        Alert.alert(
          "Invalid Settings",
          "Batch size must be between 10 and 100"
        );
        return;
      }

      // Handle contact selection mode
      if (importMode === "select") {
        setShowContactPicker(true);
        return;
      }

      // Check access status first
      const accessStatus = await checkContactAccess();

      let confirmMessage = `Import Settings:\n`;
      confirmMessage += `• Mode: ${importMode}\n`;
      confirmMessage += `• Max contacts: ${maxCount}\n`;
      confirmMessage += `• Batch size: ${batch}\n`;
      confirmMessage += `• Force refresh: ${forceRefresh ? "Yes" : "No"}\n\n`;
      confirmMessage += `Available contacts: ${accessStatus.contactCount}\n`;
      confirmMessage += `Limited access: ${
        accessStatus.isLimited ? "Yes" : "No"
      }`;

      Alert.alert("Confirm Import", confirmMessage, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Import",
          onPress: async () => {
            try {
              const result = await importFromContacts({
                maxImportCount: maxCount,
                batchSize: batch,
                importMode,
                forceRefresh,
              });

              onImportComplete(result);
              onDismiss();

              Alert.alert(
                "Import Complete",
                `Successfully processed ${
                  result.totalProcessed
                } contacts.\nImported: ${result.imported}\nSkipped: ${
                  result.skipped
                }${
                  result.errors.length > 0
                    ? `\nErrors: ${result.errors.length}`
                    : ""
                }`
              );
            } catch (error) {
              Alert.alert(
                "Import Failed",
                error instanceof Error
                  ? error.message
                  : "Unknown error occurred"
              );
            }
          },
        },
      ]);
    } catch {
      Alert.alert("Error", "Failed to check contact access");
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <Card style={styles.card}>
          <Card.Title title="Contact Import Settings" />
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Import Mode
            </Text>
            <SegmentedButtons
              value={importMode}
              onValueChange={(value) =>
                setImportMode(value as typeof importMode)
              }
              buttons={[
                {
                  value: "select",
                  label: "Select",
                  icon: "account-check",
                },
                {
                  value: "limited",
                  label: "Limited",
                  icon: "account-multiple",
                },
                {
                  value: "partial",
                  label: "Partial",
                  icon: "account-multiple-plus",
                },
                {
                  value: "full",
                  label: "Full",
                  icon: "account-group",
                },
              ]}
              style={styles.segmentedButtons}
            />

            <Text variant="bodySmall" style={styles.modeDescription}>
              {importMode === "select" &&
                "Choose specific contacts to import using contact picker"}
              {importMode === "limited" &&
                "Import available contacts only (respects iOS contact access limitations)"}
              {importMode === "partial" &&
                "Import up to specified limit (may request expanded access)"}
              {importMode === "full" &&
                "Import all available contacts (will request full access)"}
            </Text>

            <Divider style={styles.divider} />

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Import Limits
            </Text>

            <TextInput
              label="Max Import Count"
              value={maxImportCount}
              onChangeText={setMaxImportCount}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              right={<TextInput.Affix text="contacts" />}
            />

            <TextInput
              label="Batch Size"
              value={batchSize}
              onChangeText={setBatchSize}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              right={<TextInput.Affix text="per batch" />}
            />

            <Divider style={styles.divider} />

            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <Text variant="titleMedium">Force Permission Refresh</Text>
                <Text variant="bodySmall" style={styles.switchDescription}>
                  Request expanded contact access even if already granted
                </Text>
              </View>
              <Switch value={forceRefresh} onValueChange={setForceRefresh} />
            </View>
          </Card.Content>

          <Card.Actions style={styles.actions}>
            <Button mode="outlined" onPress={onDismiss}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleImport}
              loading={isImporting}
              disabled={isImporting}
            >
              {isImporting
                ? "Importing..."
                : importMode === "select"
                ? "Open Contact Picker"
                : "Start Import"}
            </Button>
          </Card.Actions>
        </Card>

        <ContactPicker
          visible={showContactPicker}
          onDismiss={() => setShowContactPicker(false)}
          onContactsSelected={handleContactsSelected}
          existingPhones={existingPhones}
          maxSelection={parseInt(maxImportCount) || 100}
        />
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    margin: 20,
  },
  card: {
    // maxHeight: "90%",
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 8,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  modeDescription: {
    marginBottom: 16,
    opacity: 0.7,
    fontStyle: "italic",
  },
  divider: {
    marginVertical: 16,
  },
  input: {
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchDescription: {
    opacity: 0.7,
    marginTop: 4,
  },
  actions: {
    justifyContent: "flex-end",
    paddingTop: 16,
  },
});
