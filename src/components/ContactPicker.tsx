import { ExtendedKlyntlTheme, useKlyntlColors } from "@/constants/KlyntlTheme";
import { groupContactsAlphabetically } from "@/utils/grouping";
import { hp, wp } from "@/utils/responsive_dimensions_system";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  IconButton,
  Modal,
  Portal,
  ProgressBar,
  Searchbar,
  Surface,
  Text,
  useTheme,
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
  const theme = useTheme<ExtendedKlyntlTheme>();
  const colors = useKlyntlColors(theme);

  const [contacts, setContacts] = useState<ProcessedContact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLimitedAccess, setIsLimitedAccess] = useState(false);
  const [totalAvailableContacts, setTotalAvailableContacts] = useState(0);

  // Create styles with theme colors
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!visible) {
      setSelectedContacts(new Set());
      setSearchQuery("");
      setContacts([]);
      setIsLimitedAccess(false);
      setTotalAvailableContacts(0);
    }
  }, [visible]);

  // Helper function to get contact access history
  const getContactAccessHistory = useCallback(async () => {
    try {
      const historyData = await AsyncStorage.getItem("contactAccessHistory");
      if (historyData) {
        const { contactCount } = JSON.parse(historyData);
        return {
          previousContactCount: contactCount,
          hasAccessHistory: true,
        };
      }
      return { previousContactCount: 0, hasAccessHistory: false };
    } catch (error) {
      console.error("Failed to get contact access history:", error);
      return { previousContactCount: 0, hasAccessHistory: false };
    }
  }, []);

  // Helper function to check for limited access
  const checkLimitedAccess = useCallback(
    async (data: Contacts.Contact[]): Promise<boolean> => {
      try {
        // Use built-in accessPrivileges if available (iOS 18+)
        const { accessPrivileges } = await Contacts.getPermissionsAsync();
        if (accessPrivileges) {
          return accessPrivileges === "limited";
        }

        // Fallback to heuristic detection
        const { previousContactCount, hasAccessHistory } =
          await getContactAccessHistory();

        if (data.length === 0) return false;

        if (hasAccessHistory && data.length < previousContactCount) {
          return true;
        }

        if (data.length < 10) {
          return true;
        }

        if (data.length < 50) {
          const lastNames = data
            .filter((contact) => contact.lastName)
            .map((contact) => contact.lastName);
          const uniqueLastNames = new Set(lastNames);

          if (uniqueLastNames.size <= 2 && uniqueLastNames.size > 0) {
            return true;
          }
        }

        return false;
      } catch {
        // If detection fails, assume not limited
        return false;
      }
    },
    [getContactAccessHistory]
  );

  // Present contact access picker (iOS 18+ only)
  const presentContactAccessPicker = useCallback(async () => {
    try {
      if (Contacts.presentAccessPickerAsync) {
        return await Contacts.presentAccessPickerAsync();
      }
      return null;
    } catch (error) {
      console.error("Failed to present contact access picker:", error);
      return null;
    }
  }, []);

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

      // Check for limited access and set state
      const isLimited = await checkLimitedAccess(data);
      setIsLimitedAccess(isLimited);
      setTotalAvailableContacts(data.length);

      console.log(
        "Limited access detected:",
        isLimited,
        "Contacts:",
        data.length
      );

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
  }, [visible, existingPhones, onDismiss, checkLimitedAccess]);

  useEffect(() => {
    if (visible) {
      loadContacts();
    }
  }, [visible, loadContacts]);

  // DISABLED FILTERING - Show all contacts regardless of validity status
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

    // console.log("Filtered contacts for display:", filtered.length);
    return filtered;
  }, [contacts, searchQuery]);

  // Update valid contacts count to show all contacts
  const validContacts = contacts; // Show all for now

  const handleManageContacts = async () => {
    try {
      setIsLoading(true);

      // Try to present the contact access picker for iOS 18+
      const newlyGrantedContacts = await presentContactAccessPicker();

      if (newlyGrantedContacts || Platform.OS === "android") {
        // Small delay to allow system to process the permission change
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Reload contacts after permission change
        await loadContacts();
      } else {
        // Fallback: Show alert explaining the situation
        Alert.alert(
          "Manage Contact Access",
          "To access more contacts, you can go to Settings > Privacy & Security > Contacts > [App Name] and select 'Full Access'.",
          [
            {
              text: "OK",
              style: "default",
            },
          ]
        );
      }
    } catch (error) {
      console.error("Failed to manage contacts:", error);
      Alert.alert(
        "Error",
        "Unable to manage contact access. Please try going to Settings manually.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactToggle = useCallback(
    (contactId: string) => {
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
    },
    [selectedContacts, maxSelection]
  );

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
    return groupContactsAlphabetically(filteredContacts);
  }, [filteredContacts]);

  // console.log({
  //   filteredContactsLength: filteredContacts.length,
  //   groupedContactsDataLength: groupedContactsData.length,
  //   groupedContactsData,
  // });

  const renderContactItem = useCallback(
    ({ item: contact }: { item: ProcessedContact }) => {
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
    },
    [selectedContacts, handleContactToggle, styles]
  );

  const renderSectionHeader = useCallback(
    (letter: string) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{letter}</Text>
      </View>
    ),
    [styles]
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
          buttonColor={colors.primary[500]}
        >
          Add {selectedContacts.size} contact
          {selectedContacts.size !== 1 ? "s" : ""}
        </Button>
      </View>
    );
  };

  // Fixed render function for FlashList
  const renderListItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === "header") {
        return renderSectionHeader((item as SectionHeader).letter);
      }
      return renderContactItem({ item: item as ProcessedContact });
    },
    [renderContactItem, renderSectionHeader]
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
        style={styles.modal}
        dismissable={!isLoading}
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
            <View style={styles.mainContainer}>
              {/* Sticky Header - Title and Close Button */}
              <View style={styles.stickyHeader}>
                <View style={styles.headerTop}>
                  <IconButton
                    icon="close"
                    size={24}
                    onPress={onDismiss}
                    style={styles.closeButton}
                    iconColor={colors.paper.onSurface}
                  />
                  <Text variant="headlineSmall" style={styles.title}>
                    Select contacts
                  </Text>
                  <View style={styles.headerRight} />
                </View>
              </View>

              {/* Sticky Search Bar */}
              <View style={styles.stickySearchContainer}>
                <View style={styles.searchContainer}>
                  <Searchbar
                    placeholder="Search name or number"
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchbar}
                    inputStyle={styles.searchInput}
                    iconColor={colors.paper.onSurfaceVariant}
                  />
                </View>
              </View>

              {/* Non-scrollable header content */}
              <View style={styles.headerContent}>
                {/* Quick actions section */}
                {/* <View style={styles.quickActions}>
                  <TouchableOpacity style={styles.quickActionItem}>
                    <View style={styles.quickActionIcon}>
                      <IconButton
                        icon="account-plus"
                        size={20}
                        iconColor={colors.primary[500]}
                      />
                    </View>
                    <Text style={styles.quickActionText}>New contact</Text>
                  </TouchableOpacity>
                </View> */}

                {/* <Divider style={styles.headerDivider} /> */}

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
                        textColor={colors.primary[500]}
                      >
                        Clear
                      </Button>
                      <Button
                        mode="text"
                        onPress={handleSelectAll}
                        compact
                        textColor={colors.primary[500]}
                      >
                        Select All
                      </Button>
                    </View>
                  )}
                </View>

                {/* Limited Access Message */}
                {isLimitedAccess && (
                  <View style={styles.limitedAccessContainer}>
                    <Surface style={styles.limitedAccessCard} elevation={1}>
                      <View style={styles.limitedAccessContent}>
                        <View style={styles.limitedAccessIcon}>
                          <IconButton
                            icon="account-lock"
                            size={20}
                            iconColor={colors.warning[500]}
                          />
                        </View>
                        <View style={styles.limitedAccessText}>
                          <Text style={styles.limitedAccessTitle}>
                            Limited Contact Access
                          </Text>
                          <Text style={styles.limitedAccessDescription}>
                            You&apos;ve given access to {totalAvailableContacts}{" "}
                            contacts. You can select more contacts to access.
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.manageButton}
                          onPress={handleManageContacts}
                          disabled={isLoading}
                        >
                          <Text style={styles.manageButtonText}>Manage</Text>
                        </TouchableOpacity>
                      </View>
                    </Surface>
                  </View>
                )}

                <Text style={styles.sectionTitle}>
                  {searchQuery ? "Search results" : "Contacts"}
                </Text>
              </View>

              {/* Scrollable Contacts List with Sticky Headers */}
              <View style={styles.scrollableContainer}>
                <FlashList
                  data={groupedContactsData}
                  renderItem={renderListItem}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.flashListContent}
                  stickyHeaderIndices={groupedContactsData
                    .map((item, index) => (item.type === "header" ? index : -1))
                    .filter((index) => index !== -1)}
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

              {/* Footer */}
              {renderFooter()}
            </View>
          )}
        </Surface>
      </Modal>
    </Portal>
  );
};

// Create styles function that takes colors as parameter
const createStyles = (colors: ReturnType<typeof useKlyntlColors>) =>
  StyleSheet.create({
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
      flex: 1,
      backgroundColor: colors.paper.surface,
    },
    header: {
      backgroundColor: colors.paper.surface,
      paddingTop: Platform.OS === "ios" ? 10 : 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.paper.outline,
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
      color: colors.paper.onSurface,
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
      backgroundColor: colors.paper.surfaceVariant,
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
      color: colors.paper.onSurface,
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
      backgroundColor: colors.paper.surfaceVariant,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    quickActionText: {
      fontSize: 16,
      color: colors.paper.onSurface,
      fontWeight: "400",
      ...Platform.select({
        android: {
          includeFontPadding: false,
        },
      }),
    },
    headerDivider: {
      marginTop: 8,
      backgroundColor: colors.paper.outline,
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
      color: colors.paper.onSurfaceVariant,
      ...Platform.select({
        android: {
          includeFontPadding: false,
        },
      }),
    },
    selectedText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.success[500],
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
      color: colors.paper.onSurfaceVariant,
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.paper.surfaceVariant,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      ...Platform.select({
        android: {
          includeFontPadding: false,
        },
      }),
    },
    flashListContent: {
      paddingBottom: 20,
    },
    sectionHeader: {
      backgroundColor: colors.paper.surfaceVariant,
      paddingHorizontal: 16,
      paddingVertical: 8,
      minHeight: 32,
      justifyContent: "center",
      borderBottomWidth: 1,
      borderBottomColor: colors.paper.outline,
      ...Platform.select({
        ios: {
          shadowColor: colors.neutral.black,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 1,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    sectionHeaderText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.paper.onSurfaceVariant,
      textTransform: "uppercase",
      ...Platform.select({
        android: {
          includeFontPadding: false,
        },
      }),
    },
    contactItem: {
      backgroundColor: colors.paper.surface,
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
      backgroundColor: colors.primary[500],
    },
    avatarText: {
      color: colors.neutral.white,
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
      color: colors.paper.onSurface,
      marginBottom: 2,
      ...Platform.select({
        android: {
          includeFontPadding: false,
        },
      }),
    },
    contactPhone: {
      fontSize: 14,
      color: colors.paper.onSurfaceVariant,
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
      borderColor: colors.paper.outline,
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
      color: colors.paper.onSurface,
      textAlign: "center",
    },
    emptyDescription: {
      textAlign: "center",
      color: colors.paper.onSurfaceVariant,
    },
    footer: {
      backgroundColor: colors.paper.surface,
      paddingHorizontal: wp(16),
      paddingVertical: hp(12),
      borderTopWidth: 1,
      borderTopColor: colors.paper.outline,
    },
    confirmButton: {
      borderRadius: 8,
      minHeight: hp(48),
    },
    confirmButtonContent: {
      paddingVertical: 4,
      minHeight: hp(48),
    },
    loadingContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: wp(32),
    },
    loadingTitle: {
      marginBottom: hp(16),
      color: colors.paper.onSurface,
      textAlign: "center",
    },
    progressBar: {
      width: "100%",
      marginBottom: 16,
    },
    loadingDescription: {
      textAlign: "center",
      color: colors.paper.onSurfaceVariant,
    },
    limitedAccessContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    limitedAccessCard: {
      backgroundColor: colors.warning[50],
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.warning[200],
    },
    limitedAccessContent: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
    },
    limitedAccessIcon: {
      marginRight: 12,
    },
    limitedAccessText: {
      flex: 1,
      marginRight: 12,
    },
    limitedAccessTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.warning[800],
      marginBottom: 2,
      ...Platform.select({
        android: {
          includeFontPadding: false,
        },
      }),
    },
    limitedAccessDescription: {
      fontSize: 12,
      color: colors.warning[700],
      lineHeight: 16,
      ...Platform.select({
        android: {
          includeFontPadding: false,
        },
      }),
    },
    manageButton: {
      backgroundColor: colors.warning[500],
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      minWidth: 60,
      alignItems: "center",
      justifyContent: "center",
    },
    manageButtonText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.neutral.white,
      ...Platform.select({
        android: {
          includeFontPadding: false,
        },
      }),
    },
    // New styles for sticky layout
    mainContainer: {
      flex: 1,
    },
    stickyHeader: {
      backgroundColor: colors.paper.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.paper.outline,
      ...Platform.select({
        ios: {
          shadowColor: colors.neutral.black,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    stickySearchContainer: {
      backgroundColor: colors.paper.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.paper.outline,
      ...Platform.select({
        ios: {
          shadowColor: colors.neutral.black,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    headerContent: {
      backgroundColor: colors.paper.surface,
    },
    scrollableContainer: {
      flex: 1,
    },
  });
