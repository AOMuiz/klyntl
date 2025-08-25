import { act, renderHook } from "@testing-library/react-native";
import { createMockCustomers, mockCustomer } from "../../__tests__/test-utils";
import { databaseService } from "../../services/database";
import { useCustomerStore } from "../customerStore";

// Mock the database service
jest.mock("../../services/database");

const mockDatabaseService = databaseService as jest.Mocked<
  typeof databaseService
>;

describe("useCustomerStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useCustomerStore.getState().reset();
  });

  describe("fetchCustomers", () => {
    it("should fetch customers successfully", async () => {
      const mockCustomers = createMockCustomers(3);
      mockDatabaseService.getCustomers.mockResolvedValue(mockCustomers);

      const { result } = renderHook(() => useCustomerStore());

      await act(async () => {
        await result.current.fetchCustomers();
      });

      expect(result.current.customers).toEqual(mockCustomers);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(mockDatabaseService.getCustomers).toHaveBeenCalledWith();
    });

    it("should handle fetch errors", async () => {
      const errorMessage = "Database connection failed";
      mockDatabaseService.getCustomers.mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useCustomerStore());

      await act(async () => {
        await result.current.fetchCustomers();
      });

      expect(result.current.customers).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });

    it("should set loading state correctly", async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockDatabaseService.getCustomers.mockReturnValue(promise as any);

      const { result } = renderHook(() => useCustomerStore());

      // Start the fetch
      act(() => {
        result.current.fetchCustomers();
      });

      // Check loading state
      expect(result.current.loading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise([]);
        await promise;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe("searchCustomers", () => {
    it("should search customers with query", async () => {
      const searchQuery = "John";
      const filteredCustomers = [mockCustomer];
      mockDatabaseService.getCustomers.mockResolvedValue(filteredCustomers);

      const { result } = renderHook(() => useCustomerStore());

      await act(async () => {
        await result.current.searchCustomers(searchQuery);
      });

      expect(result.current.customers).toEqual(filteredCustomers);
      expect(result.current.searchQuery).toBe(searchQuery);
      expect(mockDatabaseService.getCustomers).toHaveBeenCalledWith(
        searchQuery
      );
    });

    it("should handle search errors", async () => {
      const errorMessage = "Search failed";
      mockDatabaseService.getCustomers.mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useCustomerStore());

      await act(async () => {
        await result.current.searchCustomers("test");
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe("addCustomer", () => {
    const newCustomerInput = {
      name: "New Customer",
      phone: "+2348012345678",
      email: "new@example.com",
    };

    it("should add customer successfully", async () => {
      const createdCustomer = { ...mockCustomer, ...newCustomerInput };
      mockDatabaseService.createCustomer.mockResolvedValue(createdCustomer);

      const { result } = renderHook(() => useCustomerStore());

      await act(async () => {
        await result.current.addCustomer(newCustomerInput);
      });

      expect(result.current.customers).toContain(createdCustomer);
      expect(result.current.error).toBe(null);
      expect(mockDatabaseService.createCustomer).toHaveBeenCalledWith(
        newCustomerInput
      );
    });

    it("should handle add customer errors", async () => {
      const errorMessage = "Phone number already exists";
      mockDatabaseService.createCustomer.mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useCustomerStore());

      await act(async () => {
        try {
          await result.current.addCustomer(newCustomerInput);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.customers).toEqual([]);
    });

    it("should add new customer to the beginning of the list", async () => {
      const existingCustomers = createMockCustomers(2);
      const newCustomer = { ...mockCustomer, id: "new_customer" };

      mockDatabaseService.createCustomer.mockResolvedValue(newCustomer);

      const { result } = renderHook(() => useCustomerStore());

      // Set existing customers
      act(() => {
        result.current.reset();
        useCustomerStore.setState({ customers: existingCustomers });
      });

      await act(async () => {
        await result.current.addCustomer(newCustomerInput);
      });

      expect(result.current.customers[0]).toEqual(newCustomer);
      expect(result.current.customers).toHaveLength(3);
    });
  });

  describe("updateCustomer", () => {
    const customerId = "cust_1";
    const updateData = { name: "Updated Name", email: "updated@example.com" };

    beforeEach(() => {
      // Set up initial customers
      const initialCustomers = [{ ...mockCustomer, id: customerId }];
      useCustomerStore.setState({ customers: initialCustomers });
    });

    it("should update customer successfully", async () => {
      mockDatabaseService.updateCustomer.mockResolvedValue();

      const { result } = renderHook(() => useCustomerStore());

      await act(async () => {
        await result.current.updateCustomer(customerId, updateData);
      });

      const updatedCustomer = result.current.customers.find(
        (c) => c.id === customerId
      );
      expect(updatedCustomer).toMatchObject(updateData);
      expect(result.current.error).toBe(null);
      expect(mockDatabaseService.updateCustomer).toHaveBeenCalledWith(
        customerId,
        updateData
      );
    });

    it("should update selected customer if it matches", async () => {
      mockDatabaseService.updateCustomer.mockResolvedValue();

      const { result } = renderHook(() => useCustomerStore());

      // Select the customer to be updated
      act(() => {
        result.current.selectCustomer({ ...mockCustomer, id: customerId });
      });

      await act(async () => {
        await result.current.updateCustomer(customerId, updateData);
      });

      expect(result.current.selectedCustomer).toMatchObject(updateData);
    });

    it("should handle update errors", async () => {
      const errorMessage = "Update failed";
      mockDatabaseService.updateCustomer.mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useCustomerStore());

      await act(async () => {
        try {
          await result.current.updateCustomer(customerId, updateData);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe("deleteCustomer", () => {
    const customerId = "cust_1";

    beforeEach(() => {
      const initialCustomers = createMockCustomers(3);
      initialCustomers[0].id = customerId;
      useCustomerStore.setState({ customers: initialCustomers });
    });

    it("should delete customer successfully", async () => {
      mockDatabaseService.deleteCustomer.mockResolvedValue();

      const { result } = renderHook(() => useCustomerStore());

      await act(async () => {
        await result.current.deleteCustomer(customerId);
      });

      const deletedCustomer = result.current.customers.find(
        (c) => c.id === customerId
      );
      expect(deletedCustomer).toBeUndefined();
      expect(result.current.customers).toHaveLength(2);
      expect(mockDatabaseService.deleteCustomer).toHaveBeenCalledWith(
        customerId
      );
    });

    it("should clear selected customer if it matches deleted customer", async () => {
      mockDatabaseService.deleteCustomer.mockResolvedValue();

      const { result } = renderHook(() => useCustomerStore());

      // Select the customer to be deleted
      act(() => {
        result.current.selectCustomer({ ...mockCustomer, id: customerId });
      });

      await act(async () => {
        await result.current.deleteCustomer(customerId);
      });

      expect(result.current.selectedCustomer).toBe(null);
    });

    it("should handle delete errors", async () => {
      const errorMessage = "Delete failed";
      mockDatabaseService.deleteCustomer.mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useCustomerStore());

      await act(async () => {
        try {
          await result.current.deleteCustomer(customerId);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe("selectCustomer", () => {
    it("should select a customer", () => {
      const { result } = renderHook(() => useCustomerStore());

      act(() => {
        result.current.selectCustomer(mockCustomer);
      });

      expect(result.current.selectedCustomer).toEqual(mockCustomer);
    });

    it("should clear selected customer", () => {
      const { result } = renderHook(() => useCustomerStore());

      // First select a customer
      act(() => {
        result.current.selectCustomer(mockCustomer);
      });

      // Then clear selection
      act(() => {
        result.current.selectCustomer(null);
      });

      expect(result.current.selectedCustomer).toBe(null);
    });
  });

  describe("clearError", () => {
    it("should clear error state", () => {
      const { result } = renderHook(() => useCustomerStore());

      // Set an error
      act(() => {
        useCustomerStore.setState({ error: "Some error" });
      });

      expect(result.current.error).toBe("Some error");

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe("reset", () => {
    it("should reset store to initial state", () => {
      const { result } = renderHook(() => useCustomerStore());

      // Modify store state
      act(() => {
        useCustomerStore.setState({
          customers: createMockCustomers(5),
          loading: true,
          searchQuery: "test",
          selectedCustomer: mockCustomer,
          error: "Some error",
        });
      });

      // Reset store
      act(() => {
        result.current.reset();
      });

      expect(result.current.customers).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.searchQuery).toBe("");
      expect(result.current.selectedCustomer).toBe(null);
      expect(result.current.error).toBe(null);
    });
  });
});
