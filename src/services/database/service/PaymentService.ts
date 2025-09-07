import { generateId } from "@/utils/helpers";
import { SQLiteDatabase } from "expo-sqlite";
import { CustomerRepository } from "../repositories/CustomerRepository";

export interface PaymentAllocationResult {
  appliedToDebt: number;
  creditCreated: number;
  remainingUnallocated: number;
  auditRecords: { type: string; id: string; amount: number }[];
}

/**
 * Service for handling payment allocation logic
 */
export class PaymentService {
  constructor(
    private db: SQLiteDatabase,
    private customerRepo: CustomerRepository
  ) {}

  /**
   * Allocates a payment for a customer:
   * - applies up to outstanding_balance
   * - if payment > outstanding, creates credit_balance for excess (default)
   * - records audit entries
   */
  async handlePaymentAllocation(
    customerId: string,
    paymentTxId: string,
    paymentAmount: number
  ): Promise<PaymentAllocationResult> {
    let result: PaymentAllocationResult | null = null;

    // Check if we're already in a transaction by trying to start a nested transaction
    let inTransaction = false;
    try {
      await this.db.withTransactionAsync(async () => {
        // If we can start a transaction, we're not already in one
        inTransaction = false;
      });
    } catch {
      // If we get an error starting a transaction, we're already in one
      inTransaction = true;
    }

    const executeAllocation = async () => {
      const customer = await this.customerRepo.findById(customerId);
      if (!customer) {
        throw new Error("Customer not found");
      }

      const outstanding = Number(customer.outstandingBalance);
      const toApply = Math.min(paymentAmount, outstanding);
      const excess = paymentAmount - toApply;

      const auditRecords: PaymentAllocationResult["auditRecords"] = [];

      // 1) apply payment to outstanding
      if (toApply > 0) {
        // subtract from outstanding
        await this.db.runAsync(
          `UPDATE customers SET outstandingBalance = GREATEST(0, outstandingBalance - ?) WHERE id = ?`,
          [toApply, customerId]
        );

        const auditId = generateId("audit");
        await this.db.runAsync(
          `INSERT INTO payment_audit (id, customer_id, source_transaction_id, type, amount, metadata) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            auditId,
            customerId,
            paymentTxId,
            "payment_applied",
            toApply,
            JSON.stringify({ appliedTo: "outstanding" }),
          ]
        );
        auditRecords.push({
          type: "payment_applied",
          id: auditId,
          amount: toApply,
        });
      }

      // 2) handle excess -> credit_balance
      if (excess > 0) {
        await this.db.runAsync(
          `UPDATE customers SET credit_balance = credit_balance + ? WHERE id = ?`,
          [excess, customerId]
        );

        const creditAuditId = generateId("audit");
        await this.db.runAsync(
          `INSERT INTO payment_audit (id, customer_id, source_transaction_id, type, amount, metadata) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            creditAuditId,
            customerId,
            paymentTxId,
            "over_payment",
            excess,
            JSON.stringify({ reason: "excess_payment -> credit_balance" }),
          ]
        );
        auditRecords.push({
          type: "over_payment",
          id: creditAuditId,
          amount: excess,
        });
      }

      // Set result
      result = {
        appliedToDebt: toApply,
        creditCreated: excess,
        remainingUnallocated: 0,
        auditRecords,
      };
    };

    if (inTransaction) {
      // We're already in a transaction, execute directly
      await executeAllocation();
    } else {
      // We're not in a transaction, create one
      await this.db.withTransactionAsync(executeAllocation);
    }

    if (!result) {
      throw new Error("Failed to allocate payment");
    }

    return result;
  }

  /**
   * Get customer's credit balance
   */
  async getCreditBalance(customerId: string): Promise<number> {
    const result = await this.db.getFirstAsync<{ credit_balance: number }>(
      "SELECT credit_balance FROM customers WHERE id = ?",
      [customerId]
    );
    return result?.credit_balance || 0;
  }

  /**
   * Get customer's payment audit history
   */
  async getPaymentAuditHistory(customerId: string): Promise<
    {
      id: string;
      type: string;
      amount: number;
      created_at: string;
      metadata?: any;
    }[]
  > {
    const results = await this.db.getAllAsync<{
      id: string;
      type: string;
      amount: number;
      created_at: string;
      metadata: string;
    }>(
      "SELECT id, type, amount, created_at, metadata FROM payment_audit WHERE customer_id = ? ORDER BY created_at DESC",
      [customerId]
    );

    return results.map((record) => ({
      ...record,
      metadata: record.metadata ? JSON.parse(record.metadata) : undefined,
    }));
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
      await this.db.runAsync(
        `UPDATE customers SET credit_balance = credit_balance - ? WHERE id = ?`,
        [toUse, customerId]
      );

      // Log credit usage
      const auditId = generateId("audit");
      await this.db.runAsync(
        `INSERT INTO payment_audit (id, customer_id, source_transaction_id, type, amount, metadata) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          auditId,
          customerId,
          "credit_usage",
          "credit_used",
          toUse,
          JSON.stringify({ reason: "credit_applied_to_purchase" }),
        ]
      );
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
      // Use the credit
      await this.useCredit(customerId, creditToUse);

      // Log the credit application to the sale
      const auditId = generateId("audit");
      await this.db.runAsync(
        `INSERT INTO payment_audit (id, customer_id, source_transaction_id, type, amount, metadata) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          auditId,
          customerId,
          saleTxId,
          "credit_applied_to_sale",
          creditToUse,
          JSON.stringify({
            reason: "credit_applied_to_sale",
            originalSaleAmount: saleAmount,
            creditUsed: creditToUse,
            remainingAfterCredit: saleAmount - creditToUse,
          }),
        ]
      );

      return {
        creditUsed: creditToUse,
        remainingAmount: saleAmount - creditToUse,
      };
    }

    return {
      creditUsed: 0,
      remainingAmount: saleAmount,
    };
  }

  /**
   * Get credit utilization summary for a customer
   */
  async getCreditSummary(customerId: string): Promise<{
    currentBalance: number;
    totalEarned: number;
    totalUsed: number;
    lastActivity: string | null;
  }> {
    const [currentBalance, history] = await Promise.all([
      this.getCreditBalance(customerId),
      this.getPaymentAuditHistory(customerId),
    ]);

    const totalEarned = history
      .filter((record) => record.type === "over_payment")
      .reduce((sum, record) => sum + record.amount, 0);

    const totalUsed = history
      .filter(
        (record) =>
          record.type === "credit_used" ||
          record.type === "credit_applied_to_sale"
      )
      .reduce((sum, record) => sum + record.amount, 0);

    const lastActivity = history.length > 0 ? history[0].created_at : null;

    return {
      currentBalance,
      totalEarned,
      totalUsed,
      lastActivity,
    };
  }
}
