import { generateId } from "@/utils/helpers";
import { SQLiteDatabase } from "expo-sqlite";
import { CustomerRepository } from "../repositories/CustomerRepository";

/**
 * Simplified Payment Service for Nigerian SMEs
 *
 * Handles core payment operations without complex audit trails
 */

export interface SimplePaymentResult {
  debtReduced: number;
  creditCreated: number;
  success: boolean;
}

export interface SimplePaymentAudit {
  id: string;
  customer_id: string;
  type: "payment" | "overpayment" | "credit_used";
  amount: number;
  created_at: string;
  description: string;
}

export class SimplePaymentService {
  constructor(
    private db: SQLiteDatabase,
    private customerRepo: CustomerRepository
  ) {}

  /**
   * Handle payment allocation with overpayment support
   */
  async handlePaymentAllocation(
    customerId: string,
    paymentAmount: number,
    applyToDebt: boolean = true
  ): Promise<SimplePaymentResult> {
    if (paymentAmount <= 0) {
      throw new Error("Payment amount must be greater than 0");
    }

    if (!applyToDebt) {
      // Payment for future service - create credit
      await this.createCreditBalance(customerId, paymentAmount);
      return {
        debtReduced: 0,
        creditCreated: paymentAmount,
        success: true,
      };
    }

    // Get current debt
    const customer = await this.customerRepo.findById(customerId);
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    const currentDebt = customer.outstandingBalance || 0;

    let debtReduced = 0;
    let creditCreated = 0;

    await this.db.withTransactionAsync(async () => {
      if (currentDebt === 0) {
        // No debt - create credit balance
        creditCreated = paymentAmount;
        await this.createCreditBalance(customerId, paymentAmount);
        await this.logSimpleAudit(
          customerId,
          "payment",
          paymentAmount,
          "Payment converted to credit (no existing debt)"
        );
      } else if (paymentAmount >= currentDebt) {
        // Overpayment - clear debt and create credit
        debtReduced = currentDebt;
        creditCreated = paymentAmount - currentDebt;

        // Clear debt
        await this.customerRepo.decreaseOutstandingBalance(
          customerId,
          currentDebt
        );

        // Create credit for excess
        if (creditCreated > 0) {
          await this.createCreditBalance(customerId, creditCreated);
          await this.logSimpleAudit(
            customerId,
            "overpayment",
            creditCreated,
            "Excess payment converted to credit"
          );
        }

        await this.logSimpleAudit(
          customerId,
          "payment",
          debtReduced,
          "Debt fully paid"
        );
      } else {
        // Normal payment - reduce debt
        debtReduced = paymentAmount;
        await this.customerRepo.decreaseOutstandingBalance(
          customerId,
          paymentAmount
        );
        await this.logSimpleAudit(
          customerId,
          "payment",
          paymentAmount,
          "Partial debt payment"
        );
      }
    });

    return {
      debtReduced,
      creditCreated,
      success: true,
    };
  }

  /**
   * Get customer's credit balance
   */
  async getCreditBalance(customerId: string): Promise<number> {
    const result = await this.db.getFirstAsync<{ credit_balance: number }>(
      "SELECT COALESCE(credit_balance, 0) as credit_balance FROM customers WHERE id = ?",
      [customerId]
    );
    return result?.credit_balance || 0;
  }

  /**
   * Use customer credit for a purchase
   */
  async useCredit(
    customerId: string,
    amount: number
  ): Promise<{ used: number; remaining: number }> {
    const currentCredit = await this.getCreditBalance(customerId);
    const toUse = Math.min(amount, currentCredit);

    if (toUse > 0) {
      await this.db.withTransactionAsync(async () => {
        // Reduce credit balance
        await this.db.runAsync(
          `UPDATE customers SET credit_balance = credit_balance - ? WHERE id = ?`,
          [toUse, customerId]
        );

        // Log credit usage
        await this.logSimpleAudit(
          customerId,
          "credit_used",
          toUse,
          "Credit used for purchase"
        );
      });
    }

    return {
      used: toUse,
      remaining: currentCredit - toUse,
    };
  }

  /**
   * Apply customer credit to a sale transaction
   */
  async applyCreditToSale(
    customerId: string,
    saleAmount: number,
    saleTxId: string
  ): Promise<{ creditUsed: number; remainingAmount: number }> {
    const creditBalance = await this.getCreditBalance(customerId);
    const creditToUse = Math.min(creditBalance, saleAmount);

    if (creditToUse > 0) {
      await this.db.withTransactionAsync(async () => {
        // Use the credit
        await this.useCredit(customerId, creditToUse);

        // Update the transaction
        const newPaidAmount = creditToUse;
        const newRemainingAmount = saleAmount - creditToUse;
        const newStatus = newRemainingAmount > 0 ? "partial" : "completed";

        await this.db.runAsync(
          `UPDATE transactions SET 
             paidAmount = ?, 
             remainingAmount = ?, 
             status = ? 
           WHERE id = ?`,
          [newPaidAmount, newRemainingAmount, newStatus, saleTxId]
        );

        // Update customer debt (reduce by credit used)
        if (newRemainingAmount > 0) {
          // This creates new debt, so we need to increase outstanding balance
          await this.customerRepo.increaseOutstandingBalance(
            customerId,
            newRemainingAmount
          );
        }
      });
    }

    return {
      creditUsed: creditToUse,
      remainingAmount: saleAmount - creditToUse,
    };
  }

  /**
   * Get simple payment history
   */
  async getPaymentHistory(
    customerId: string,
    limit: number = 50
  ): Promise<SimplePaymentAudit[]> {
    const results = await this.db.getAllAsync<any>(
      `SELECT id, customer_id, type, amount, created_at, description 
       FROM simple_payment_audit 
       WHERE customer_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [customerId, limit]
    );

    return results.map((row) => ({
      id: row.id,
      customer_id: row.customer_id,
      type: row.type,
      amount: Number(row.amount || 0),
      created_at: row.created_at,
      description: row.description,
    }));
  }

  /**
   * Get credit summary for customer
   */
  async getCreditSummary(customerId: string): Promise<{
    currentBalance: number;
    totalEarned: number;
    totalUsed: number;
  }> {
    const [currentBalance, history] = await Promise.all([
      this.getCreditBalance(customerId),
      this.getPaymentHistory(customerId),
    ]);

    const totalEarned = history
      .filter((record) => record.type === "overpayment")
      .reduce((sum, record) => sum + record.amount, 0);

    const totalUsed = history
      .filter((record) => record.type === "credit_used")
      .reduce((sum, record) => sum + record.amount, 0);

    return {
      currentBalance,
      totalEarned,
      totalUsed,
    };
  }

  /**
   * Process a payment with various payment methods
   */
  async processPayment(params: {
    customerId: string;
    amount: number;
    paymentMethod: string;
    description?: string;
  }): Promise<{
    success: boolean;
    amountProcessed: number;
    debtReduced: number;
    creditCreated: number;
  }> {
    const { customerId, amount } = params;

    if (amount <= 0) {
      throw new Error("Payment amount must be greater than 0");
    }

    const result = await this.handlePaymentAllocation(customerId, amount, true);

    return {
      success: result.success,
      amountProcessed: amount,
      debtReduced: result.debtReduced,
      creditCreated: result.creditCreated,
    };
  }

  /**
   * Process a mixed payment (cash + credit)
   */
  async processMixedPayment(params: {
    customerId: string;
    totalAmount: number;
    cashAmount: number;
    creditAmount: number;
    description?: string;
  }): Promise<{
    success: boolean;
    cashProcessed: number;
    creditUsed: number;
    totalProcessed: number;
  }> {
    const { customerId, totalAmount, cashAmount, creditAmount } = params;

    // Validate mixed payment
    if (Math.abs(cashAmount + creditAmount - totalAmount) > 0.01) {
      throw new Error("Cash + credit amounts must equal total amount");
    }

    let actualCreditUsed = 0;

    // Process credit portion first
    if (creditAmount > 0) {
      const creditResult = await this.useCredit(customerId, creditAmount);
      actualCreditUsed = creditResult.used;
    }

    // Process cash portion
    let cashProcessed = 0;
    if (cashAmount > 0) {
      await this.handlePaymentAllocation(customerId, cashAmount, true);
      cashProcessed = cashAmount;
    }

    return {
      success: true,
      cashProcessed,
      creditUsed: actualCreditUsed,
      totalProcessed: cashProcessed + actualCreditUsed,
    };
  }

  /**
   * Calculate transaction status - simplified
   */
  public calculateTransactionStatus(
    type: string,
    paymentMethod: string = "cash",
    totalAmount: number,
    paidAmount: number = 0,
    remainingAmount: number = 0
  ): string {
    // Simple status calculation
    if (type === "payment" || type === "refund") {
      return "completed";
    }

    if (remainingAmount <= 0) {
      return "completed";
    }

    if (paidAmount > 0) {
      return "partial";
    }

    return "pending";
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Create or add to credit balance
   */
  private async createCreditBalance(
    customerId: string,
    amount: number
  ): Promise<void> {
    await this.db.runAsync(
      `UPDATE customers SET credit_balance = COALESCE(credit_balance, 0) + ? WHERE id = ?`,
      [amount, customerId]
    );
  }

  /**
   * Log simple audit entry
   */
  private async logSimpleAudit(
    customerId: string,
    type: "payment" | "overpayment" | "credit_used",
    amount: number,
    description: string
  ): Promise<void> {
    try {
      const auditId = generateId("audit");
      const now = new Date().toISOString();

      await this.db.runAsync(
        `INSERT INTO simple_payment_audit (id, customer_id, type, amount, created_at, description) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [auditId, customerId, type, amount, now, description]
      );
    } catch (error) {
      // Don't throw - audit logging shouldn't break main operations
      console.warn("Failed to log simple audit:", error);
    }
  }
}
