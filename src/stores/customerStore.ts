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

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));
