import { ProcessedContact } from "@/components/ContactPicker";
import { useContactPicker } from "@/hooks/useContactPicker";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";

export const ContactPickerExample: React.FC = () => {
  const { showContactPicker, ContactPickerComponent } = useContactPicker();

  const handleSelectContacts = () => {
    showContactPicker({
      existingPhones: ["08123456789"], // Example of existing phones to exclude
      maxSelection: 10,
      onContactsSelected: (contacts: ProcessedContact[]) => {
        console.log("Selected contacts:", contacts);
        // Handle the selected contacts here
        // You can save them to state, send to API, etc.
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Contact Picker Example
      </Text>

      <Text variant="bodyMedium" style={styles.description}>
        Tap the button below to open the contact picker modal.
      </Text>

      <Button
        mode="contained"
        onPress={handleSelectContacts}
        style={styles.button}
        icon="contacts"
      >
        Select Contacts
      </Button>

      {/* This component renders the modal when visible */}
      <ContactPickerComponent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    marginBottom: 24,
    textAlign: "center",
    color: "#666",
  },
  button: {
    marginTop: 16,
  },
});
