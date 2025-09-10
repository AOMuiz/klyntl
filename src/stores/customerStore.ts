import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Contacts from "expo-contacts";
import { create } from "zustand";
import { db } from "../services/database/db";
import { DatabaseService } from "../services/database/service";
import {
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
} from "../types/customer";
import {
  CUSTOMER_FILTER_PRESETS,
  CustomerFilters,
  FilterPreset,
  SortOptions,
  getFilterDescription,
} from "../types/filters";
import { validatePhoneNumber } from "../utils/contactValidation";

// Create database service instance
let databaseService: DatabaseService = new DatabaseService(db);
// Export a setter so tests can inject a mocked DatabaseService instance
export const setDatabaseService = (svc: DatabaseService) => {
  databaseService = svc;
};

// Helper function to invalidate analytics cache
const invalidateAnalyticsCache = () => {
  // In test environment, skip analytics cache invalidation
  if (typeof jest !== "undefined") {
    return;
  }

  // Import analytics store dynamically to avoid circular dependency
  import("./analyticsStore")
    .then(({ useAnalyticsStore }) => {
      const store = useAnalyticsStore.getState();
      store.reset(); // Reset analytics cache when customer data changes
    })
    .catch(() => {
      // Gracefully handle import failures
      console.debug("Analytics cache invalidation skipped");
    });
};

interface CustomerStore {
  customers: Customer[];
  loading: boolean;
  searchQuery: string;
  selectedCustomer: Customer | null;
  error: string | null;

  // Pagination state
  currentPage: number;
  hasNextPage: boolean;
  loadingMore: boolean;
  pageSize: number;

  // Filtering state
  activeFilters: CustomerFilters;
  sortOptions: SortOptions;
  filterPresets: FilterPreset[];
  appliedFilterDescription: string;
  totalCustomersCount: number;
  filteredCustomersCount: number;

  // Actions
  fetchCustomers: () => Promise<void>;
  searchCustomers: (query: string) => Promise<void>;
  getCustomerById: (id: string) => Promise<Customer | null>;
  addCustomer: (customer: CreateCustomerInput) => Promise<void>;
  updateCustomer: (id: string, updates: UpdateCustomerInput) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  selectCustomer: (customer: Customer | null) => void;

  // Pagination actions
  loadMoreCustomers: () => Promise<void>;
  resetPagination: () => void;

  // Filtering actions
  setFilters: (filters: CustomerFilters) => void;
  setSortOptions: (sort: SortOptions) => void;
  applyFilters: () => Promise<void>;
  clearFilters: () => Promise<void>;
  applyFilterPreset: (presetId: string) => Promise<void>;
  getFilterDescription: () => string;

  // Contact import actions
  importFromContacts: (
    forceRefresh?: boolean
  ) => Promise<{ imported: number; skipped: number }>;
  checkContactAccess: () => Promise<{
    hasAccess: boolean;
    isLimited: boolean;
    contactCount: number;
  }>;
  getContactAccessHistory: () => Promise<{
    previousContactCount: number;
    hasAccessHistory: boolean;
  }>;
  saveContactAccessHistory: (contactCount: number) => Promise<void>;
  clearImportCache: () => Promise<void>;
  presentContactAccessPicker: () => Promise<{
    success: boolean;
    newContactsCount: number;
  }>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  customers: [],
  loading: false,
  searchQuery: "",
  selectedCustomer: null,
  error: null,
  // Pagination state
  currentPage: 1,
  hasNextPage: true,
  loadingMore: false,
  pageSize: 20,
  // Filtering state
  activeFilters: {} as CustomerFilters,
  sortOptions: { field: "name", direction: "asc" } as SortOptions,
  filterPresets: CUSTOMER_FILTER_PRESETS,
  appliedFilterDescription: "All customers",
  totalCustomersCount: 0,
  filteredCustomersCount: 0,
};

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  ...initialState,

  fetchCustomers: async () => {
    set({ loading: true, error: null, currentPage: 1, hasNextPage: true });
    try {
      const { activeFilters, sortOptions, searchQuery, pageSize } = get();
      console.log("Fetching customers with pagination:", {
        page: 1,
        pageSize,
        searchQuery,
      });

      const [customers, totalCount] = await Promise.all([
        databaseService.customers.findWithFilters(
          activeFilters,
          searchQuery || undefined,
          0, // page (0-based)
          pageSize,
          sortOptions
        ),
        databaseService.customers.countWithFilters(
          activeFilters,
          searchQuery || undefined
        ),
      ]);

      console.log("Customers fetched:", {
        loadedCount: customers.length,
        totalCount,
        hasNextPage: customers.length === pageSize && totalCount > pageSize,
      });

      set({
        customers,
        loading: false,
        totalCustomersCount: totalCount,
        filteredCustomersCount: customers.length, // Show currently loaded count, not total
        appliedFilterDescription: getFilterDescription(activeFilters),
        currentPage: 1,
        hasNextPage: customers.length === pageSize && totalCount > pageSize,
      });
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      set({
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch customers",
      });
    }
  },

  searchCustomers: async (query: string) => {
    set({
      searchQuery: query,
      loading: true,
      error: null,
      currentPage: 1,
      hasNextPage: true,
    });
    try {
      const { activeFilters, sortOptions, pageSize } = get();
      const [customers, totalCount] = await Promise.all([
        databaseService.customers.findWithFilters(
          activeFilters,
          query || undefined,
          0, // page (0-based)
          pageSize,
          sortOptions
        ),
        databaseService.customers.countWithFilters(
          activeFilters,
          query || undefined
        ),
      ]);

      set({
        customers,
        loading: false,
        filteredCustomersCount: customers.length, // Show currently loaded count, not total
        appliedFilterDescription: getFilterDescription(activeFilters),
        currentPage: 1,
        hasNextPage: customers.length === pageSize && totalCount > pageSize,
      });
    } catch (error) {
      console.error("Failed to search customers:", error);
      set({
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to search customers",
      });
    }
  },

  getCustomerById: async (id: string) => {
    set({ error: null });
    try {
      const customer = await databaseService.customers.findById(id);
      return customer;
    } catch (error) {
      console.error("Failed to get customer:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to get customer";
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  addCustomer: async (customerData: CreateCustomerInput) => {
    set({ error: null });
    try {
      const newCustomer = await databaseService.customers.createCustomer(
        customerData
      );
      const { customers } = get();
      set({ customers: [newCustomer, ...customers] });

      // Invalidate analytics cache since customer data changed
      invalidateAnalyticsCache();
    } catch (error) {
      console.error("Failed to add customer:", error);

      // Handle specific database constraint errors
      let errorMessage = "Failed to add customer";
      if (error instanceof Error) {
        if (
          error.message.includes("UNIQUE constraint failed: customers.phone")
        ) {
          errorMessage = "A customer with this phone number already exists";
        } else {
          errorMessage = error.message;
        }
      }

      set({ error: errorMessage });
      // Don't throw the error - just set it in the store state
    }
  },

  updateCustomer: async (id: string, updates: UpdateCustomerInput) => {
    set({ error: null });
    try {
      await databaseService.customers.updateCustomer(id, updates);
      const { customers } = get();
      const updatedCustomers = customers.map((customer) =>
        customer.id === id
          ? { ...customer, ...updates, updatedAt: new Date().toISOString() }
          : customer
      );
      set({ customers: updatedCustomers });

      // Update selected customer if it's the one being updated
      const { selectedCustomer } = get();
      if (selectedCustomer && selectedCustomer.id === id) {
        set({
          selectedCustomer: {
            ...selectedCustomer,
            ...updates,
            updatedAt: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error("Failed to update customer:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update customer";
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  deleteCustomer: async (id: string) => {
    set({ error: null });
    try {
      await databaseService.customers.deleteCustomer(id);
      const { customers } = get();
      const filteredCustomers = customers.filter(
        (customer) => customer.id !== id
      );
      set({ customers: filteredCustomers });

      // Clear selected customer if it's the one being deleted
      const { selectedCustomer } = get();
      if (selectedCustomer && selectedCustomer.id === id) {
        set({ selectedCustomer: null });
      }

      // Invalidate analytics cache since customer data changed
      invalidateAnalyticsCache();
    } catch (error) {
      console.error("Failed to delete customer:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete customer";
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  selectCustomer: (customer: Customer | null) => {
    set({ selectedCustomer: customer });
  },

  importFromContacts: async (forceRefresh: boolean = true) => {
    set({ error: null, loading: true });
    try {
      // Check current permission status first
      const permissionResponse = await Contacts.getPermissionsAsync();
      const { status: currentStatus, accessPrivileges } = permissionResponse;

      // If no permission or denied, request permissions
      if (currentStatus !== "granted") {
        const { status: newStatus } = await Contacts.requestPermissionsAsync();
        if (newStatus !== "granted") {
          set({ loading: false });
          throw new Error("Permission to access contacts was denied");
        }
      }

      // Get contacts with proper field specifications
      const contactOptions = {
        fields: [
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
        ],
        pageSize: 0, // Get all contacts
        sort: "firstName" as const, // Use proper sort type
      };

      let contactsResult = await Contacts.getContactsAsync(contactOptions);
      let data = contactsResult.data;

      // Smart limited access detection using built-in method first, then fallback to heuristics
      let isLikelyLimitedAccess = false;

      // Use built-in accessPrivileges if available (iOS 18+)
      if (accessPrivileges) {
        isLikelyLimitedAccess = accessPrivileges === "limited";
        console.log(`Built-in limited access detection: ${accessPrivileges}`);
      } else {
        // Fallback to heuristic detection for older versions
        const { previousContactCount, hasAccessHistory } =
          await get().getContactAccessHistory();

        // Detect limited access more intelligently:
        if (hasAccessHistory && data.length < previousContactCount) {
          // We had more contacts before - definitely limited access now
          isLikelyLimitedAccess = true;
          console.log(
            `Detected reduced contact access: ${data.length} now vs ${previousContactCount} previously`
          );
        } else if (data.length > 0 && data.length < 10) {
          // Very few contacts is suspicious
          isLikelyLimitedAccess = true;
        } else if (data.length < 50) {
          // Check for patterns suggesting limited selection
          const lastNames = data
            .filter((contact) => contact.lastName)
            .map((contact) => contact.lastName);
          const uniqueLastNames = new Set(lastNames);

          if (uniqueLastNames.size <= 2 && uniqueLastNames.size > 0) {
            isLikelyLimitedAccess = true;
            console.log(
              `Detected likely limited access based on name patterns: ${uniqueLastNames.size} unique last names`
            );
          }
        }
      }

      // Save current count for future comparisons
      await get().saveContactAccessHistory(data.length);

      // If user wants fresh access and we suspect limited access, try to expand permissions
      if (isLikelyLimitedAccess && forceRefresh) {
        try {
          console.log(
            `Detected likely limited access (${data.length} contacts), attempting to expand permissions...`
          );

          // For iOS 18+, use the built-in access picker
          if (
            accessPrivileges === "limited" &&
            Contacts.presentAccessPickerAsync
          ) {
            console.log("Using built-in access picker for iOS 18+...");
            try {
              const newlyGrantedContacts =
                await Contacts.presentAccessPickerAsync();
              console.log(
                `Access picker granted ${newlyGrantedContacts.length} additional contacts`
              );

              // Refresh contacts after using access picker
              const refreshedResult = await Contacts.getContactsAsync(
                contactOptions
              );
              if (refreshedResult.data.length > data.length) {
                data = refreshedResult.data;
                console.log(
                  `Successfully expanded contact access - now have ${data.length} contacts`
                );
              }
            } catch (accessPickerError) {
              console.log(
                "Access picker not available or failed:",
                accessPickerError
              );
              // Fall back to traditional permission request
            }
          }

          // Fallback: traditional permission request for older iOS versions
          if (!accessPrivileges || accessPrivileges !== "limited") {
            // On older iOS, requesting permissions again when already granted can trigger
            // the contact selection dialog to allow users to select more contacts
            const { status: refreshStatus, canAskAgain } =
              await Contacts.requestPermissionsAsync();

            if (refreshStatus === "granted") {
              // Wait a bit for iOS to process the permission change
              await new Promise((resolve) => setTimeout(resolve, 500));

              // Get contacts again after permission request
              const refreshedResult = await Contacts.getContactsAsync(
                contactOptions
              );

              // If we got significantly more contacts, user expanded access
              if (refreshedResult.data.length > data.length) {
                data = refreshedResult.data;
                console.log(
                  `Successfully expanded contact access - now have ${data.length} contacts (was ${contactsResult.data.length})`
                );
              } else {
                console.log(
                  `No expansion of contact access - still have ${data.length} contacts`
                );
              }
            } else if (!canAskAgain) {
              console.log(
                "Cannot request more permissions - access is permanently limited"
              );
            }
          }
        } catch (permissionError) {
          console.log("Failed to expand contact permissions:", permissionError);
          // Continue with existing contacts
        }
      }

      // Get fresh customer list from database to check for existing phone numbers
      const latestCustomers = await databaseService.customers.findAll();
      const existingPhones = new Set(
        latestCustomers.map((c) => c.phone.replace(/\D/g, ""))
      );

      let imported = 0;
      let skipped = 0;

      console.log(
        `Starting contact import. Found ${data.length} contacts to process.`
      );

      // Process contacts
      for (const contact of data) {
        // Build contact name from available fields
        const firstName = contact.firstName || "";
        const lastName = contact.lastName || "";
        const fullName = contact.name || `${firstName} ${lastName}`.trim();

        if (
          !fullName ||
          !contact.phoneNumbers ||
          contact.phoneNumbers.length === 0
        ) {
          skipped++;
          continue;
        }

        // Clean and validate phone number
        const phoneNumber =
          contact.phoneNumbers[0].number?.replace(/\D/g, "") || "";

        if (phoneNumber.length < 10 || existingPhones.has(phoneNumber)) {
          skipped++;
          continue;
        }

        // Format phone number for Nigeria
        let formattedPhone = phoneNumber;
        if (phoneNumber.startsWith("234")) {
          formattedPhone = "+" + phoneNumber;
        } else if (phoneNumber.startsWith("0")) {
          formattedPhone = "+234" + phoneNumber.substring(1);
        } else if (phoneNumber.length === 10) {
          formattedPhone = "+234" + phoneNumber;
        }

        // Validate Nigerian phone number format using proper validation function
        const phoneValidation = validatePhoneNumber(formattedPhone, "NG");
        if (!phoneValidation.isValid) {
          skipped++;
          continue;
        }

        try {
          // Check if customer already exists in database
          const existingCustomer = await databaseService.customers.findByPhone(
            formattedPhone
          );
          if (existingCustomer) {
            skipped++;
            continue;
          }

          const customerData: CreateCustomerInput = {
            name: fullName,
            phone: formattedPhone,
            email: contact.emails?.[0]?.email || undefined,
            contactSource: "imported",
          };

          await get().addCustomer(customerData);
          existingPhones.add(phoneNumber);
          imported++;

          // Limit to 50 imports at once for performance
          if (imported >= 50) {
            break;
          }
        } catch (error) {
          console.warn("Skipped importing contact:", fullName, error);
          skipped++;
        }
      }

      // Refresh customer list to reflect imports
      await get().fetchCustomers();

      set({ loading: false });
      console.log(
        `Contact import completed. Imported: ${imported}, Skipped: ${skipped}`
      );

      return { imported, skipped };
    } catch (error) {
      console.error("Failed to import contacts:", error);
      console.error("Error type:", typeof error);
      console.error("Error instanceof Error:", error instanceof Error);
      console.error(
        "Error message:",
        error instanceof Error ? error.message : String(error)
      );

      let errorMessage = "Failed to import contacts";

      // Preserve specific error messages for better error handling
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      set({ error: errorMessage, loading: false });
      throw error instanceof Error ? error : new Error(errorMessage);
    }
  },

  checkContactAccess: async () => {
    try {
      // Check permission status with built-in limited access detection
      const permissionResponse = await Contacts.getPermissionsAsync();
      const { status, accessPrivileges } = permissionResponse;

      if (status !== "granted") {
        return { hasAccess: false, isLimited: false, contactCount: 0 };
      }

      // Use built-in accessPrivileges if available (iOS 18+)
      let isLimited = false;
      if (accessPrivileges) {
        isLimited = accessPrivileges === "limited";
        console.log(`Built-in access detection: ${accessPrivileges}`);
      }

      // Get contact count for additional context
      const contactOptions = {
        fields: [Contacts.Fields.FirstName, Contacts.Fields.LastName],
        pageSize: 0,
        sort: "firstName" as const,
      };

      const { data } = await Contacts.getContactsAsync(contactOptions);
      const contactCount = data.length;

      // Fallback detection for older iOS versions or when accessPrivileges is not available
      if (!accessPrivileges) {
        // Get previous access history for comparison
        const { previousContactCount, hasAccessHistory } =
          await get().getContactAccessHistory();

        if (contactCount === 0) {
          // No contacts but permission granted - might be empty contact list
          isLimited = false;
        } else if (hasAccessHistory && contactCount < previousContactCount) {
          // We had more contacts before - definitely limited access now
          isLimited = true;
          console.log(
            `Detected limited access: ${contactCount} contacts now vs ${previousContactCount} previously`
          );
        } else if (contactCount < 10) {
          // Very few contacts - likely limited access
          isLimited = true;
        } else if (contactCount < 50) {
          // Moderate number - check for patterns that suggest limited access
          const lastNames = data
            .filter((contact) => contact.lastName)
            .map((contact) => contact.lastName);

          const uniqueLastNames = new Set(lastNames);

          // If we have contacts but very few unique last names, might be limited selection
          if (uniqueLastNames.size <= 2 && uniqueLastNames.size > 0) {
            isLimited = true;
          }
        }
      }

      // Save current count for future comparisons
      await get().saveContactAccessHistory(contactCount);

      return {
        hasAccess: true,
        isLimited,
        contactCount,
      };
    } catch (error) {
      console.error("Failed to check contact access:", error);
      return { hasAccess: false, isLimited: false, contactCount: 0 };
    }
  },

  clearImportCache: async () => {
    try {
      // This method helps ensure fresh contact data on next import
      // by clearing any potential cached contact permission state
      console.log("Clearing contact import cache...");

      // For expo-contacts, we don't need to do much as it handles its own caching
      // But we can ensure our local state is fresh
      await get().fetchCustomers();

      console.log("Contact import cache cleared successfully");
    } catch (error) {
      console.error("Failed to clear import cache:", error);
    }
  },

  getContactAccessHistory: async () => {
    try {
      const historyData = await AsyncStorage.getItem("contactAccessHistory");
      if (historyData) {
        const history = JSON.parse(historyData);
        return {
          previousContactCount: history.contactCount || 0,
          hasAccessHistory: true,
        };
      }
      return { previousContactCount: 0, hasAccessHistory: false };
    } catch (error) {
      console.error("Failed to get contact access history:", error);
      return { previousContactCount: 0, hasAccessHistory: false };
    }
  },

  saveContactAccessHistory: async (contactCount: number) => {
    try {
      const historyData = {
        contactCount,
        timestamp: new Date().toISOString(),
      };
      await AsyncStorage.setItem(
        "contactAccessHistory",
        JSON.stringify(historyData)
      );
      console.log(`Saved contact access history: ${contactCount} contacts`);
    } catch (error) {
      console.error("Failed to save contact access history:", error);
    }
  },

  presentContactAccessPicker: async () => {
    try {
      const Contacts = await import("expo-contacts");

      // Check if the method is available (iOS 18+)
      if (!Contacts.presentAccessPickerAsync) {
        console.log(
          "Contact access picker not available on this platform/version"
        );
        return { success: false, newContactsCount: 0 };
      }

      // Check current permission status
      const permissionResponse = await Contacts.getPermissionsAsync();
      const { status, accessPrivileges } = permissionResponse;

      if (status !== "granted") {
        console.log(
          "Cannot present access picker - no contact permission granted"
        );
        return { success: false, newContactsCount: 0 };
      }

      if (accessPrivileges !== "limited") {
        console.log("Access picker not needed - already have full access");
        return { success: false, newContactsCount: 0 };
      }

      // Get current contact count
      const beforeResult = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.FirstName],
        pageSize: 0,
      });
      const beforeCount = beforeResult.data.length;

      // Present the access picker
      const newlyGrantedContacts = await Contacts.presentAccessPickerAsync();
      console.log(
        `Access picker granted ${newlyGrantedContacts.length} additional contacts`
      );

      // Get updated contact count
      const afterResult = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.FirstName],
        pageSize: 0,
      });
      const afterCount = afterResult.data.length;
      const newContactsCount = afterCount - beforeCount;

      // Update access history
      await get().saveContactAccessHistory(afterCount);

      // Refresh customer list if we got new contacts
      if (newContactsCount > 0) {
        await get().fetchCustomers();
      }

      return { success: true, newContactsCount };
    } catch (error) {
      console.error("Failed to present contact access picker:", error);
      return { success: false, newContactsCount: 0 };
    }
  },

  // Filtering actions
  setFilters: (filters: CustomerFilters) => {
    set({ activeFilters: filters });
  },

  setSortOptions: (sort: SortOptions) => {
    set({ sortOptions: sort });
  },

  applyFilters: async () => {
    // Reset pagination and re-fetch customers with current filters and search query
    set({ currentPage: 1, hasNextPage: true });
    await get().fetchCustomers();
  },

  clearFilters: async () => {
    set({
      activeFilters: {},
      sortOptions: { field: "name", direction: "asc" },
      appliedFilterDescription: "All customers",
    });
    await get().fetchCustomers();
  },

  applyFilterPreset: async (presetId: string) => {
    const preset = CUSTOMER_FILTER_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      set({
        activeFilters: preset.filters,
        sortOptions: preset.sort || { field: "name", direction: "asc" },
      });
      await get().fetchCustomers();
    }
  },

  getFilterDescription: () => {
    const { activeFilters } = get();
    return getFilterDescription(activeFilters);
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },

  // Pagination methods
  loadMoreCustomers: async () => {
    const {
      hasNextPage,
      loadingMore,
      currentPage,
      pageSize,
      activeFilters,
      sortOptions,
      searchQuery,
      customers,
    } = get();

    if (!hasNextPage || loadingMore) {
      console.log("Skipping load more:", { hasNextPage, loadingMore });
      return;
    }

    console.log("Loading more customers:", {
      currentPage,
      nextPage: currentPage + 1,
      pageSize,
    });
    set({ loadingMore: true, error: null });
    try {
      const nextPage = currentPage + 1;
      const newCustomers = await databaseService.customers.findWithFilters(
        activeFilters,
        searchQuery || undefined,
        nextPage - 1, // Convert to 0-based
        pageSize,
        sortOptions
      );

      console.log("Loaded more customers:", {
        newCount: newCustomers.length,
        totalLoaded: customers.length + newCustomers.length,
        hasMore: newCustomers.length === pageSize,
      });

      const allCustomers = [...customers, ...newCustomers];
      set({
        customers: allCustomers,
        loadingMore: false,
        currentPage: nextPage,
        hasNextPage: newCustomers.length === pageSize,
        filteredCustomersCount: allCustomers.length, // Update count with loaded customers
      });
    } catch (error) {
      console.error("Failed to load more customers:", error);
      set({
        loadingMore: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load more customers",
      });
    }
  },

  resetPagination: () => {
    set({
      currentPage: 1,
      hasNextPage: true,
      loadingMore: false,
    });
  },
}));
