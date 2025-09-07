/* eslint-disable @typescript-eslint/no-unused-vars */
import { act, renderHook } from "@testing-library/react-native";
import { createMockCustomers, mockCustomer } from "../../__tests__/test-utils";
import { setDatabaseService, useCustomerStore } from "../customerStore";

let mockDatabaseService: any;

describe("useCustomerStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Create a fresh mock DatabaseService for each test to avoid state leakage
    mockDatabaseService = {
      customers: {
        findWithFilters: jest.fn(),
        countWithFilters: jest.fn(),
        findAll: jest.fn(),
        findByPhone: jest.fn(),
        createCustomer: jest.fn(),
        updateCustomer: jest.fn(),
        deleteCustomer: jest.fn(),
        findById: jest.fn(),
      },
    };

    // Inject the mock database service into the store
    setDatabaseService(mockDatabaseService as any);

    // Reset store state properly
    const { result } = renderHook(() => useCustomerStore());
    act(() => {
      result.current.reset();
    });
  });

  describe("fetchCustomers", () => {
    it("should fetch customers successfully", async () => {
      const mockCustomers = createMockCustomers(3);
      const totalCustomers = createMockCustomers(5); // More customers for total count

      // Mock both calls
      mockDatabaseService.customers.findWithFilters
        .mockResolvedValueOnce(mockCustomers) // First call with parameters
        .mockResolvedValueOnce(totalCustomers); // Second call for other invocation

      mockDatabaseService.customers.countWithFilters.mockResolvedValueOnce(
        totalCustomers.length
      );

      const { result } = renderHook(() => useCustomerStore());

      await act(async () => {
        await result.current.fetchCustomers();
      });

      expect(result.current.customers).toEqual(mockCustomers);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.totalCustomersCount).toBe(totalCustomers.length);
      expect(result.current.filteredCustomersCount).toBe(mockCustomers.length);
      expect(mockDatabaseService.customers.findWithFilters).toHaveBeenCalled();
      expect(mockDatabaseService.customers.countWithFilters).toHaveBeenCalled();
    });

    it("should handle fetch errors", async () => {
      const errorMessage = "Database connection failed";
      mockDatabaseService.customers.findWithFilters.mockRejectedValue(
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
      mockDatabaseService.customers.findWithFilters.mockReturnValue(
        promise as any
      );

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

      mockDatabaseService.customers.findWithFilters.mockResolvedValueOnce(
        filteredCustomers
      );
      mockDatabaseService.customers.countWithFilters.mockResolvedValueOnce(
        filteredCustomers.length
      );

      const { result } = renderHook(() => useCustomerStore());

      await act(async () => {
        await result.current.searchCustomers(searchQuery);
      });

      expect(result.current.customers).toEqual(filteredCustomers);
      expect(result.current.searchQuery).toBe(searchQuery);
      expect(
        mockDatabaseService.customers.findWithFilters
      ).toHaveBeenCalledTimes(1);
    });

    it("should handle search errors", async () => {
      const errorMessage = "Search failed";
      mockDatabaseService.customers.findWithFilters.mockRejectedValue(
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
      mockDatabaseService.customers.createCustomer.mockResolvedValue(
        createdCustomer
      );

      const { result } = renderHook(() => useCustomerStore());

      await act(async () => {
        await result.current.addCustomer(newCustomerInput);
      });

      expect(result.current.customers).toContain(createdCustomer);
      expect(result.current.error).toBe(null);
      expect(mockDatabaseService.customers.createCustomer).toHaveBeenCalledWith(
        newCustomerInput
      );
    });

    it("should handle add customer errors", async () => {
      const errorMessage = "Phone number already exists";
      mockDatabaseService.customers.createCustomer.mockRejectedValue(
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

      mockDatabaseService.customers.createCustomer.mockResolvedValue(
        newCustomer
      );

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
      mockDatabaseService.customers.updateCustomer.mockResolvedValue();

      const { result } = renderHook(() => useCustomerStore());

      await act(async () => {
        await result.current.updateCustomer(customerId, updateData);
      });

      const updatedCustomer = result.current.customers.find(
        (c) => c.id === customerId
      );
      expect(updatedCustomer).toMatchObject(updateData);
      expect(result.current.error).toBe(null);
      expect(mockDatabaseService.customers.updateCustomer).toHaveBeenCalledWith(
        customerId,
        updateData
      );
    });

    it("should update selected customer if it matches", async () => {
      mockDatabaseService.customers.updateCustomer.mockResolvedValue();

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
      mockDatabaseService.customers.updateCustomer.mockRejectedValue(
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
      mockDatabaseService.customers.deleteCustomer.mockResolvedValue();

      const { result } = renderHook(() => useCustomerStore());

      await act(async () => {
        await result.current.deleteCustomer(customerId);
      });

      const deletedCustomer = result.current.customers.find(
        (c) => c.id === customerId
      );
      expect(deletedCustomer).toBeUndefined();
      expect(result.current.customers).toHaveLength(2);
      expect(mockDatabaseService.customers.deleteCustomer).toHaveBeenCalledWith(
        customerId
      );
    });

    it("should clear selected customer if it matches deleted customer", async () => {
      mockDatabaseService.customers.deleteCustomer.mockResolvedValue();

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
      mockDatabaseService.customers.deleteCustomer.mockRejectedValue(
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
    it("should clear error state", async () => {
      const { result } = renderHook(() => useCustomerStore());

      // Trigger an error first by making a failing call
      mockDatabaseService.customers.findWithFilters.mockRejectedValueOnce(
        new Error("Test error")
      );

      await act(async () => {
        await result.current.fetchCustomers();
      });

      expect(result.current.error).toBe("Test error");

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("reset", () => {
    it("should reset store to initial state", async () => {
      const { result } = renderHook(() => useCustomerStore());

      // Set some state through actions
      const totalCustomers = createMockCustomers(2);
      mockDatabaseService.customers.findWithFilters
        .mockResolvedValueOnce([mockCustomer])
        .mockResolvedValueOnce(totalCustomers);
      mockDatabaseService.customers.countWithFilters.mockResolvedValueOnce(
        totalCustomers.length
      );
      await act(async () => {
        await result.current.fetchCustomers();
      });

      act(() => {
        result.current.selectCustomer(mockCustomer);
      });

      expect(result.current.customers).toHaveLength(1);
      expect(result.current.selectedCustomer).toEqual(mockCustomer);

      // Reset the store
      act(() => {
        result.current.reset();
      });

      expect(result.current.customers).toHaveLength(0);
      expect(result.current.selectedCustomer).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  describe("integration tests", () => {
    it("should handle complete customer lifecycle", async () => {
      const { result } = renderHook(() => useCustomerStore());

      // Start with empty state
      expect(result.current.customers).toHaveLength(0);
      expect(result.current.selectedCustomer).toBeNull();

      // Add a customer
      const newCustomer = {
        ...mockCustomer,
        id: "cust_new",
        name: "John Doe",
      };

      mockDatabaseService.customers.createCustomer.mockResolvedValueOnce(
        newCustomer
      );
      mockDatabaseService.customers.findAll.mockResolvedValueOnce([
        newCustomer,
      ]);

      await act(async () => {
        await result.current.addCustomer({
          name: "John Doe",
          phone: "+2348012345678",
          email: "john@example.com",
        });
      });

      expect(result.current.customers).toHaveLength(1);
      const addedCustomer = result.current.customers[0];
      expect(addedCustomer.name).toBe("John Doe");

      // Select the customer
      act(() => {
        result.current.selectCustomer(addedCustomer);
      });

      expect(result.current.selectedCustomer).toEqual(addedCustomer);

      // Update the customer
      const updatedCustomer = {
        ...addedCustomer,
        name: "John Updated",
        email: "john.updated@example.com",
      };

      mockDatabaseService.customers.updateCustomer.mockResolvedValueOnce(
        undefined
      );
      mockDatabaseService.customers.findAll.mockResolvedValueOnce([
        updatedCustomer,
      ]);

      await act(async () => {
        await result.current.updateCustomer(addedCustomer.id, {
          name: "John Updated",
          email: "john.updated@example.com",
        });
      });

      const currentCustomer = result.current.customers.find(
        (c) => c.id === addedCustomer.id
      );
      expect(currentCustomer?.name).toBe("John Updated");
      expect(currentCustomer?.email).toBe("john.updated@example.com");
      expect(result.current.selectedCustomer?.name).toBe("John Updated");

      // Delete the customer
      mockDatabaseService.customers.deleteCustomer.mockResolvedValueOnce(
        undefined
      );
      mockDatabaseService.customers.findAll.mockResolvedValueOnce([]);

      await act(async () => {
        await result.current.deleteCustomer(addedCustomer.id);
      });

      expect(result.current.customers).toHaveLength(0);
      expect(result.current.selectedCustomer).toBeNull();
    });

    it("should handle errors gracefully", async () => {
      mockDatabaseService.customers.createCustomer.mockRejectedValueOnce(
        new Error("Database error")
      );

      const { result } = renderHook(() => useCustomerStore());

      await act(async () => {
        await result.current.addCustomer({
          name: "Test Customer",
          phone: "+2348012345678",
        });
      });

      expect(result.current.error).toBe("Database error");
      expect(result.current.loading).toBe(false);
      expect(result.current.customers).toHaveLength(0);
    });
  });
});
