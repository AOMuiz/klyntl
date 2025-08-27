import { create } from "zustand";
import { persist } from "zustand/middleware";

// UI-only state store - no data fetching
interface UiStore {
  // Navigation
  activeTab: string;
  sidebarOpen: boolean;

  // Theme
  theme: "light" | "dark" | "auto";

  // Filter settings (UI state only)
  customerFilters: {
    searchQuery: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
    customerType: "all" | "business" | "individual";
    isActive?: boolean;
    showFilters: boolean;
  };

  // Transaction filters (UI state only)
  transactionFilters: {
    searchQuery: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
    type: "all" | "sale" | "refund";
    showFilters: boolean;
  };

  // Modal states
  modals: {
    addCustomer: boolean;
    editCustomer: boolean;
    addTransaction: boolean;
    editTransaction: boolean;
    settings: boolean;
  };

  // Form states
  forms: {
    customerForm: {
      isDirty: boolean;
      isValid: boolean;
    };
    transactionForm: {
      isDirty: boolean;
      isValid: boolean;
    };
  };

  // Pagination (UI state)
  pagination: {
    customers: {
      page: number;
      pageSize: number;
    };
    transactions: {
      page: number;
      pageSize: number;
    };
  };

  // Actions
  setActiveTab: (tab: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  setTheme: (theme: "light" | "dark" | "auto") => void;

  updateCustomerFilters: (filters: Partial<UiStore["customerFilters"]>) => void;
  resetCustomerFilters: () => void;

  updateTransactionFilters: (
    filters: Partial<UiStore["transactionFilters"]>
  ) => void;
  resetTransactionFilters: () => void;

  openModal: (modal: keyof UiStore["modals"]) => void;
  closeModal: (modal: keyof UiStore["modals"]) => void;
  closeAllModals: () => void;

  updateFormState: (
    form: keyof UiStore["forms"],
    state: Partial<{ isDirty: boolean; isValid: boolean }>
  ) => void;
  resetFormState: (form: keyof UiStore["forms"]) => void;

  updatePagination: (
    entity: keyof UiStore["pagination"],
    pagination: Partial<{ page: number; pageSize: number }>
  ) => void;
  resetPagination: (entity: keyof UiStore["pagination"]) => void;

  reset: () => void;
}

const initialState = {
  activeTab: "customers",
  sidebarOpen: false,
  theme: "auto" as const,
  customerFilters: {
    searchQuery: "",
    sortBy: "name",
    sortOrder: "asc" as const,
    customerType: "all" as const,
    isActive: undefined,
    showFilters: false,
  },
  transactionFilters: {
    searchQuery: "",
    sortBy: "date",
    sortOrder: "desc" as const,
    type: "all" as const,
    showFilters: false,
  },
  modals: {
    addCustomer: false,
    editCustomer: false,
    addTransaction: false,
    editTransaction: false,
    settings: false,
  },
  forms: {
    customerForm: {
      isDirty: false,
      isValid: true,
    },
    transactionForm: {
      isDirty: false,
      isValid: true,
    },
  },
  pagination: {
    customers: {
      page: 1,
      pageSize: 20,
    },
    transactions: {
      page: 1,
      pageSize: 50,
    },
  },
};

export const useUiStore = create<UiStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Navigation actions
      setActiveTab: (tab) => set({ activeTab: tab }),
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Theme actions
      setTheme: (theme) => set({ theme }),

      // Customer filter actions
      updateCustomerFilters: (filters) =>
        set((state) => ({
          customerFilters: { ...state.customerFilters, ...filters },
        })),
      resetCustomerFilters: () =>
        set({ customerFilters: initialState.customerFilters }),

      // Transaction filter actions
      updateTransactionFilters: (filters) =>
        set((state) => ({
          transactionFilters: { ...state.transactionFilters, ...filters },
        })),
      resetTransactionFilters: () =>
        set({ transactionFilters: initialState.transactionFilters }),

      // Modal actions
      openModal: (modal) =>
        set((state) => ({
          modals: { ...state.modals, [modal]: true },
        })),
      closeModal: (modal) =>
        set((state) => ({
          modals: { ...state.modals, [modal]: false },
        })),
      closeAllModals: () => set({ modals: initialState.modals }),

      // Form actions
      updateFormState: (form, formState) =>
        set((state) => ({
          forms: {
            ...state.forms,
            [form]: { ...state.forms[form], ...formState },
          },
        })),
      resetFormState: (form) =>
        set((state) => ({
          forms: { ...state.forms, [form]: initialState.forms[form] },
        })),

      // Pagination actions
      updatePagination: (entity, pagination) =>
        set((state) => ({
          pagination: {
            ...state.pagination,
            [entity]: { ...state.pagination[entity], ...pagination },
          },
        })),
      resetPagination: (entity) =>
        set((state) => ({
          pagination: {
            ...state.pagination,
            [entity]: initialState.pagination[entity],
          },
        })),

      // Reset all
      reset: () => set(initialState),
    }),
    {
      name: "klyntl-ui-state",
      // Only persist certain UI preferences
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        pagination: state.pagination,
      }),
    }
  )
);

// Selector hooks for better performance
export const useActiveTab = () => useUiStore((state) => state.activeTab);
export const useSidebarState = () =>
  useUiStore((state) => ({
    isOpen: state.sidebarOpen,
    toggle: state.toggleSidebar,
    setOpen: state.setSidebarOpen,
  }));
export const useTheme = () =>
  useUiStore((state) => ({
    theme: state.theme,
    setTheme: state.setTheme,
  }));
export const useCustomerFilters = () =>
  useUiStore((state) => ({
    filters: state.customerFilters,
    updateFilters: state.updateCustomerFilters,
    resetFilters: state.resetCustomerFilters,
  }));
export const useTransactionFilters = () =>
  useUiStore((state) => ({
    filters: state.transactionFilters,
    updateFilters: state.updateTransactionFilters,
    resetFilters: state.resetTransactionFilters,
  }));
export const useModals = () =>
  useUiStore((state) => ({
    modals: state.modals,
    openModal: state.openModal,
    closeModal: state.closeModal,
    closeAllModals: state.closeAllModals,
  }));
export const usePagination = () =>
  useUiStore((state) => ({
    pagination: state.pagination,
    updatePagination: state.updatePagination,
    resetPagination: state.resetPagination,
  }));
