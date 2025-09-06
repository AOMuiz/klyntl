import { act, renderHook } from "@testing-library/react-native";
import { useTransactionForm } from "../useTransactionForm";

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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Jane Smith",
        phone: "0987654321",
        totalSpent: 0,
        outstandingBalance: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  }),
}));

describe("useTransactionForm", () => {
  const mockCustomerId = "1";
  const mockSearchQuery = "";
  const mockSetSearchQuery = jest.fn();

  it("initializes with correct default values", () => {
    const { result } = renderHook(() =>
      useTransactionForm({
        customerId: mockCustomerId,
        customers: [],
        searchQuery: mockSearchQuery,
        setSearchQuery: mockSetSearchQuery,
      })
    );

    expect(result.current.watchedValues.customerId).toBe(mockCustomerId);
    expect(result.current.watchedValues.type).toBe("sale");
    expect(result.current.watchedValues.paymentMethod).toBe("cash");
  });

  it("filters customers based on search query", () => {
    const { result } = renderHook(() =>
      useTransactionForm({
        customerId: undefined,
        customers: [
          {
            id: "1",
            name: "John Doe",
            phone: "1234567890",
            totalSpent: 0,
            outstandingBalance: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "2",
            name: "Jane Smith",
            phone: "0987654321",
            totalSpent: 0,
            outstandingBalance: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        searchQuery: "John",
        setSearchQuery: mockSetSearchQuery,
      })
    );

    expect(result.current.filteredCustomers).toHaveLength(1);
    expect(result.current.filteredCustomers[0].name).toBe("John Doe");
  });

  it("updates form values correctly", () => {
    const { result } = renderHook(() =>
      useTransactionForm({
        customerId: mockCustomerId,
        customers: [],
        searchQuery: mockSearchQuery,
        setSearchQuery: mockSetSearchQuery,
      })
    );

    act(() => {
      result.current.setValue("amount", "1000");
    });

    expect(result.current.watchedValues.amount).toBe("1000");
  });

  it("resets form correctly", () => {
    const { result } = renderHook(() =>
      useTransactionForm({
        customerId: mockCustomerId,
        customers: [],
        searchQuery: mockSearchQuery,
        setSearchQuery: mockSetSearchQuery,
      })
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
