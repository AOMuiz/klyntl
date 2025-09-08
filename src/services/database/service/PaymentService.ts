import { generateId } from "@/utils/helpers";
import { SQLiteDatabase } from "expo-sqlite";
import { CustomerRepository } from "../repositories/CustomerRepository";
import { ValidationError } from "./utilService";

export type PaymentAuditType =
  | "payment"
  | "over_payment"
  | "refund"
  | "credit_note"
  | "payment_allocation"
  | "credit_applied_to_sale"
  | "credit_used"
  | "payment_applied"
  | "credit_usage"
  | "status_change"
  | "partial_payment"
  | "full_payment";

export interface PaymentAudit {
  id: string;
  customer_id: string;
  source_transaction_id?: string;
  type: PaymentAuditType;
  amount: number;
  created_at: string;
  metadata?: any;
}

export interface PaymentAllocationResult {
  appliedToDebt: number;
  creditCreated: number;
  remainingUnallocated: number;
  auditRecords: { type: string; id: string; amount: number }[];
  statusChanges: {
    transactionId: string;
    oldStatus: string;
    newStatus: string;
  }[];
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
   * @deprecated Use SimplePaymentService.handlePaymentAllocation() instead.
   * This method is maintained for backward compatibility but will be removed in a future version.
   * The new SimplePaymentService provides the same functionality with improved performance and simpler logic.
   */
  async handlePaymentAllocation(
    customerId: string,
    paymentTxId: string,
    paymentAmount: number,
    withinExistingTransaction: boolean = false
  ): Promise<PaymentAllocationResult> {
    if (paymentAmount <= 0) {
      throw new ValidationError("Payment amount must be greater than zero");
    }

    let result: PaymentAllocationResult | null = null;

    // Only start a transaction if we're not already within one
    const executeAllocation = async () => {
      const customer = await this.customerRepo.findById(customerId);
      if (!customer) {
        throw new Error("Customer not found");
      }

      const outstanding = Number(customer.outstandingBalance) || 0;
      let remainingToAllocate = paymentAmount;
      const auditRecords: PaymentAllocationResult["auditRecords"] = [];
      const statusChanges: PaymentAllocationResult["statusChanges"] = [];

      // 1) allocate to outstanding debts (oldest first)
      if (outstanding > 0) {
        let debts: {
          id: string;
          remainingAmount: number;
          date: string;
          status: string;
        }[] = [];

        try {
          const debtResults = await this.db.getAllAsync<{
            id: string;
            remainingAmount: number;
            date: string;
            status: string;
          }>(
            `SELECT id, remainingAmount, date, status FROM transactions 
           WHERE customerId = ? AND type IN ('sale', 'credit') 
           AND remainingAmount > 0 AND isDeleted = 0 
           ORDER BY date ASC`,
            [customerId]
          );
          debts = debtResults || [];
        } catch (error) {
          console.warn("Error fetching debts:", error);
          debts = [];
        }

        for (const debt of debts) {
          if (remainingToAllocate <= 0) break;

          const allocateAmount = Math.min(
            remainingToAllocate,
            debt.remainingAmount
          );

          // Calculate new status based on remaining amount after allocation
          const newRemainingAmount = debt.remainingAmount - allocateAmount;
          const oldStatus = debt.status;
          const newStatus = this.calculateDebtStatus(newRemainingAmount);

          // update the debt transaction row
          await this.db.runAsync(
            `UPDATE transactions 
             SET remainingAmount = remainingAmount - ?, 
                 status = ? 
             WHERE id = ?`,
            [allocateAmount, newStatus, debt.id]
          );

          // Link the payment transaction to this debt transaction
          await this.db.runAsync(
            `UPDATE transactions 
             SET linkedTransactionId = ? 
             WHERE id = ?`,
            [debt.id, paymentTxId]
          );

          // Track status changes for audit
          if (oldStatus !== newStatus) {
            statusChanges.push({
              transactionId: debt.id,
              oldStatus,
              newStatus,
            });

            // Log status change in audit
            const statusAuditId = generateId("audit");
            await this.db.runAsync(
              `INSERT INTO payment_audit (id, customer_id, source_transaction_id, type, amount, metadata) VALUES (?, ?, ?, ?, ?, ?)`,
              [
                statusAuditId,
                customerId,
                paymentTxId,
                "status_change",
                0,
                JSON.stringify({
                  debtId: debt.id,
                  oldStatus,
                  newStatus,
                  allocatedAmount: allocateAmount,
                }),
              ]
            );
          }

          const auditId = generateId("audit");
          await this.db.runAsync(
            `INSERT INTO payment_audit (id, customer_id, source_transaction_id, type, amount, metadata) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              auditId,
              customerId,
              paymentTxId,
              "payment_allocation",
              allocateAmount,
              JSON.stringify({ debtId: debt.id }),
            ]
          );

          auditRecords.push({
            type: "payment_allocation",
            id: auditId,
            amount: allocateAmount,
          });

          remainingToAllocate -= allocateAmount;
        }

        const applied = paymentAmount - remainingToAllocate;

        if (applied > 0) {
          // decrease outstandingBalance safely using portable CASE expression
          await this.db.runAsync(
            `UPDATE customers SET outstandingBalance = CASE WHEN outstandingBalance - ? < 0 THEN 0 ELSE outstandingBalance - ? END WHERE id = ?`,
            [applied, applied, customerId]
          );
        }
      }

      // 2) handle excess -> credit_balance
      const excess = remainingToAllocate > 0 ? remainingToAllocate : 0;
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

      result = {
        appliedToDebt: paymentAmount - remainingToAllocate,
        creditCreated: excess,
        remainingUnallocated: 0,
        auditRecords,
        statusChanges,
      };
    };

    if (withinExistingTransaction) {
      // Execute without starting a new transaction
      await executeAllocation();
    } else {
      // Start a new transaction
      await this.db.withTransactionAsync(executeAllocation);
    }

    if (!result) {
      throw new Error("Failed to allocate payment");
    }

    return result;
  }

  /**
   * Calculate the appropriate status for a debt based on remaining amount
   */
  private calculateDebtStatus(remainingAmount: number): string {
    if (remainingAmount <= 0) {
      return "completed";
    } else {
      return "partial"; // If there's still debt remaining, it's partial
    }
  }

  /**
   * Calculate transaction status based on transaction type, payment method, and amounts
   */
  public calculateTransactionStatus(
    type: string,
    paymentMethod: string = "cash",
    totalAmount: number,
    paidAmount: number = 0,
    remainingAmount: number = 0
  ): string {
    // Payment transactions are always completed when recorded
    if (type === "payment") {
      return "completed";
    }

    // Refund transactions are always completed when recorded
    if (type === "refund") {
      return "completed";
    }

    // For sales and credit transactions, status depends on payment details
    if (type === "sale" || type === "credit") {
      // Cash payments are always completed immediately
      if (paymentMethod === "cash") {
        return paidAmount >= totalAmount ? "completed" : "partial";
      }

      // Credit payments start as pending
      if (paymentMethod === "credit") {
        if (remainingAmount >= totalAmount) {
          return "pending";
        } else if (remainingAmount > 0) {
          return "partial";
        } else {
          return "completed";
        }
      }

      // Mixed payments status depends on remaining amount
      if (paymentMethod === "mixed") {
        if (remainingAmount <= 0) {
          return "completed";
        } else if (paidAmount > 0) {
          return "partial";
        } else {
          return "pending";
        }
      }

      // Bank transfer and POS card payments
      if (paymentMethod === "bank_transfer" || paymentMethod === "pos_card") {
        return paidAmount >= totalAmount ? "completed" : "partial";
      }

      // Default case based on amounts
      if (remainingAmount <= 0) {
        return "completed";
      } else if (paidAmount > 0) {
        return "partial";
      } else {
        return "pending";
      }
    }

    // Default fallback
    return "pending";
  }

  /**
   * @deprecated Use TransactionRepository.updateStatus() instead.
   * This method is maintained for backward compatibility but will be removed in a future version.
   * Transaction status updates should be handled through the repository layer.
   */
  public async updateTransactionStatus(
    transactionId: string,
    newPaidAmount: number,
    newRemainingAmount: number
  ): Promise<{ oldStatus: string; newStatus: string }> {
    // Get current transaction details
    const transaction = await this.db.getFirstAsync<{
      id: string;
      type: string;
      paymentMethod: string;
      amount: number;
      status: string;
    }>(
      `SELECT id, type, paymentMethod, amount, status FROM transactions WHERE id = ?`,
      [transactionId]
    );

    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const oldStatus = transaction.status;
    const newStatus = this.calculateTransactionStatus(
      transaction.type,
      transaction.paymentMethod,
      transaction.amount,
      newPaidAmount,
      newRemainingAmount
    );

    // Update the transaction
    await this.db.runAsync(
      `UPDATE transactions SET paidAmount = ?, remainingAmount = ?, status = ? WHERE id = ?`,
      [newPaidAmount, newRemainingAmount, newStatus, transactionId]
    );

    return { oldStatus, newStatus };
  }
  /**
   * @deprecated Use SimplePaymentService.getCreditBalance() instead.
   * This method is maintained for backward compatibility but will be removed in a future version.
   * The new SimplePaymentService provides the same functionality with improved performance.
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
      metadata: string | null;
    }>(
      `SELECT id, type, amount, created_at, metadata FROM payment_audit WHERE customer_id = ? ORDER BY created_at DESC`,
      [customerId]
    );

    // Return the minimal shape consumers/tests expect (backwards compatible)
    return (results || []).map((record) => ({
      id: record.id,
      type: record.type,
      amount: Number(record.amount || 0),
      created_at: record.created_at,
      metadata: record.metadata ? JSON.parse(record.metadata) : undefined,
    }));
  }

  /**
   * @deprecated Use SimplePaymentService.useCredit() instead.
   * This method is maintained for backward compatibility but will be removed in a future version.
   * The new SimplePaymentService provides the same functionality with improved performance and simpler logic.
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
   * @deprecated Use SimplePaymentService.applyCreditToSale() instead.
   * This method is maintained for backward compatibility but will be removed in a future version.
   * The new SimplePaymentService provides the same functionality with improved performance and simpler logic.
   */
  async applyCreditToSale(
    customerId: string,
    saleAmount: number,
    saleTxId: string,
    withinExistingTransaction: boolean = false
  ): Promise<{ creditUsed: number; remainingAmount: number }> {
    // Get current credit and decide how much to apply
    const creditBalance = await this.getCreditBalance(customerId);
    const creditToUse = Math.min(creditBalance, saleAmount);

    if (creditToUse > 0) {
      const executeCreditApplication = async () => {
        // Use the credit (updates credit_balance and inserts audit)
        await this.useCredit(customerId, creditToUse);

        // Get current transaction details for proper status calculation
        const currentTx = await this.db.getFirstAsync<{
          amount: number;
          paidAmount: number;
          remainingAmount: number;
          paymentMethod: string;
          type: string;
        }>(
          `SELECT amount, paidAmount, remainingAmount, paymentMethod, type FROM transactions WHERE id = ?`,
          [saleTxId]
        );

        if (currentTx) {
          const newPaidAmount = (currentTx.paidAmount || 0) + creditToUse;
          const newRemainingAmount = Math.max(
            0,
            (currentTx.remainingAmount || currentTx.amount) - creditToUse
          );

          // Calculate proper status based on transaction details
          const newStatus = this.calculateTransactionStatus(
            currentTx.type,
            currentTx.paymentMethod,
            currentTx.amount,
            newPaidAmount,
            newRemainingAmount
          );

          // Update the sale transaction to reflect credit application
          await this.db.runAsync(
            `UPDATE transactions SET 
               paidAmount = ?, 
               remainingAmount = ?, 
               status = ? 
             WHERE id = ?`,
            [newPaidAmount, newRemainingAmount, newStatus, saleTxId]
          );
        }

        // Decrease customer's outstanding balance safely
        await this.db.runAsync(
          `UPDATE customers SET outstandingBalance = CASE WHEN outstandingBalance - ? < 0 THEN 0 ELSE outstandingBalance - ? END WHERE id = ?`,
          [creditToUse, creditToUse, customerId]
        );

        // Insert an audit record linking credit -> sale
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
              originalSaleAmount: saleAmount,
              creditUsed: creditToUse,
            }),
          ]
        );
      };

      if (withinExistingTransaction) {
        // Execute without starting a new transaction
        await executeCreditApplication();
      } else {
        // Start a new transaction
        await this.db.withTransactionAsync(executeCreditApplication);
      }

      return {
        creditUsed: creditToUse,
        remainingAmount: saleAmount - creditToUse,
      };
    }

    return { creditUsed: 0, remainingAmount: saleAmount };
  }

  /**
   * @deprecated Use SimplePaymentService methods instead.
   * This method is maintained for backward compatibility but will be removed in a future version.
   * Credit summary functionality is available through SimplePaymentService methods.
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

  /**
   * Process a mixed payment (partial cash, partial credit)
   */
  async processMixedPayment(
    customerId: string,
    transactionId: string,
    cashAmount: number,
    creditAmount: number
  ): Promise<{
    cashProcessed: number;
    creditProcessed: number;
    statusChanged: boolean;
    newStatus: string;
  }> {
    const transaction = await this.db.getFirstAsync<{
      id: string;
      amount: number;
      paidAmount: number;
      remainingAmount: number;
      type: string;
      paymentMethod: string;
      status: string;
    }>(
      `SELECT id, amount, paidAmount, remainingAmount, type, paymentMethod, status FROM transactions WHERE id = ?`,
      [transactionId]
    );

    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    let actualCashAmount = cashAmount;
    let actualCreditAmount = 0;

    await this.db.withTransactionAsync(async () => {
      // Process credit portion if requested
      if (creditAmount > 0) {
        const creditBalance = await this.getCreditBalance(customerId);
        actualCreditAmount = Math.min(creditAmount, creditBalance);

        if (actualCreditAmount > 0) {
          await this.useCredit(customerId, actualCreditAmount);
        }
      }

      // Calculate new amounts
      const totalPayment = actualCashAmount + actualCreditAmount;
      const newPaidAmount = (transaction.paidAmount || 0) + totalPayment;
      const newRemainingAmount = Math.max(
        0,
        transaction.amount - newPaidAmount
      );

      // Calculate new status
      const newStatus = this.calculateTransactionStatus(
        transaction.type,
        "mixed",
        transaction.amount,
        newPaidAmount,
        newRemainingAmount
      );

      // Update transaction
      await this.db.runAsync(
        `UPDATE transactions SET 
           paidAmount = ?, 
           remainingAmount = ?, 
           status = ?,
           paymentMethod = 'mixed'
         WHERE id = ?`,
        [newPaidAmount, newRemainingAmount, newStatus, transactionId]
      );

      // Update customer balances
      if (newRemainingAmount < (transaction.remainingAmount || 0)) {
        const debtReduction =
          (transaction.remainingAmount || 0) - newRemainingAmount;
        await this.db.runAsync(
          `UPDATE customers SET outstandingBalance = CASE WHEN outstandingBalance - ? < 0 THEN 0 ELSE outstandingBalance - ? END WHERE id = ?`,
          [debtReduction, debtReduction, customerId]
        );
      }

      // Log payment audit
      if (totalPayment > 0) {
        const auditId = generateId("audit");
        await this.db.runAsync(
          `INSERT INTO payment_audit (id, customer_id, source_transaction_id, type, amount, metadata) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            auditId,
            customerId,
            transactionId,
            "partial_payment",
            totalPayment,
            JSON.stringify({
              cashAmount: actualCashAmount,
              creditAmount: actualCreditAmount,
              oldStatus: transaction.status,
              newStatus,
            }),
          ]
        );
      }
    });

    return {
      cashProcessed: actualCashAmount,
      creditProcessed: actualCreditAmount,
      statusChanged:
        transaction.status !==
        this.calculateTransactionStatus(
          transaction.type,
          "mixed",
          transaction.amount,
          (transaction.paidAmount || 0) + actualCashAmount + actualCreditAmount,
          Math.max(
            0,
            transaction.amount -
              ((transaction.paidAmount || 0) +
                actualCashAmount +
                actualCreditAmount)
          )
        ),
      newStatus: this.calculateTransactionStatus(
        transaction.type,
        "mixed",
        transaction.amount,
        (transaction.paidAmount || 0) + actualCashAmount + actualCreditAmount,
        Math.max(
          0,
          transaction.amount -
            ((transaction.paidAmount || 0) +
              actualCashAmount +
              actualCreditAmount)
        )
      ),
    };
  }

  /**
   * Cancel a transaction and handle reversals
   */
  async cancelTransaction(
    transactionId: string,
    reason: string = "Cancelled by user"
  ): Promise<{ success: boolean; reversalAmount: number }> {
    const transaction = await this.db.getFirstAsync<{
      id: string;
      customerId: string;
      amount: number;
      paidAmount: number;
      remainingAmount: number;
      type: string;
      status: string;
    }>(
      `SELECT id, customerId, amount, paidAmount, remainingAmount, type, status FROM transactions WHERE id = ?`,
      [transactionId]
    );

    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    if (transaction.status === "cancelled") {
      return { success: false, reversalAmount: 0 };
    }

    let reversalAmount = 0;

    await this.db.withTransactionAsync(async () => {
      // Calculate reversal amounts
      const paidAmount = transaction.paidAmount || 0;
      const remainingAmount = transaction.remainingAmount || 0;

      if (transaction.type === "sale" || transaction.type === "credit") {
        // For sales/credits, reverse any paid amount and outstanding debt
        reversalAmount = paidAmount;

        // Reverse outstanding balance
        if (remainingAmount > 0) {
          await this.db.runAsync(
            `UPDATE customers SET outstandingBalance = CASE WHEN outstandingBalance - ? < 0 THEN 0 ELSE outstandingBalance - ? END WHERE id = ?`,
            [remainingAmount, remainingAmount, transaction.customerId]
          );
        }

        // Create credit for paid amount if any
        if (paidAmount > 0) {
          await this.db.runAsync(
            `UPDATE customers SET credit_balance = credit_balance + ? WHERE id = ?`,
            [paidAmount, transaction.customerId]
          );
        }
      }

      // Update transaction status
      await this.db.runAsync(
        `UPDATE transactions SET status = 'cancelled' WHERE id = ?`,
        [transactionId]
      );

      // Log cancellation audit
      const auditId = generateId("audit");
      await this.db.runAsync(
        `INSERT INTO payment_audit (id, customer_id, source_transaction_id, type, amount, metadata) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          auditId,
          transaction.customerId,
          transactionId,
          "status_change",
          reversalAmount,
          JSON.stringify({
            oldStatus: transaction.status,
            newStatus: "cancelled",
            reason,
            reversalAmount,
          }),
        ]
      );
    });

    return { success: true, reversalAmount };
  }

  /**
   * Get comprehensive payment status for a transaction
   */
  async getTransactionPaymentStatus(transactionId: string): Promise<{
    transactionId: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    status: string;
    paymentMethod: string;
    percentagePaid: number;
    isOverdue: boolean;
    daysOverdue?: number;
    lastPaymentDate?: string;
    paymentHistory: {
      date: string;
      amount: number;
      type: string;
      method: string;
    }[];
  }> {
    const transaction = await this.db.getFirstAsync<{
      id: string;
      amount: number;
      paidAmount: number;
      remainingAmount: number;
      status: string;
      paymentMethod: string;
      dueDate: string | null;
      date: string;
    }>(
      `SELECT id, amount, paidAmount, remainingAmount, status, paymentMethod, dueDate, date FROM transactions WHERE id = ?`,
      [transactionId]
    );

    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    // Get payment history from audit records
    const paymentHistory = await this.db.getAllAsync<{
      created_at: string;
      amount: number;
      type: string;
      metadata: string | null;
    }>(
      `SELECT created_at, amount, type, metadata FROM payment_audit 
       WHERE source_transaction_id = ? 
       AND type IN ('payment_allocation', 'partial_payment', 'credit_applied_to_sale')
       ORDER BY created_at DESC`,
      [transactionId]
    );

    // Calculate overdue status
    const now = new Date();
    const dueDate = transaction.dueDate ? new Date(transaction.dueDate) : null;
    const isOverdue = dueDate
      ? now > dueDate && transaction.remainingAmount > 0
      : false;
    const daysOverdue =
      isOverdue && dueDate
        ? Math.floor(
            (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        : undefined;

    // Get last payment date
    const lastPayment =
      paymentHistory.length > 0 ? paymentHistory[0].created_at : undefined;

    return {
      transactionId: transaction.id,
      totalAmount: transaction.amount,
      paidAmount: transaction.paidAmount || 0,
      remainingAmount: transaction.remainingAmount || 0,
      status: transaction.status,
      paymentMethod: transaction.paymentMethod || "cash",
      percentagePaid:
        transaction.amount > 0
          ? ((transaction.paidAmount || 0) / transaction.amount) * 100
          : 0,
      isOverdue,
      daysOverdue,
      lastPaymentDate: lastPayment,
      paymentHistory: paymentHistory.map((p) => ({
        date: p.created_at,
        amount: p.amount,
        type: p.type,
        method: p.metadata
          ? JSON.parse(p.metadata).paymentMethod || "unknown"
          : "unknown",
      })),
    };
  }
}
