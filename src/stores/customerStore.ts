import { create } from "zustand";
import { databaseService } from "../services/database";
import {
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
} from "../types/customer";

interface CustomerStore {
  customers: Customer[];
  loading: boolean;
  searchQuery: string;
  selectedCustomer: Customer | null;
  error: string | null;

  // Actions
  fetchCustomers: () => Promise<void>;
  searchCustomers: (query: string) => Promise<void>;
  addCustomer: (customer: CreateCustomerInput) => Promise<void>;
  updateCustomer: (id: string, updates: UpdateCustomerInput) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  selectCustomer: (customer: Customer | null) => void;
  importFromContacts: () => Promise<{ imported: number; skipped: number }>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  customers: [],
  loading: false,
  searchQuery: "",
  selectedCustomer: null,
  error: null,
};

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  ...initialState,

  fetchCustomers: async () => {
    set({ loading: true, error: null });
    try {
      const customers = await databaseService.getCustomers();
      set({ customers, loading: false });
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
    set({ searchQuery: query, loading: true, error: null });
    try {
      const customers = await databaseService.getCustomers(query);
      set({ customers, loading: false });
    } catch (error) {
      console.error("Failed to search customers:", error);
      set({
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to search customers",
      });
    }
  },

  addCustomer: async (customerData: CreateCustomerInput) => {
    set({ error: null });
    try {
      const newCustomer = await databaseService.createCustomer(customerData);
      const { customers } = get();
      set({ customers: [newCustomer, ...customers] });
    } catch (error) {
      console.error("Failed to add customer:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add customer";
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  updateCustomer: async (id: string, updates: UpdateCustomerInput) => {
    set({ error: null });
    try {
      await databaseService.updateCustomer(id, updates);
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
      await databaseService.deleteCustomer(id);
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

  importFromContacts: async () => {
    set({ error: null, loading: true });
    try {
      const Contacts = await import("expo-contacts");

      // Request permissions
      const { status } = await Contacts.requestPermissionsAsync();

      if (status !== "granted") {
        throw new Error("Permission to access contacts was denied");
      }

      // Get contacts
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
        ],
      });

      const { customers } = get();
      const existingPhones = new Set(
        customers.map((c) => c.phone.replace(/\D/g, ""))
      );

      let imported = 0;
      let skipped = 0;

      // Process contacts
      for (const contact of data) {
        if (
          !contact.name ||
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

        // Validate Nigerian phone number format
        const nigerianPhoneRegex = /^(\+234)[789][01]\d{8}$/;
        if (!nigerianPhoneRegex.test(formattedPhone)) {
          skipped++;
          continue;
        }

        try {
          const customerData: CreateCustomerInput = {
            name: contact.name,
            phone: formattedPhone,
            email: contact.emails?.[0]?.email || undefined,
          };

          await get().addCustomer(customerData);
          existingPhones.add(phoneNumber);
          imported++;

          // Limit to 50 imports at once for performance
          if (imported >= 50) {
            break;
          }
        } catch (error) {
          console.warn("Skipped importing contact:", contact.name, error);
          skipped++;
        }
      }

      set({ loading: false });
      return { imported, skipped };
    } catch (error) {
      console.error("Failed to import contacts:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to import contacts";
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));
