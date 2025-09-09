import { SQLiteDatabase } from "expo-sqlite";
import { SimpleTransactionCalculator } from "../../../calculations/SimpleTransactionCalculator";
import { CustomerRepository } from "../../repositories/CustomerRepository";
import { AuditLogService } from "../../service/AuditLogService";
import { PaymentService } from "../../service/PaymentService";
import { SimplePaymentService } from "../../service/SimplePaymentService";
import { TransactionRepository } from "../TransactionRepository";

/**
 * TDD Integration Tests for TransactionRepository
 *
 * Tests the integration of SimpleTransactionCalculator and SimplePaymentService
 * with TransactionRepository for Nigerian SME transaction workflows.
 */

describe("TransactionRepository - TDD Integration", () => {
  let mockDb: jest.Mocked<SQLiteDatabase>;
  let mockCustomerRepo: jest.Mocked<CustomerRepository>;
  let mockAuditService: jest.Mocked<AuditLogService>;
  let mockPaymentService: jest.Mocked<PaymentService>;
  let mockSimplePaymentService: jest.Mocked<SimplePaymentService>;
  let transactionRepo: TransactionRepository;

  const mockCustomer = {
    id: "customer-1",
    name: "Adebayo Oluwaseun",
    phone: "+2348012345678",
    outstandingBalance: 0,
    creditBalance: 0,
    totalSpent: 0,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    // Mock SQLite database
    mockDb = {
      runAsync: jest.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 1 }),
      getFirstAsync: jest.fn(),
      getAllAsync: jest.fn(),
      withTransactionAsync: jest.fn((callback) => callback()),
    } as any;

    // Mock CustomerRepository
    mockCustomerRepo = {
      findById: jest.fn(),
      updateTotals: jest.fn(),
      updateTotalSpent: jest.fn(),
      increaseOutstandingBalance: jest.fn(),
      decreaseOutstandingBalance: jest.fn(),
    } as any;

    // Mock AuditLogService
    mockAuditService = {
      logEntry: jest.fn(),
    } as any;

    // Mock PaymentService
    mockPaymentService = {
      handlePaymentAllocation: jest.fn(),
      applyCreditToSale: jest.fn(),
      calculateTransactionStatus: jest.fn(),
    } as any;

    // Mock SimplePaymentService
    mockSimplePaymentService = {
      handlePaymentAllocation: jest.fn(),
      applyCreditToSale: jest.fn(),
      getCreditBalance: jest.fn(),
      useCredit: jest.fn(),
      logSimpleAudit: jest.fn(),
    } as any;

    transactionRepo = new TransactionRepository(
      mockDb,
      mockAuditService,
      mockCustomerRepo,
      mockSimplePaymentService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Nigerian SME Edge Case 1: Cash Sale Transaction", () => {
    it("should create cash sale transaction with completed status", async () => {
      // Arrange
      const saleData = {
        customerId: "customer-1",
        amount: 5000, // ₦5,000 cash sale
        type: "sale" as const,
        paymentMethod: "cash" as const,
        date: "2024-01-15T10:00:00.000Z",
        description: "Rice purchase",
      };

      mockCustomerRepo.findById.mockResolvedValue(mockCustomer);

      // Act
      const result = await transactionRepo.create(saleData);

      // Assert
      expect(result).toMatchObject({
        customerId: "customer-1",
        amount: 5000,
        type: "sale",
        paymentMethod: "cash",
        paidAmount: 5000, // Full payment
        remainingAmount: 0, // No debt
        status: "completed",
      });

      // Verify customer totals updated
      expect(mockCustomerRepo.updateTotals).toHaveBeenCalledWith([
        "customer-1",
      ]);
    });
  });

  describe("Nigerian SME Edge Case 2: Credit Sale Transaction", () => {
    it("should create credit sale transaction and apply available credit", async () => {
      // Arrange
      const saleData = {
        customerId: "customer-1",
        amount: 10000, // ₦10,000 credit sale
        type: "sale" as const,
        paymentMethod: "credit" as const,
        date: "2024-01-15T10:00:00.000Z",
        description: "Yam purchase",
      };

      mockCustomerRepo.findById.mockResolvedValue({
        ...mockCustomer,
        creditBalance: 3000, // Customer has ₦3,000 credit
      });

      // Mock SimplePaymentService credit application
      mockSimplePaymentService.applyCreditToSale.mockResolvedValue({
        creditUsed: 3000,
        remainingAmount: 7000, // ₦7,000 debt after credit
      });

      // Act
      const result = await transactionRepo.create(saleData);

      // Assert
      expect(result).toMatchObject({
        customerId: "customer-1",
        amount: 10000,
        type: "sale",
        paymentMethod: "credit",
        paidAmount: 3000, // Credit applied
        remainingAmount: 7000, // Remaining debt
        status: "pending", // Status is pending when there's remaining debt
      });

      // Verify SimplePaymentService was used
      expect(mockSimplePaymentService.applyCreditToSale).toHaveBeenCalledWith(
        "customer-1",
        10000,
        result.id
      );
    });

    it("should create credit sale transaction when no credit available", async () => {
      // Arrange
      const saleData = {
        customerId: "customer-1",
        amount: 8000, // ₦8,000 credit sale
        type: "sale" as const,
        paymentMethod: "credit" as const,
        date: "2024-01-15T10:00:00.000Z",
        description: "Garri purchase",
      };

      mockCustomerRepo.findById.mockResolvedValue({
        ...mockCustomer,
        creditBalance: 0, // No credit available
      });

      // Mock SimplePaymentService credit application (no credit used)
      mockSimplePaymentService.applyCreditToSale.mockResolvedValue({
        creditUsed: 0,
        remainingAmount: 8000, // Full amount as debt
      });

      // Act
      const result = await transactionRepo.create(saleData);

      // Assert
      expect(result).toMatchObject({
        customerId: "customer-1",
        amount: 8000,
        type: "sale",
        paymentMethod: "credit",
        paidAmount: 0, // No payment
        remainingAmount: 8000, // Full debt
        status: "pending", // No payment made
      });
    });
  });

  describe("Nigerian SME Edge Case 3: Mixed Payment Transaction", () => {
    it("should create mixed payment sale with credit application", async () => {
      // Arrange
      const saleData = {
        customerId: "customer-1",
        amount: 15000, // ₦15,000 total
        paidAmount: 5000, // ₦5,000 cash paid
        type: "sale" as const,
        paymentMethod: "mixed" as const,
        date: "2024-01-15T10:00:00.000Z",
        description: "Mixed payment - Beans & Rice",
      };

      mockCustomerRepo.findById.mockResolvedValue({
        ...mockCustomer,
        creditBalance: 2000, // Customer has ₦2,000 credit
      });

      // Mock SimplePaymentService credit application
      mockSimplePaymentService.applyCreditToSale.mockResolvedValue({
        creditUsed: 2000,
        remainingAmount: 8000, // ₦8,000 debt after cash + credit
      });

      // Act
      const result = await transactionRepo.create(saleData);

      // Assert
      expect(result).toMatchObject({
        customerId: "customer-1",
        amount: 15000,
        type: "sale",
        paymentMethod: "mixed",
        paidAmount: 7000, // ₦5,000 cash + ₦2,000 credit
        remainingAmount: 8000, // Remaining debt
        status: "partial",
      });

      // Verify SimplePaymentService was used for credit application
      expect(mockSimplePaymentService.applyCreditToSale).toHaveBeenCalledWith(
        "customer-1",
        10000, // Remaining after cash: ₦15,000 - ₦5,000 = ₦10,000
        result.id
      );
    });
  });

  describe("Nigerian SME Edge Case 4: Payment Transaction with Overpayment", () => {
    it("should handle payment with overpayment and credit creation", async () => {
      // Arrange
      const paymentData = {
        customerId: "customer-1",
        amount: 12000, // ₦12,000 payment
        type: "payment" as const,
        paymentMethod: "cash" as const,
        date: "2024-01-16T10:00:00.000Z",
        description: "Debt payment with overpayment",
        appliedToDebt: true,
      };

      mockCustomerRepo.findById.mockResolvedValue({
        ...mockCustomer,
        outstandingBalance: 8000, // ₦8,000 debt
      });

      // Mock SimplePaymentService payment allocation
      mockSimplePaymentService.handlePaymentAllocation.mockResolvedValue({
        debtReduced: 8000,
        creditCreated: 4000, // ₦4,000 overpayment
        success: true,
      });

      // Act
      const result = await transactionRepo.create(paymentData);

      // Assert
      expect(result).toMatchObject({
        customerId: "customer-1",
        amount: 12000,
        type: "payment",
        paymentMethod: "cash",
        paidAmount: 12000,
        remainingAmount: 0,
        status: "completed",
      });

      // Verify SimplePaymentService was used for allocation
      expect(
        mockSimplePaymentService.handlePaymentAllocation
      ).toHaveBeenCalledWith("customer-1", 12000, true);
    });
  });

  describe("Nigerian SME Edge Case 5: Credit Transaction (Loan)", () => {
    it("should create credit transaction and increase debt", async () => {
      // Arrange
      const creditData = {
        customerId: "customer-1",
        amount: 25000, // ₦25,000 loan
        type: "credit" as const,
        paymentMethod: "credit" as const,
        date: "2024-01-17T10:00:00.000Z",
        description: "Business loan",
      };

      mockCustomerRepo.findById.mockResolvedValue(mockCustomer);

      // Act
      const result = await transactionRepo.create(creditData);

      // Assert
      expect(result).toMatchObject({
        customerId: "customer-1",
        amount: 25000,
        type: "credit",
        paymentMethod: "credit",
        paidAmount: 0, // No payment for credit
        remainingAmount: 25000, // Full amount as debt
        status: "pending", // Credit not yet paid
      });

      // Verify debt increase
      expect(mockCustomerRepo.increaseOutstandingBalance).toHaveBeenCalledWith(
        "customer-1",
        25000
      );
    });
  });

  describe("Nigerian SME Edge Case 6: Refund Transaction", () => {
    it("should create refund transaction and reduce debt", async () => {
      // Arrange
      const refundData = {
        customerId: "customer-1",
        amount: 3000, // ₦3,000 refund
        type: "refund" as const,
        paymentMethod: "cash" as const,
        date: "2024-01-18T10:00:00.000Z",
        description: "Product return refund",
      };

      mockCustomerRepo.findById.mockResolvedValue({
        ...mockCustomer,
        outstandingBalance: 10000, // ₦10,000 debt
      });

      // Act
      const result = await transactionRepo.create(refundData);

      // Assert
      expect(result).toMatchObject({
        customerId: "customer-1",
        amount: 3000,
        type: "refund",
        paymentMethod: "cash",
        paidAmount: 3000,
        remainingAmount: 0,
        status: "completed",
      });

      // Verify debt reduction
      expect(mockCustomerRepo.decreaseOutstandingBalance).toHaveBeenCalledWith(
        "customer-1",
        3000
      );
    });
  });

  describe("Integration with SimpleTransactionCalculator", () => {
    it("should use SimpleTransactionCalculator for status calculation", async () => {
      // Arrange
      const saleData = {
        customerId: "customer-1",
        amount: 10000,
        paidAmount: 6000,
        remainingAmount: 4000,
        type: "sale" as const,
        paymentMethod: "mixed" as const,
        date: "2024-01-15T10:00:00.000Z",
        description: "Mixed payment sale",
      };

      mockCustomerRepo.findById.mockResolvedValue(mockCustomer);

      // Act
      const result = await transactionRepo.create(saleData);

      // Assert - Status should be calculated correctly for mixed payment
      expect(result.status).toBe("partial"); // Mixed payment with remaining amount
    });

    it("should validate mixed payment amounts using SimpleTransactionCalculator", async () => {
      // This would be tested in a separate validation test
      // For now, we ensure the transaction creation handles mixed payments correctly
      const validation = SimpleTransactionCalculator.validateMixedPayment(
        10000, // total
        4000, // cash
        6000 // credit
      );

      expect(validation.isValid).toBe(true);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should throw error for invalid customer", async () => {
      const saleData = {
        customerId: "invalid-customer",
        amount: 5000,
        type: "sale" as const,
        paymentMethod: "cash" as const,
        date: "2024-01-15T10:00:00.000Z",
      };

      mockCustomerRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(transactionRepo.create(saleData)).rejects.toThrow(
        "Customer with identifier 'invalid-customer' not found"
      );
    });

    it("should handle zero amount transactions", async () => {
      const saleData = {
        customerId: "customer-1",
        amount: 0,
        type: "sale" as const,
        paymentMethod: "cash" as const,
        date: "2024-01-15T10:00:00.000Z",
      };

      mockCustomerRepo.findById.mockResolvedValue(mockCustomer);

      // Act & Assert - Should throw validation error for zero amount sales
      await expect(transactionRepo.create(saleData)).rejects.toThrow(
        "Sale amount cannot be zero"
      );
    });
  });

  describe("Audit Logging Integration", () => {
    it("should log transaction creation to audit service", async () => {
      const saleData = {
        customerId: "customer-1",
        amount: 5000,
        type: "sale" as const,
        paymentMethod: "cash" as const,
        date: "2024-01-15T10:00:00.000Z",
        description: "Audited sale",
      };

      mockCustomerRepo.findById.mockResolvedValue(mockCustomer);

      await transactionRepo.create(saleData);

      expect(mockAuditService.logEntry).toHaveBeenCalledWith({
        tableName: "transactions",
        operation: "CREATE",
        recordId: expect.any(String),
        newValues: expect.any(Object),
      });
    });
  });
});
