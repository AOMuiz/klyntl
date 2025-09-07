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
        id: "cust_1",
        outstandingBalance: 5000,
        creditBalance: 0,
      } as any);

      // Mock debts query to return mock debts
      mockDb.getAllAsync.mockResolvedValue([
        {
          id: "debt_1",
          remainingAmount: 3000,
          date: "2024-01-01T00:00:00Z",
          status: "pending",
        },
        {
          id: "debt_2",
          remainingAmount: 2000,
          date: "2024-01-02T00:00:00Z",
          status: "pending",
        },
      ]);

      // Mock transaction callback
      mockDb.withTransactionAsync.mockImplementation(async (callback) => {
        return await callback();
      });

      // Mock successful DB operations
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

      const result = await paymentService.handlePaymentAllocation(
        "cust_1",
        "txn_123",
        7000
      );

      // Verify results
      expect(result.appliedToDebt).toBe(5000);
      expect(result.creditCreated).toBe(2000);
      expect(result.remainingUnallocated).toBe(0);
      expect(result.auditRecords).toHaveLength(3); // 2 debt allocations + 1 over payment
      expect(result.statusChanges).toHaveLength(2); // Both debts should change status

      // Verify debt allocations occurred
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        `UPDATE transactions 
             SET remainingAmount = remainingAmount - ?, 
                 status = ? 
             WHERE id = ?`,
        [3000, "completed", "debt_1"]
      );

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        `UPDATE transactions 
             SET remainingAmount = remainingAmount - ?, 
                 status = ? 
             WHERE id = ?`,
        [2000, "completed", "debt_2"]
      );

      // Verify customer balance update
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        `UPDATE customers SET outstandingBalance = CASE WHEN outstandingBalance - ? < 0 THEN 0 ELSE outstandingBalance - ? END WHERE id = ?`,
        [5000, 5000, "cust_1"]
      );

      // Verify credit creation
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        `UPDATE customers SET credit_balance = credit_balance + ? WHERE id = ?`,
        [2000, "cust_1"]
      );
    });

    it("should handle payment exactly equal to outstanding balance", async () => {
      mockCustomerRepo.findById.mockResolvedValue({
        id: "cust_1",
        outstandingBalance: 5000,
        creditBalance: 0,
      } as any);

      // Mock debts that equal the payment amount
      mockDb.getAllAsync.mockResolvedValue([
        {
          id: "debt_1",
          remainingAmount: 3000,
          date: "2024-01-01T00:00:00Z",
          status: "pending",
        },
        {
          id: "debt_2",
          remainingAmount: 2000,
          date: "2024-01-02T00:00:00Z",
          status: "pending",
        },
      ]);

      mockDb.withTransactionAsync.mockImplementation(async (callback) => {
        return await callback();
      });
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

      const result = await paymentService.handlePaymentAllocation(
        "cust_1",
        "txn_123",
        5000
      );

      expect(result.appliedToDebt).toBe(5000);
      expect(result.creditCreated).toBe(0);
      expect(result.auditRecords).toHaveLength(2); // 2 debt allocations only
      expect(result.statusChanges).toHaveLength(2); // Both debts change status
    });

    it("should handle payment less than outstanding balance", async () => {
      mockCustomerRepo.findById.mockResolvedValue({
        id: "cust_1",
        outstandingBalance: 5000,
        creditBalance: 0,
      } as any);

      // Mock debts where payment won't cover all
      mockDb.getAllAsync.mockResolvedValue([
        {
          id: "debt_1",
          remainingAmount: 3000,
          date: "2024-01-01T00:00:00Z",
          status: "pending",
        },
        {
          id: "debt_2",
          remainingAmount: 2000,
          date: "2024-01-02T00:00:00Z",
          status: "pending",
        },
      ]);

      mockDb.withTransactionAsync.mockImplementation(async (callback) => {
        return await callback();
      });
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

      const result = await paymentService.handlePaymentAllocation(
        "cust_1",
        "txn_123",
        3000
      );

      expect(result.appliedToDebt).toBe(3000);
      expect(result.creditCreated).toBe(0);
      expect(result.auditRecords).toHaveLength(1); // Only first debt fully allocated
      expect(result.statusChanges).toHaveLength(1); // Only first debt changes status
    });
  });

  describe("getCreditBalance", () => {
    it("should return customer's credit balance", async () => {
      mockDb.getFirstAsync.mockResolvedValue({ credit_balance: 2500 });

      const balance = await paymentService.getCreditBalance("cust_1");

      expect(balance).toBe(2500);
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        "SELECT credit_balance FROM customers WHERE id = ?",
        ["cust_1"]
      );
    });
  });

  describe("applyCreditToSale", () => {
    it("should apply available credit to sale and update balances", async () => {
      // Mock customer with credit balance
      mockCustomerRepo.findById.mockResolvedValue({
        id: "cust_1",
        creditBalance: 3000,
      } as any);

      mockDb.withTransactionAsync.mockImplementation(async (callback) => {
        return await callback();
      });
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });
      mockDb.getFirstAsync
        .mockResolvedValueOnce({ credit_balance: 3000 }) // First call for getCreditBalance in useCredit
        .mockResolvedValueOnce({ credit_balance: 3000 }) // Second call for getCreditBalance in applyCreditToSale
        .mockResolvedValueOnce({
          // Third call for current transaction details
          amount: 5000,
          paidAmount: 0,
          remainingAmount: 5000,
          paymentMethod: "credit",
          type: "sale",
        });

      const result = await paymentService.applyCreditToSale(
        "cust_1",
        5000,
        "txn_123"
      );

      expect(result.creditUsed).toBe(3000);
      expect(result.remainingAmount).toBe(2000);

      // Verify credit was deducted (via useCredit method)
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        `UPDATE customers SET credit_balance = credit_balance - ? WHERE id = ?`,
        [3000, "cust_1"]
      );

      // Verify transaction was updated with proper status calculation
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        `UPDATE transactions SET 
               paidAmount = ?, 
               remainingAmount = ?, 
               status = ? 
             WHERE id = ?`,
        [3000, 2000, "partial", "txn_123"]
      );

      // Verify outstanding balance was reduced
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        `UPDATE customers SET outstandingBalance = CASE WHEN outstandingBalance - ? < 0 THEN 0 ELSE outstandingBalance - ? END WHERE id = ?`,
        [3000, 3000, "cust_1"]
      );

      // Verify audit records were created (one for credit usage, one for credit applied to sale)
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        `INSERT INTO payment_audit (id, customer_id, source_transaction_id, type, amount, metadata) VALUES (?, ?, ?, ?, ?, ?)`,
        expect.arrayContaining([
          expect.any(String),
          "cust_1",
          "credit_usage",
          "credit_used",
          3000,
          expect.any(String),
        ])
      );

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        `INSERT INTO payment_audit (id, customer_id, source_transaction_id, type, amount, metadata) VALUES (?, ?, ?, ?, ?, ?)`,
        expect.arrayContaining([
          expect.any(String),
          "cust_1",
          "txn_123",
          "credit_applied_to_sale",
          3000,
          expect.any(String),
        ])
      );
    });

    it("should use partial credit when sale amount is less than credit balance", async () => {
      mockCustomerRepo.findById.mockResolvedValue({
        id: "cust_1",
        creditBalance: 5000,
      } as any);

      mockDb.withTransactionAsync.mockImplementation(async (callback) => {
        return await callback();
      });
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });
      mockDb.getFirstAsync
        .mockResolvedValueOnce({ credit_balance: 5000 }) // First call for getCreditBalance in useCredit
        .mockResolvedValueOnce({ credit_balance: 5000 }) // Second call for getCreditBalance in applyCreditToSale
        .mockResolvedValueOnce({
          // Third call for current transaction details
          amount: 2000,
          paidAmount: 0,
          remainingAmount: 2000,
          paymentMethod: "credit",
          type: "sale",
        });

      const result = await paymentService.applyCreditToSale(
        "cust_1",
        2000,
        "txn_123"
      );

      expect(result.creditUsed).toBe(2000);
      expect(result.remainingAmount).toBe(0);
    });

    it("should not apply credit when customer has no credit balance", async () => {
      mockCustomerRepo.findById.mockResolvedValue({
        id: "cust_1",
        creditBalance: 0,
      } as any);

      mockDb.getFirstAsync.mockResolvedValue({ credit_balance: 0 });

      const result = await paymentService.applyCreditToSale(
        "cust_1",
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

      const summary = await paymentService.getCreditSummary("cust_1");

      expect(summary.currentBalance).toBe(2500);
      expect(summary.totalEarned).toBe(3000);
      expect(summary.totalUsed).toBe(500);
      expect(summary.lastActivity).toBe("2024-01-02T10:00:00Z");
    });

    it("should handle customer with no credit activity", async () => {
      mockDb.getFirstAsync.mockResolvedValue({ credit_balance: 0 });
      mockDb.getAllAsync.mockResolvedValue([]);

      const summary = await paymentService.getCreditSummary("cust_1");

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

      const history = await paymentService.getPaymentAuditHistory("cust_1");

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

      const history = await paymentService.getPaymentAuditHistory("cust_1");

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

      const result = await paymentService.useCredit("cust_1", 1500);

      expect(result.used).toBe(1500);
      expect(result.remaining).toBe(1500);

      // Verify credit deduction
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        `UPDATE customers SET credit_balance = credit_balance - ? WHERE id = ?`,
        [1500, "cust_1"]
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

      const result = await paymentService.useCredit("cust_1", 2000);

      expect(result.used).toBe(1000);
      expect(result.remaining).toBe(0);
    });

    it("should not deduct credit when customer has zero balance", async () => {
      mockDb.getFirstAsync.mockResolvedValue({ credit_balance: 0 });

      const result = await paymentService.useCredit("cust_1", 1000);

      expect(result.used).toBe(0);
      expect(result.remaining).toBe(0);

      // Verify no database updates occurred
      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });
  });
});
