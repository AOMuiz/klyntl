import { hp, wp } from "@/utils/responsive_dimensions_system";
import { FlashList } from "@shopify/flash-list";
import * as Contacts from "expo-contacts";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
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

export interface ProcessedContact {
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

export interface ContactPickerProps {
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

      console.log("Starting to process contacts...", data.length);

      for (const contact of data) {
        console.log(
          "Processing contact:",
          contact.name,
          contact.phoneNumbers?.length
        );

        if (!contact.phoneNumbers?.length) {
          console.log("Skipping contact - no phone numbers:", contact.name);
          continue;
        }

        // Process each phone number
        for (const phoneNumber of contact.phoneNumbers) {
          console.log("Processing phone number:", phoneNumber);

          if (!phoneNumber.number) {
            console.log("Skipping phone number - no number");
            continue;
          }

          const cleanPhone = phoneNumber.number.replace(/\D/g, "");
          console.log("Clean phone:", cleanPhone);

          // DISABLED STRICT FILTERING - Accept any phone number with 7+ digits
          const isValid = cleanPhone.length >= 7;

          console.log("Is valid:", isValid);

          const isDuplicate = existingPhones.includes(cleanPhone);
          console.log("Is duplicate:", isDuplicate);

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

          const processedContact = {
            id: `${contact.id}-${cleanPhone}`,
            name,
            phone: cleanPhone,
            email: contact.emails?.[0]?.email,
            initials,
            isValid,
            isDuplicate,
          };

          console.log("Adding processed contact:", processedContact);
          processedContacts.push(processedContact);

          // Only take first phone per contact to avoid duplicates
          break;
        }
      }

      console.log("Final processed contacts:", processedContacts.length);
      console.log(
        "Valid contacts:",
        processedContacts.filter((c) => c.isValid).length
      );
      console.log(
        "Non-duplicate contacts:",
        processedContacts.filter((c) => !c.isDuplicate).length
      );

      // Remove duplicates and sort
      const uniqueContacts = processedContacts.filter(
        (contact, index, self) =>
          index === self.findIndex((c) => c.phone === contact.phone)
      );

      uniqueContacts.sort((a, b) => a.name.localeCompare(b.name));
      setContacts(uniqueContacts);

      console.log("Final unique contacts set:", uniqueContacts.length);
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

  // DISABLED FILTERING - Show all contacts regardless of validation status
  const filteredContacts = useMemo(() => {
    let filtered = contacts; // Show ALL contacts - no filtering by validity or duplicates

    // Apply search query only
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (contact) =>
          contact.name.toLowerCase().includes(query) ||
          contact.phone.includes(query)
      );
    }

    console.log("Filtered contacts for display:", filtered.length);
    return filtered;
  }, [contacts, searchQuery]);

  // Update valid contacts count to show all contacts
  const validContacts = contacts; // Show all for now

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

    console.log("Grouped data for FlashList:", flatData.length);
    return flatData;
  }, [filteredContacts]);

  console.log({
    filteredContactsLength: filteredContacts.length,
    groupedContactsDataLength: groupedContactsData.length,
    groupedContactsData,
  });

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
            {validContacts.length} contacts
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

  // Fixed render function for FlashList
  const renderListItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === "header") {
        return renderSectionHeader((item as SectionHeader).letter);
      }
      return renderContactItem({ item: item as ProcessedContact });
    },
    [selectedContacts]
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
        style={styles.modal}
      >
        <Surface style={styles.modalSurface}>
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
                  renderItem={renderListItem}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.flashListContent}
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
                          : "No contacts available"}
                      </Text>
                    </View>
                  }
                />
              </View>

              {/* Alphabet index (like WhatsApp) */}
              {/* {!searchQuery &&
                filteredContacts.length > 0 &&
                renderAlphabetIndex()} */}

              {renderFooter()}
            </>
          )}
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    margin: 0,
    padding: 0,
    height: "auto",
  },
  modalSurface: {
    flex: 1, // FIXED: Uncommented this line
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "ios" ? 10 : 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingVertical: 8,
    minHeight: hp(56),
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
    marginRight: 40,
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
    flex: 1, // FIXED: Added flex: 1 to ensure proper height
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  // FIXED: Added proper FlashList content container style
  flashListContent: {
    paddingBottom: 20, // Add some bottom padding
  },
  sectionHeader: {
    backgroundColor: "#F6F6F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    // height: hp(30),
    borderColor: "#E5E5EA",
  },
  chipText: {
    fontSize: wp(12),
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
        paddingBottom: 34,
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
  // FIXED ALPHABET INDEX STYLES
  alphabetIndex: {
    position: "absolute",
    right: 2,
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    zIndex: 1000,
  },
  alphabetLetter: {
    width: 16,
    height: 14,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 0.5,
  },
  alphabetLetterText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#25D366",
    lineHeight: 10,
    textAlign: "center",
    ...Platform.select({
      android: {
        includeFontPadding: false,
        textAlignVertical: "center",
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
