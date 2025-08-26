import { ContactImportButton } from "@/components/ContactImportButton";
import { CustomerCard } from "@/components/CustomerCard";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useCustomers } from "@/services/database/context";
import { useCustomerStore } from "@/stores/customerStore";
import { Customer } from "@/types/customer";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { FAB, Searchbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CustomerListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { getCustomers } = useCustomers();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const customerList = await getCustomers();
      setCustomers(customerList);
      setFilteredCustomers(customerList);
    } catch (error) {
      console.error("Failed to load customers:", error);
      Alert.alert("Error", "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [getCustomers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCustomers();
    setRefreshing(false);
  }, [loadCustomers]);

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [loadCustomers])
  );

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (query.trim() === "") {
        setFilteredCustomers(customers);
      } else {
        const filtered = customers.filter(
          (customer) =>
            customer.name.toLowerCase().includes(query.toLowerCase()) ||
            customer.phone.includes(query)
        );
        setFilteredCustomers(filtered);
      }
    },
    [customers]
  );

  const handleCustomerPress = (customer: Customer) => {
    router.push(`/customer/${customer.id}`);
  };

  const handleAddCustomer = () => {
    router.push("/customer/add");
  };

  const handleImportComplete = async (result: {
    imported: number;
    skipped: number;
  }) => {
    await loadCustomers(); // Reload the customer list
  };

  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <CustomerCard customer={item} onPress={() => handleCustomerPress(item)} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconSymbol
        name="person.2.fill"
        size={64}
        color={Colors[colorScheme ?? "light"].tabIconDefault}
      />
      <ThemedText type="title" style={styles.emptyTitle}>
        No customers yet
      </ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        Add your first customer to get started
      </ThemedText>
      <View style={styles.emptyActions}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddCustomer}>
          <ThemedText style={styles.addButtonText}>Add Customer</ThemedText>
        </TouchableOpacity>
        <ContactImportButton
          variant="button"
          size="medium"
          onImportComplete={handleImportComplete}
        />
      </View>
    </View>
  );

  const [fabOpen, setFabOpen] = useState(false);
  const { importFromContacts, checkContactAccess } = useCustomerStore();

  const renderHeader = () => (
    <View style={styles.header}>
      <ThemedText type="title">Customers</ThemedText>
      <ThemedText style={styles.customerCount}>
        {filteredCustomers.length}{" "}
        {filteredCustomers.length === 1 ? "customer" : "customers"}
      </ThemedText>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content}>
        {renderHeader()}

        <Searchbar
          placeholder="Search customers..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
        />

        {filteredCustomers.length === 0 && !loading ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredCustomers}
            renderItem={renderCustomerItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* FAB Group for Add and Import actions */}
        <FAB.Group
          visible={true}
          open={fabOpen}
          icon={fabOpen ? "close" : "plus"}
          actions={[
            {
              icon: "account-plus",
              label: "Add Customer",
              onPress: handleAddCustomer,
              color: "#007AFF",
            },
            {
              icon: "account-multiple-plus",
              label: "Import Contacts",
              onPress: async () => {
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
                          const result = await importFromContacts(true);
                          await loadCustomers();

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
                    text: accessStatus.isLimited
                      ? "Import Available"
                      : "Import",
                    onPress: async () => {
                      try {
                        const result = await importFromContacts(
                          !accessStatus.isLimited
                        );
                        await loadCustomers();

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
                  console.error("Failed to check contact access:", error);
                  Alert.alert(
                    "Error",
                    "Failed to check contact access. Please try again."
                  );
                }
              },
              color: "#007AFF",
            },
          ]}
          onStateChange={(state: { open: boolean }) => setFabOpen(state.open)}
          style={styles.fabGroup}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fabGroup: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  customerCount: {
    marginTop: 4,
    opacity: 0.7,
  },
  searchbar: {
    margin: 16,
    marginTop: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 24,
  },
  emptyActions: {
    flexDirection: "row",
    gap: 12,
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    right: 16,
    bottom: 70, // Increased from 16 to avoid tab bar
    backgroundColor: "#007AFF",
    borderRadius: 28,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  importFab: {
    position: "absolute",
    right: 16,
    bottom: 140, // Position above main FAB
  },
});
