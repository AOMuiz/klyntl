import { SQLiteDatabase } from "expo-sqlite";
import { CustomerRepository } from "../../repositories/CustomerRepository";
import { PaymentService } from "../PaymentService";

describe("PaymentService", () => {
  let mockDb: jest.Mocked<SQLiteDatabase>;
  let mockCustomerRepo: jest.Mocked<CustomerRepository>;
  let paymentService: PaymentService;

  beforeEach(() => {
    mockDb = {
      runAsync: jest.fn(),
      getFirstAsync: jest.fn(),
      getAllAsync: jest.fn(),
      withTransactionAsync: jest.fn(),
    } as any;

    mockCustomerRepo = {
      findById: jest.fn(),
    } as any;

    paymentService = new PaymentService(mockDb, mockCustomerRepo);
  });

  describe("handlePaymentAllocation", () => {
    it("should allocate payment to outstanding balance and create credit for excess", async () => {
      // Mock customer with outstanding balance of 5000
      mockCustomerRepo.findById.mockResolvedValue({
        id: "customer_1",
        outstandingBalance: 5000,
        creditBalance: 0,
      } as any);

      // Mock transaction callback
      mockDb.withTransactionAsync.mockImplementation(async (callback) => {
        return await callback();
      });

      // Mock successful DB operations
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

      const result = await paymentService.handlePaymentAllocation(
        "customer_1",
        "txn_123",
        7000
      );

      // Verify results
      expect(result.appliedToDebt).toBe(5000);
      expect(result.creditCreated).toBe(2000);
      expect(result.remainingUnallocated).toBe(0);
      expect(result.auditRecords).toHaveLength(2);

      // Verify DB calls
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        `UPDATE customers SET outstandingBalance = GREATEST(0, outstandingBalance - ?) WHERE id = ?`,
        [5000, "customer_1"]
      );

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        `UPDATE customers SET credit_balance = credit_balance + ? WHERE id = ?`,
        [2000, "customer_1"]
      );
    });

    it("should handle payment exactly equal to outstanding balance", async () => {
      mockCustomerRepo.findById.mockResolvedValue({
        id: "customer_1",
        outstandingBalance: 5000,
        creditBalance: 0,
      } as any);

      mockDb.withTransactionAsync.mockImplementation(async (callback) => {
        return await callback();
      });
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

      const result = await paymentService.handlePaymentAllocation(
        "customer_1",
        "txn_123",
        5000
      );

      expect(result.appliedToDebt).toBe(5000);
      expect(result.creditCreated).toBe(0);
      expect(result.auditRecords).toHaveLength(1);
    });

    it("should handle payment less than outstanding balance", async () => {
      mockCustomerRepo.findById.mockResolvedValue({
        id: "customer_1",
        outstandingBalance: 5000,
        creditBalance: 0,
      } as any);

      mockDb.withTransactionAsync.mockImplementation(async (callback) => {
        return await callback();
      });
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

      const result = await paymentService.handlePaymentAllocation(
        "customer_1",
        "txn_123",
        3000
      );

      expect(result.appliedToDebt).toBe(3000);
      expect(result.creditCreated).toBe(0);
      expect(result.auditRecords).toHaveLength(1);
    });
  });

  describe("getCreditBalance", () => {
    it("should return customer's credit balance", async () => {
      mockDb.getFirstAsync.mockResolvedValue({ credit_balance: 2500 });

      const balance = await paymentService.getCreditBalance("customer_1");

      expect(balance).toBe(2500);
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        "SELECT credit_balance FROM customers WHERE id = ?",
        ["customer_1"]
      );
    });
  });

  describe("applyCreditToSale", () => {
    it("should apply available credit to sale and update balances", async () => {
      // Mock customer with credit balance
      mockCustomerRepo.findById.mockResolvedValue({
        id: "customer_1",
        creditBalance: 3000,
      } as any);

      mockDb.withTransactionAsync.mockImplementation(async (callback) => {
        return await callback();
      });
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });
      mockDb.getFirstAsync.mockResolvedValue({ credit_balance: 3000 });

      const result = await paymentService.applyCreditToSale(
        "customer_1",
        5000,
        "txn_123"
      );

      expect(result.creditUsed).toBe(3000);
      expect(result.remainingAmount).toBe(2000);

      // Verify credit was deducted
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        `UPDATE customers SET credit_balance = credit_balance - ? WHERE id = ?`,
        [3000, "customer_1"]
      );

      // Verify audit record was created
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        `INSERT INTO payment_audit (id, customer_id, source_transaction_id, type, amount, metadata) VALUES (?, ?, ?, ?, ?, ?)`,
        expect.any(Array)
      );
    });

    it("should use partial credit when sale amount is less than credit balance", async () => {
      mockCustomerRepo.findById.mockResolvedValue({
        id: "customer_1",
        creditBalance: 5000,
      } as any);

      mockDb.withTransactionAsync.mockImplementation(async (callback) => {
        return await callback();
      });
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });
      mockDb.getFirstAsync.mockResolvedValue({ credit_balance: 5000 });

      const result = await paymentService.applyCreditToSale(
        "customer_1",
        2000,
        "txn_123"
      );

      expect(result.creditUsed).toBe(2000);
      expect(result.remainingAmount).toBe(0);
    });

    it("should not apply credit when customer has no credit balance", async () => {
      mockCustomerRepo.findById.mockResolvedValue({
        id: "customer_1",
        creditBalance: 0,
      } as any);

      mockDb.getFirstAsync.mockResolvedValue({ credit_balance: 0 });

      const result = await paymentService.applyCreditToSale(
        "customer_1",
        5000,
        "txn_123"
      );

      expect(result.creditUsed).toBe(0);
      expect(result.remainingAmount).toBe(5000);

      // Verify no database updates occurred
      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });
  });

  describe("getCreditSummary", () => {
    it("should return comprehensive credit summary", async () => {
      mockDb.getFirstAsync.mockResolvedValue({ credit_balance: 2500 });
      mockDb.getAllAsync.mockResolvedValue([
        {
          id: "audit_1",
          type: "over_payment",
          amount: 3000,
          created_at: "2024-01-02T10:00:00Z",
          metadata: JSON.stringify({ reason: "payment_excess" }),
        },
        {
          id: "audit_2",
          type: "credit_used",
          amount: 500,
          created_at: "2024-01-01T10:00:00Z",
          metadata: JSON.stringify({ reason: "credit_applied" }),
        },
      ]);

      const summary = await paymentService.getCreditSummary("customer_1");

      expect(summary.currentBalance).toBe(2500);
      expect(summary.totalEarned).toBe(3000);
      expect(summary.totalUsed).toBe(500);
      expect(summary.lastActivity).toBe("2024-01-02T10:00:00Z");
    });

    it("should handle customer with no credit activity", async () => {
      mockDb.getFirstAsync.mockResolvedValue({ credit_balance: 0 });
      mockDb.getAllAsync.mockResolvedValue([]);

      const summary = await paymentService.getCreditSummary("customer_1");

      expect(summary.currentBalance).toBe(0);
      expect(summary.totalEarned).toBe(0);
      expect(summary.totalUsed).toBe(0);
      expect(summary.lastActivity).toBeNull();
    });
  });

  describe("getPaymentAuditHistory", () => {
    it("should return formatted audit history", async () => {
      const mockAuditRecords = [
        {
          id: "audit_1",
          type: "over_payment",
          amount: 1000,
          created_at: "2024-01-01T10:00:00Z",
          metadata: JSON.stringify({ reason: "payment_excess" }),
        },
        {
          id: "audit_2",
          type: "credit_used",
          amount: 500,
          created_at: "2024-01-02T10:00:00Z",
          metadata: JSON.stringify({ reason: "credit_applied_to_purchase" }),
        },
      ];

      mockDb.getAllAsync.mockResolvedValue(mockAuditRecords);

      const history = await paymentService.getPaymentAuditHistory("customer_1");

      expect(history).toHaveLength(2);
      expect(history[0]).toEqual({
        id: "audit_1",
        type: "over_payment",
        amount: 1000,
        created_at: "2024-01-01T10:00:00Z",
        metadata: { reason: "payment_excess" },
      });
      expect(history[1]).toEqual({
        id: "audit_2",
        type: "credit_used",
        amount: 500,
        created_at: "2024-01-02T10:00:00Z",
        metadata: { reason: "credit_applied_to_purchase" },
      });
    });

    it("should handle records without metadata", async () => {
      const mockAuditRecords = [
        {
          id: "audit_1",
          type: "payment_applied",
          amount: 2000,
          created_at: "2024-01-01T10:00:00Z",
          metadata: null,
        },
      ];

      mockDb.getAllAsync.mockResolvedValue(mockAuditRecords);

      const history = await paymentService.getPaymentAuditHistory("customer_1");

      expect(history[0].metadata).toBeUndefined();
    });
  });

  describe("useCredit", () => {
    it("should deduct credit from customer balance and log usage", async () => {
      mockDb.getFirstAsync.mockResolvedValue({ credit_balance: 3000 });
      mockDb.withTransactionAsync.mockImplementation(async (callback) => {
        return await callback();
      });
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

      const result = await paymentService.useCredit("customer_1", 1500);

      expect(result.used).toBe(1500);
      expect(result.remaining).toBe(1500);

      // Verify credit deduction
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        `UPDATE customers SET credit_balance = credit_balance - ? WHERE id = ?`,
        [1500, "customer_1"]
      );

      // Verify audit logging
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        `INSERT INTO payment_audit (id, customer_id, source_transaction_id, type, amount, metadata) VALUES (?, ?, ?, ?, ?, ?)`,
        expect.any(Array)
      );
    });

    it("should use all available credit when requested amount exceeds balance", async () => {
      mockDb.getFirstAsync.mockResolvedValue({ credit_balance: 1000 });
      mockDb.withTransactionAsync.mockImplementation(async (callback) => {
        return await callback();
      });
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

      const result = await paymentService.useCredit("customer_1", 2000);

      expect(result.used).toBe(1000);
      expect(result.remaining).toBe(0);
    });

    it("should not deduct credit when customer has zero balance", async () => {
      mockDb.getFirstAsync.mockResolvedValue({ credit_balance: 0 });

      const result = await paymentService.useCredit("customer_1", 1000);

      expect(result.used).toBe(0);
      expect(result.remaining).toBe(0);

      // Verify no database updates occurred
      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });
  });
});
