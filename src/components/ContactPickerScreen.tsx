import { validateNigerianPhone } from "@/utils/helpers";
import { FlashList } from "@shopify/flash-list";
import * as Contacts from "expo-contacts";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Button,
  Checkbox,
  Chip,
  Divider,
  IconButton,
  Modal,
  Portal,
  ProgressBar,
  Searchbar,
  Surface,
  Text,
} from "react-native-paper";

interface ProcessedContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  initials: string;
  isValid: boolean;
  isDuplicate: boolean;
}

interface SectionHeader {
  type: "header";
  letter: string;
  id: string;
}

interface ContactItem extends ProcessedContact {
  type: "contact";
}

type ListItem = SectionHeader | ContactItem;

interface ContactPickerProps {
  visible: boolean;
  onDismiss: () => void;
  onContactsSelected: (contacts: ProcessedContact[]) => void;
  existingPhones?: string[];
  maxSelection?: number;
}

export const ContactPicker: React.FC<ContactPickerProps> = ({
  visible,
  onDismiss,
  onContactsSelected,
  existingPhones = [],
  maxSelection = 100,
}) => {
  const [contacts, setContacts] = useState<ProcessedContact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!visible) {
      setSelectedContacts(new Set());
      setSearchQuery("");
      setContacts([]);
      setHasAccess(false);
    }
  }, [visible]);

  // Load contacts when modal opens
  const loadContacts = useCallback(async () => {
    if (!visible) return;

    setIsLoading(true);
    try {
      // Request permissions
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Contact access is required to select contacts.",
          [
            {
              text: "Cancel",
              onPress: onDismiss,
              style: "cancel",
            },
          ]
        );
        return;
      }

      setHasAccess(true);

      // Get contacts
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
        ],
        sort: Contacts.SortTypes?.FirstName || "firstName",
      });

      // Process contacts
      const processedContacts: ProcessedContact[] = [];

      for (const contact of data) {
        if (!contact.phoneNumbers?.length) continue;

        // Process each phone number
        for (const phoneNumber of contact.phoneNumbers) {
          if (!phoneNumber.number) continue;

          const cleanPhone = phoneNumber.number.replace(/\D/g, "");
          const validationResult = validateNigerianPhone(cleanPhone);
          const isValid =
            typeof validationResult === "boolean"
              ? validationResult
              : validationResult.isValid;
          const isDuplicate = existingPhones.includes(cleanPhone);

          const name =
            contact.name ||
            [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
            "Unknown Contact";

          const initials = name
            .split(" ")
            .map((n) => n.charAt(0))
            .join("")
            .toUpperCase()
            .slice(0, 2);

          processedContacts.push({
            id: `${contact.id}-${cleanPhone}`,
            name,
            phone: cleanPhone,
            email: contact.emails?.[0]?.email,
            initials,
            isValid,
            isDuplicate,
          });

          // Only take first valid phone per contact to avoid duplicates
          if (isValid) break;
        }
      }

      // Remove duplicates and sort
      const uniqueContacts = processedContacts.filter(
        (contact, index, self) =>
          index === self.findIndex((c) => c.phone === contact.phone)
      );

      uniqueContacts.sort((a, b) => a.name.localeCompare(b.name));
      setContacts(uniqueContacts);
    } catch (error) {
      console.error("Failed to load contacts:", error);
      Alert.alert("Error", "Failed to load contacts. Please try again.", [
        { text: "OK", onPress: onDismiss },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [visible, existingPhones, onDismiss]);

  useEffect(() => {
    if (visible) {
      loadContacts();
    }
  }, [visible, loadContacts]);

  // Filter contacts based on search
  const filteredContacts = useMemo(() => {
    let filtered = contacts.filter((c) => c.isValid && !c.isDuplicate);

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (contact) =>
          contact.name.toLowerCase().includes(query) ||
          contact.phone.includes(query)
      );
    }

    return filtered;
  }, [contacts, searchQuery]);

  const validContacts = contacts.filter((c) => c.isValid && !c.isDuplicate);

  const handleContactToggle = (contactId: string) => {
    const newSelected = new Set(selectedContacts);

    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else if (newSelected.size < maxSelection) {
      newSelected.add(contactId);
    } else {
      Alert.alert(
        "Selection Limit",
        `You can only select up to ${maxSelection} contacts.`
      );
      return;
    }

    setSelectedContacts(newSelected);
  };

  const handleSelectAll = () => {
    const selectableContacts = filteredContacts.slice(0, maxSelection);
    setSelectedContacts(new Set(selectableContacts.map((c) => c.id)));
  };

  const handleClearSelection = () => {
    setSelectedContacts(new Set());
  };

  const handleConfirmSelection = () => {
    const selectedContactsData = contacts.filter((c) =>
      selectedContacts.has(c.id)
    );
    onContactsSelected(selectedContactsData);
    onDismiss();
  };

  // Group contacts by alphabet (like WhatsApp)
  const groupedContactsData = useMemo((): ListItem[] => {
    const groups: { [key: string]: ProcessedContact[] } = {};

    filteredContacts.forEach((contact) => {
      const firstLetter = contact.name.charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(contact);
    });

    const sortedGroups = Object.entries(groups).sort(([a], [b]) =>
      a.localeCompare(b)
    );

    // Flatten into single array with headers and contacts
    const flatData: ListItem[] = [];
    sortedGroups.forEach(([letter, contacts]) => {
      flatData.push({ type: "header", letter, id: `header-${letter}` });
      contacts.forEach((contact) => {
        flatData.push({ ...contact, type: "contact" });
      });
    });

    return flatData;
  }, [filteredContacts]);

  const renderContactItem = ({ item: contact }: { item: ProcessedContact }) => {
    const isSelected = selectedContacts.has(contact.id);

    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => handleContactToggle(contact.id)}
      >
        <View style={styles.contactContent}>
          <View style={styles.contactLeft}>
            <Surface style={styles.avatar} elevation={0}>
              <Text style={styles.avatarText}>{contact.initials}</Text>
            </Surface>
          </View>

          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{contact.name}</Text>
            <Text style={styles.contactPhone}>
              {contact.phone}
              {contact.email ? ` • ${contact.email}` : ""}
            </Text>
          </View>

          <View style={styles.contactRight}>
            {contact.isDuplicate && (
              <Chip
                icon="account-check"
                mode="outlined"
                compact
                style={styles.statusChip}
                textStyle={styles.chipText}
              >
                Exists
              </Chip>
            )}
            {!contact.isValid && (
              <Chip
                icon="account-off"
                mode="outlined"
                compact
                style={styles.statusChip}
                textStyle={styles.chipText}
              >
                Invalid
              </Chip>
            )}
            <Checkbox
              status={isSelected ? "checked" : "unchecked"}
              onPress={() => handleContactToggle(contact.id)}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = (letter: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{letter}</Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* WhatsApp-style header */}
      <View style={styles.headerTop}>
        <IconButton
          icon="close"
          size={24}
          onPress={onDismiss}
          style={styles.closeButton}
          iconColor="#000000"
        />
        <Text variant="headlineSmall" style={styles.title}>
          Select contacts
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search name or number"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          iconColor="#8E8E93"
        />
      </View>

      {/* Quick actions section */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionItem}>
          <View style={styles.quickActionIcon}>
            <IconButton icon="account-group" size={20} iconColor="#25D366" />
          </View>
          <Text style={styles.quickActionText}>New group</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionItem}>
          <View style={styles.quickActionIcon}>
            <IconButton icon="account-plus" size={20} iconColor="#25D366" />
          </View>
          <Text style={styles.quickActionText}>New contact</Text>
        </TouchableOpacity>
      </View>

      <Divider style={styles.headerDivider} />

      {/* Stats and selection controls */}
      <View style={styles.statsContainer}>
        <View style={styles.stats}>
          <Text variant="bodyMedium" style={styles.statsText}>
            {validContacts.length} valid contacts
          </Text>
          <Text variant="bodyMedium" style={styles.selectedText}>
            {selectedContacts.size} selected
          </Text>
        </View>

        {selectedContacts.size > 0 && (
          <View style={styles.selectionActions}>
            <Button
              mode="text"
              onPress={handleClearSelection}
              compact
              textColor="#25D366"
            >
              Clear
            </Button>
            <Button
              mode="text"
              onPress={handleSelectAll}
              compact
              textColor="#25D366"
            >
              Select All
            </Button>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>
        {searchQuery ? "Search results" : "Contacts"}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (selectedContacts.size === 0) return null;

    return (
      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleConfirmSelection}
          style={styles.confirmButton}
          contentStyle={styles.confirmButtonContent}
          buttonColor="#25D366"
        >
          Add {selectedContacts.size} contact
          {selectedContacts.size !== 1 ? "s" : ""}
        </Button>
      </View>
    );
  };

  const renderAlphabetIndex = () => (
    <View style={styles.alphabetIndex}>
      {"ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("").map((letter) => (
        <TouchableOpacity key={letter} style={styles.alphabetLetter}>
          <Text style={styles.alphabetLetterText}>{letter}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <Surface style={styles.modalSurface} elevation={0}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

          {isLoading ? (
            <View style={styles.loadingContent}>
              <Text variant="titleMedium" style={styles.loadingTitle}>
                Loading contacts...
              </Text>
              <ProgressBar indeterminate style={styles.progressBar} />
              <Text variant="bodyMedium" style={styles.loadingDescription}>
                Reading your contacts and validating phone numbers
              </Text>
            </View>
          ) : (
            <>
              {renderHeader()}

              <View style={styles.listContainer}>
                <FlashList
                  data={groupedContactsData}
                  renderItem={({ item }: { item: ListItem }) => {
                    if (item.type === "header") {
                      return renderSectionHeader(
                        (item as SectionHeader).letter
                      );
                    }
                    return renderContactItem({
                      item: item as ProcessedContact,
                    });
                  }}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={styles.emptyState}>
                      <Text variant="titleMedium" style={styles.emptyTitle}>
                        No contacts found
                      </Text>
                      <Text
                        variant="bodyMedium"
                        style={styles.emptyDescription}
                      >
                        {searchQuery
                          ? "Try a different search term"
                          : "No valid contacts available"}
                      </Text>
                    </View>
                  }
                />
              </View>

              {/* Alphabet index (like WhatsApp) */}
              {!searchQuery && renderAlphabetIndex()}

              {renderFooter()}
            </>
          )}
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    margin: 0,
  },
  modalSurface: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "ios" ? 44 : 8, // Account for status bar
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingVertical: 8,
    minHeight: 56,
  },
  closeButton: {
    margin: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    flex: 1,
    textAlign: "center",
    marginRight: 40, // To center properly with close button
  },
  headerRight: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchbar: {
    backgroundColor: "#F6F6F6",
    elevation: 0,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  searchInput: {
    fontSize: 16,
    color: "#000000",
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  quickActions: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  quickActionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    minHeight: 56,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F6F6F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  quickActionText: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "400",
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  headerDivider: {
    marginTop: 8,
    backgroundColor: "#E5E5EA",
    height: 1,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    minHeight: 32,
  },
  statsText: {
    fontSize: 14,
    color: "#8E8E93",
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  selectedText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#25D366",
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  selectionActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F6F6F6",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  listContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  sectionHeader: {
    backgroundColor: "#F6F6F6",
    paddingHorizontal: 16,
    paddingVertical: 6,
    minHeight: 32,
    justifyContent: "center",
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
    textTransform: "uppercase",
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  contactItem: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  contactContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    minHeight: 64,
  },
  contactLeft: {
    marginRight: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#25D366",
  },
  avatarText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  contactInfo: {
    flex: 1,
    justifyContent: "center",
  },
  contactName: {
    fontSize: 16,
    fontWeight: "400",
    color: "#000000",
    marginBottom: 2,
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  contactPhone: {
    fontSize: 14,
    color: "#8E8E93",
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  contactRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusChip: {
    height: 24,
    borderColor: "#E5E5EA",
  },
  chipText: {
    fontSize: 12,
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  emptyTitle: {
    marginBottom: 8,
    color: "#000000",
    textAlign: "center",
  },
  emptyDescription: {
    textAlign: "center",
    color: "#8E8E93",
  },
  footer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    ...Platform.select({
      ios: {
        paddingBottom: 34, // Account for home indicator
      },
    }),
  },
  confirmButton: {
    borderRadius: 8,
    minHeight: 48,
  },
  confirmButtonContent: {
    paddingVertical: 4,
    minHeight: 48,
  },
  alphabetIndex: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: [{ translateY: -150 }],
    backgroundColor: "transparent",
    paddingVertical: 8,
    zIndex: 1,
  },
  alphabetLetter: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    alignItems: "center",
    minHeight: 20,
  },
  alphabetLetterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#25D366",
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingTitle: {
    marginBottom: 16,
    color: "#000000",
    textAlign: "center",
  },
  progressBar: {
    width: "100%",
    marginBottom: 16,
  },
  loadingDescription: {
    textAlign: "center",
    color: "#8E8E93",
  },
});

// Hook for using the contact picker
export const useContactPicker = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [pickerProps, setPickerProps] = useState<{
    existingPhones?: string[];
    maxSelection?: number;
    onContactsSelected?: (contacts: ProcessedContact[]) => void;
  }>({});

  const showContactPicker = useCallback(
    (options: {
      existingPhones?: string[];
      maxSelection?: number;
      onContactsSelected: (contacts: ProcessedContact[]) => void;
    }) => {
      setPickerProps(options);
      setIsVisible(true);
    },
    []
  );

  const hideContactPicker = useCallback(() => {
    setIsVisible(false);
    setPickerProps({});
  }, []);

  const ContactPickerComponent = useCallback(() => {
    if (!isVisible) return null;

    return (
      <ContactPicker
        visible={isVisible}
        onDismiss={hideContactPicker}
        onContactsSelected={(contacts) => {
          pickerProps.onContactsSelected?.(contacts);
          hideContactPicker();
        }}
        existingPhones={pickerProps.existingPhones}
        maxSelection={pickerProps.maxSelection}
      />
    );
  }, [isVisible, pickerProps, hideContactPicker]);

  return {
    showContactPicker,
    hideContactPicker,
    ContactPickerComponent,
  };
};
