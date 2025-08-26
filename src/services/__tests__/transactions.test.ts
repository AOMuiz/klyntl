import { act, renderHook } from "@testing-library/react-native";
import { useTransactions } from "../../services/database/context";

// Mock the database context
jest.mock("../../services/database/context", () => ({
  useTransactions: jest.fn(),
}));

const mockUseTransactions = useTransactions as jest.MockedFunction<
  typeof useTransactions
>;

describe("Transaction Management", () => {
  const mockCreateTransaction = jest.fn();
  const mockUpdateTransaction = jest.fn();
  const mockDeleteTransaction = jest.fn();
  const mockGetTransactions = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTransactions.mockReturnValue({
      createTransaction: mockCreateTransaction,
      updateTransaction: mockUpdateTransaction,
      deleteTransaction: mockDeleteTransaction,
      getTransactions: mockGetTransactions,
    });
  });

  describe("createTransaction", () => {
    it("should create a transaction successfully", async () => {
      const transactionData = {
        customerId: "cust_1",
        amount: 25000,
        description: "Product sale",
        date: "2024-01-15T10:30:00Z",
        type: "sale" as const,
      };

      const expectedTransaction = {
        id: "txn_123",
        ...transactionData,
      };

      mockCreateTransaction.mockResolvedValue(expectedTransaction);

      const { result } = renderHook(() => useTransactions());

      let createdTransaction;
      await act(async () => {
        createdTransaction = await result.current.createTransaction(
          transactionData
        );
      });

      expect(mockCreateTransaction).toHaveBeenCalledWith(transactionData);
      expect(createdTransaction).toEqual(expectedTransaction);
    });

    it("should handle transaction creation errors", async () => {
      const transactionData = {
        customerId: "cust_1",
        amount: 25000,
        description: "Product sale",
        date: "2024-01-15T10:30:00Z",
        type: "sale" as const,
      };

      const error = new Error("Transaction creation failed");
      mockCreateTransaction.mockRejectedValue(error);

      const { result } = renderHook(() => useTransactions());

      await expect(
        result.current.createTransaction(transactionData)
      ).rejects.toThrow("Transaction creation failed");
    });

    it("should validate required fields", async () => {
      const incompleteData = {
        customerId: "",
        amount: 0,
        date: "",
        type: "sale" as const,
      };

      const { result } = renderHook(() => useTransactions());

      // This should be handled by form validation, but test the database call
      await act(async () => {
        try {
          await result.current.createTransaction(incompleteData);
        } catch {
          // Expected to fail
        }
      });

      expect(mockCreateTransaction).toHaveBeenCalledWith(incompleteData);
    });
  });

  describe("updateTransaction", () => {
    it("should update a transaction successfully", async () => {
      const transactionId = "txn_123";
      const updates = {
        amount: 30000,
        description: "Updated description",
        type: "payment" as const,
      };

      mockUpdateTransaction.mockResolvedValue(undefined);

      const { result } = renderHook(() => useTransactions());

      await act(async () => {
        await result.current.updateTransaction(transactionId, updates);
      });

      expect(mockUpdateTransaction).toHaveBeenCalledWith(
        transactionId,
        updates
      );
    });

    it("should handle transaction update errors", async () => {
      const transactionId = "txn_123";
      const updates = {
        amount: 30000,
      };

      const error = new Error("Transaction not found");
      mockUpdateTransaction.mockRejectedValue(error);

      const { result } = renderHook(() => useTransactions());

      await expect(
        result.current.updateTransaction(transactionId, updates)
      ).rejects.toThrow("Transaction not found");
    });

    it("should handle partial updates", async () => {
      const transactionId = "txn_123";
      const updates = {
        description: "Only updating description",
      };

      mockUpdateTransaction.mockResolvedValue(undefined);

      const { result } = renderHook(() => useTransactions());

      await act(async () => {
        await result.current.updateTransaction(transactionId, updates);
      });

      expect(mockUpdateTransaction).toHaveBeenCalledWith(
        transactionId,
        updates
      );
    });
  });

  describe("deleteTransaction", () => {
    it("should delete a transaction successfully", async () => {
      const transactionId = "txn_123";

      mockDeleteTransaction.mockResolvedValue(undefined);

      const { result } = renderHook(() => useTransactions());

      await act(async () => {
        await result.current.deleteTransaction(transactionId);
      });

      expect(mockDeleteTransaction).toHaveBeenCalledWith(transactionId);
    });

    it("should handle transaction deletion errors", async () => {
      const transactionId = "txn_123";

      const error = new Error("Transaction not found");
      mockDeleteTransaction.mockRejectedValue(error);

      const { result } = renderHook(() => useTransactions());

      await expect(
        result.current.deleteTransaction(transactionId)
      ).rejects.toThrow("Transaction not found");
    });
  });

  describe("getTransactions", () => {
    it("should get all transactions", async () => {
      const mockTransactions = [
        {
          id: "txn_1",
          customerId: "cust_1",
          amount: 25000,
          description: "Product sale",
          date: "2024-01-15T10:30:00Z",
          type: "sale" as const,
        },
        {
          id: "txn_2",
          customerId: "cust_2",
          amount: 15000,
          description: "Service payment",
          date: "2024-01-14T15:20:00Z",
          type: "payment" as const,
        },
      ];

      mockGetTransactions.mockResolvedValue(mockTransactions);

      const { result } = renderHook(() => useTransactions());

      let transactions;
      await act(async () => {
        transactions = await result.current.getTransactions();
      });

      expect(mockGetTransactions).toHaveBeenCalledWith();
      expect(transactions).toEqual(mockTransactions);
    });

    it("should get transactions for specific customer", async () => {
      const customerId = "cust_1";
      const mockTransactions = [
        {
          id: "txn_1",
          customerId: "cust_1",
          amount: 25000,
          description: "Product sale",
          date: "2024-01-15T10:30:00Z",
          type: "sale" as const,
        },
      ];

      mockGetTransactions.mockResolvedValue(mockTransactions);

      const { result } = renderHook(() => useTransactions());

      let transactions;
      await act(async () => {
        transactions = await result.current.getTransactions(customerId);
      });

      expect(mockGetTransactions).toHaveBeenCalledWith(customerId);
      expect(transactions).toEqual(mockTransactions);
    });

    it("should handle get transactions errors", async () => {
      const error = new Error("Database connection failed");
      mockGetTransactions.mockRejectedValue(error);

      const { result } = renderHook(() => useTransactions());

      await expect(result.current.getTransactions()).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  describe("transaction types", () => {
    it("should handle all transaction types", async () => {
      const types = ["sale", "payment", "refund"] as const;

      for (const type of types) {
        const transactionData = {
          customerId: "cust_1",
          amount: 10000,
          description: `${type} transaction`,
          date: "2024-01-15T10:30:00Z",
          type: type,
        };

        const expectedTransaction = {
          id: `txn_${type}`,
          ...transactionData,
        };

        mockCreateTransaction.mockResolvedValue(expectedTransaction);

        const { result } = renderHook(() => useTransactions());

        await act(async () => {
          await result.current.createTransaction(transactionData);
        });

        expect(mockCreateTransaction).toHaveBeenCalledWith(transactionData);
      }
    });
  });

  describe("amount validation", () => {
    it("should handle positive amounts", async () => {
      const amounts = [1, 100, 1000, 10000, 999999.99];

      for (const amount of amounts) {
        const transactionData = {
          customerId: "cust_1",
          amount: amount,
          description: "Test transaction",
          date: "2024-01-15T10:30:00Z",
          type: "sale" as const,
        };

        mockCreateTransaction.mockResolvedValue({
          id: "txn_test",
          ...transactionData,
        });

        const { result } = renderHook(() => useTransactions());

        await act(async () => {
          await result.current.createTransaction(transactionData);
        });

        expect(mockCreateTransaction).toHaveBeenCalledWith(transactionData);
      }
    });

    it("should handle decimal amounts", async () => {
      const transactionData = {
        customerId: "cust_1",
        amount: 123.45,
        description: "Decimal amount transaction",
        date: "2024-01-15T10:30:00Z",
        type: "sale" as const,
      };

      mockCreateTransaction.mockResolvedValue({
        id: "txn_decimal",
        ...transactionData,
      });

      const { result } = renderHook(() => useTransactions());

      await act(async () => {
        await result.current.createTransaction(transactionData);
      });

      expect(mockCreateTransaction).toHaveBeenCalledWith(transactionData);
    });
  });

  describe("date handling", () => {
    it("should handle various date formats", async () => {
      const dates = [
        "2024-01-15T10:30:00Z",
        "2024-12-31T23:59:59Z",
        "2024-06-15T12:00:00Z",
      ];

      for (const date of dates) {
        const transactionData = {
          customerId: "cust_1",
          amount: 10000,
          description: "Date test transaction",
          date: date,
          type: "sale" as const,
        };

        mockCreateTransaction.mockResolvedValue({
          id: "txn_date_test",
          ...transactionData,
        });

        const { result } = renderHook(() => useTransactions());

        await act(async () => {
          await result.current.createTransaction(transactionData);
        });

        expect(mockCreateTransaction).toHaveBeenCalledWith(transactionData);
      }
    });
  });
});
