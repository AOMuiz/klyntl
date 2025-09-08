import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import React from "react";
import { useTransactionForm } from "../useTransactionForm";

// Mock the database hooks
jest.mock("@/services/database/hooks", () => ({
  useDatabase: jest.fn(() => ({
    db: {
      runAsync: jest.fn(),
      getAllAsync: jest.fn(),
      getFirstAsync: jest.fn(),
      withTransactionAsync: jest.fn(),
      closeAsync: jest.fn(),
    },
    isReady: true,
    error: null,
  })),
}));

// Mock the database service
jest.mock("@/services/database", () => ({
  createDatabaseService: jest.fn(() => ({
    payment: {
      calculateTransactionStatus: jest.fn(() => "completed"),
    },
  })),
}));

// Mock the dependencies
jest.mock("@/hooks/useCustomers", () => ({
  useCustomers: () => ({
    customers: [
      {
        id: "1",
        name: "John Doe",
        phone: "1234567890",
        totalSpent: 0,
        outstandingBalance: 0,
        creditBalance: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Jane Smith",
        phone: "0987654321",
        totalSpent: 0,
        outstandingBalance: 0,
        creditBalance: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  }),
}));

// Create a test helper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useTransactionForm", () => {
  const mockCustomerId = "1";
  const mockSearchQuery = "";
  const mockSetSearchQuery = jest.fn();

  it("initializes with correct default values", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () =>
        useTransactionForm({
          customerId: mockCustomerId,
          customers: [],
          searchQuery: mockSearchQuery,
          setSearchQuery: mockSetSearchQuery,
        }),
      { wrapper }
    );

    expect(result.current.watchedValues.customerId).toBe(mockCustomerId);
    expect(result.current.watchedValues.type).toBe("sale");
    expect(result.current.watchedValues.paymentMethod).toBe("cash");
  });

  it("filters customers based on search query", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () =>
        useTransactionForm({
          customerId: undefined,
          customers: [
            {
              id: "1",
              name: "John Doe",
              phone: "1234567890",
              totalSpent: 0,
              outstandingBalance: 0,
              creditBalance: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: "2",
              name: "Jane Smith",
              phone: "0987654321",
              totalSpent: 0,
              outstandingBalance: 0,
              creditBalance: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          searchQuery: "John",
          setSearchQuery: mockSetSearchQuery,
        }),
      { wrapper }
    );

    expect(result.current.filteredCustomers).toHaveLength(1);
    expect(result.current.filteredCustomers[0].name).toBe("John Doe");
  });

  it("updates form values correctly", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () =>
        useTransactionForm({
          customerId: mockCustomerId,
          customers: [],
          searchQuery: mockSearchQuery,
          setSearchQuery: mockSetSearchQuery,
        }),
      { wrapper }
    );

    act(() => {
      result.current.setValue("amount", "1000");
    });

    expect(result.current.watchedValues.amount).toBe("1000");
  });

  it("resets form correctly", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () =>
        useTransactionForm({
          customerId: mockCustomerId,
          customers: [],
          searchQuery: mockSearchQuery,
          setSearchQuery: mockSetSearchQuery,
        }),
      { wrapper }
    );

    act(() => {
      result.current.setValue("amount", "1000");
      result.current.setValue("description", "Test transaction");
    });

    expect(result.current.watchedValues.amount).toBe("1000");

    act(() => {
      result.current.reset("2");
    });

    expect(result.current.watchedValues.amount).toBe("");
    expect(result.current.watchedValues.customerId).toBe("2");
  });
});
