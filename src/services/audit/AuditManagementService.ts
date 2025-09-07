/**
 * Centralized Audit Management Service
 *
 * Handles all audit trail operations for payments, transactions, and debt management.
 * Ensures consistent audit logging and provides comprehensive audit query capabilities.
 */

import { generateId } from "@/utils/helpers";
import { SQLiteDatabase } from "expo-sqlite";
import { PaymentAuditType } from "../database/service/PaymentService";

export interface AuditEntry {
  id: string;
  customerId: string;
  sourceTransactionId?: string;
  type: PaymentAuditType;
  amount: number;
  metadata?: any;
  createdAt: string;
}

export interface AuditSummary {
  totalEntries: number;
  totalAmount: number;
  byType: Record<string, { count: number; amount: number }>;
  dateRange: { earliest: string; latest: string } | null;
}

export interface TransactionAuditSummary {
  transactionId: string;
  totalAuditAmount: number;
  entries: AuditEntry[];
  calculatedPaidAmount: number;
  calculatedRemainingAmount: number;
}

/**
 * Service for managing audit trails and ensuring data consistency
 */
export class AuditManagementService {
  constructor(private db: SQLiteDatabase) {}

  /**
   * Create a new audit entry with proper validation
   */
  async createAuditEntry(
    customerId: string,
    type: PaymentAuditType,
    amount: number,
    options: {
      sourceTransactionId?: string;
      metadata?: any;
      withinTransaction?: boolean;
    } = {}
  ): Promise<string> {
    const auditId = generateId("audit");
    const now = new Date().toISOString();

    const auditEntry: AuditEntry = {
      id: auditId,
      customerId,
      sourceTransactionId: options.sourceTransactionId,
      type,
      amount: Number(amount || 0),
      metadata: options.metadata,
      createdAt: now,
    };

    const executeInsert = async () => {
      await this.db.runAsync(
        `INSERT INTO payment_audit (id, customer_id, source_transaction_id, type, amount, metadata, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          auditEntry.id,
          auditEntry.customerId,
          auditEntry.sourceTransactionId || null,
          auditEntry.type,
          auditEntry.amount,
          auditEntry.metadata ? JSON.stringify(auditEntry.metadata) : null,
          auditEntry.createdAt,
        ]
      );
    };

    if (options.withinTransaction) {
      await executeInsert();
    } else {
      await this.db.withTransactionAsync(executeInsert);
    }

    return auditId;
  }

  /**
   * Get audit history for a customer
   */
  async getCustomerAuditHistory(
    customerId: string,
    options: {
      limit?: number;
      offset?: number;
      types?: PaymentAuditType[];
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ): Promise<AuditEntry[]> {
    let query = `
      SELECT id, customer_id as customerId, source_transaction_id as sourceTransactionId, 
             type, amount, metadata, created_at as createdAt 
      FROM payment_audit 
      WHERE customer_id = ?
    `;
    const params: any[] = [customerId];

    // Add type filter
    if (options.types && options.types.length > 0) {
      const placeholders = options.types.map(() => "?").join(",");
      query += ` AND type IN (${placeholders})`;
      params.push(...options.types);
    }

    // Add date filters
    if (options.dateFrom) {
      query += ` AND created_at >= ?`;
      params.push(options.dateFrom);
    }
    if (options.dateTo) {
      query += ` AND created_at <= ?`;
      params.push(options.dateTo);
    }

    query += ` ORDER BY created_at DESC`;

    // Add pagination
    if (options.limit) {
      query += ` LIMIT ?`;
      params.push(options.limit);

      if (options.offset) {
        query += ` OFFSET ?`;
        params.push(options.offset);
      }
    }

    const results = await this.db.getAllAsync<any>(query, params);

    return results.map((row) => ({
      id: row.id,
      customerId: row.customerId,
      sourceTransactionId: row.sourceTransactionId,
      type: row.type,
      amount: Number(row.amount || 0),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: row.createdAt,
    }));
  }

  /**
   * Get audit entries for a specific transaction
   */
  async getTransactionAuditHistory(
    transactionId: string
  ): Promise<TransactionAuditSummary> {
    const entries = await this.db.getAllAsync<any>(
      `SELECT id, customer_id as customerId, source_transaction_id as sourceTransactionId, 
              type, amount, metadata, created_at as createdAt 
       FROM payment_audit 
       WHERE source_transaction_id = ? 
       ORDER BY created_at DESC`,
      [transactionId]
    );

    const auditEntries: AuditEntry[] = entries.map((row) => ({
      id: row.id,
      customerId: row.customerId,
      sourceTransactionId: row.sourceTransactionId,
      type: row.type,
      amount: Number(row.amount || 0),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: row.createdAt,
    }));

    // Calculate totals based on audit entries
    const paymentTypes: PaymentAuditType[] = [
      "payment_allocation",
      "credit_applied_to_sale",
      "partial_payment",
    ];

    const totalAuditAmount = auditEntries
      .filter((entry) => paymentTypes.includes(entry.type))
      .reduce((sum, entry) => sum + entry.amount, 0);

    // Get the original transaction to calculate remaining amount
    const transaction = await this.db.getFirstAsync<any>(
      `SELECT amount FROM transactions WHERE id = ?`,
      [transactionId]
    );

    const originalAmount = Number(transaction?.amount || 0);
    const calculatedPaidAmount = Math.min(totalAuditAmount, originalAmount);
    const calculatedRemainingAmount = Math.max(
      0,
      originalAmount - calculatedPaidAmount
    );

    return {
      transactionId,
      totalAuditAmount,
      entries: auditEntries,
      calculatedPaidAmount,
      calculatedRemainingAmount,
    };
  }

  /**
   * Get audit summary for a customer
   */
  async getCustomerAuditSummary(customerId: string): Promise<AuditSummary> {
    const entries = await this.getCustomerAuditHistory(customerId);

    if (entries.length === 0) {
      return {
        totalEntries: 0,
        totalAmount: 0,
        byType: {},
        dateRange: null,
      };
    }

    const byType: Record<string, { count: number; amount: number }> = {};
    let totalAmount = 0;

    entries.forEach((entry) => {
      if (!byType[entry.type]) {
        byType[entry.type] = { count: 0, amount: 0 };
      }
      byType[entry.type].count++;
      byType[entry.type].amount += entry.amount;
      totalAmount += entry.amount;
    });

    const dates = entries.map((e) => e.createdAt).sort();
    const dateRange =
      dates.length > 0
        ? {
            earliest: dates[0],
            latest: dates[dates.length - 1],
          }
        : null;

    return {
      totalEntries: entries.length,
      totalAmount,
      byType,
      dateRange,
    };
  }

  /**
   * Verify audit integrity for a transaction
   */
  async verifyTransactionAuditIntegrity(transactionId: string): Promise<{
    isConsistent: boolean;
    issues: string[];
    auditTotal: number;
    storedPaidAmount: number;
    difference: number;
  }> {
    const auditSummary = await this.getTransactionAuditHistory(transactionId);

    const transaction = await this.db.getFirstAsync<any>(
      `SELECT paidAmount, remainingAmount, amount FROM transactions WHERE id = ?`,
      [transactionId]
    );

    if (!transaction) {
      return {
        isConsistent: false,
        issues: ["Transaction not found"],
        auditTotal: 0,
        storedPaidAmount: 0,
        difference: 0,
      };
    }

    const storedPaidAmount = Number(transaction.paidAmount || 0);
    const auditTotal = auditSummary.totalAuditAmount;
    const difference = Math.abs(storedPaidAmount - auditTotal);
    const tolerance = 0.01; // Allow for floating point precision

    const issues: string[] = [];

    if (difference > tolerance) {
      issues.push(
        `Audit total (₦${auditTotal}) doesn't match stored paid amount (₦${storedPaidAmount})`
      );
    }

    const totalAmount = Number(transaction.amount || 0);
    const storedTotal =
      Number(transaction.paidAmount || 0) +
      Number(transaction.remainingAmount || 0);

    if (Math.abs(storedTotal - totalAmount) > tolerance) {
      issues.push(
        `Stored amounts don't sum to total amount (₦${storedTotal} vs ₦${totalAmount})`
      );
    }

    return {
      isConsistent: issues.length === 0,
      issues,
      auditTotal,
      storedPaidAmount,
      difference,
    };
  }

  /**
   * Fix transaction amounts based on audit history
   */
  async reconcileTransactionFromAudit(transactionId: string): Promise<{
    updated: boolean;
    oldPaidAmount: number;
    newPaidAmount: number;
    oldRemainingAmount: number;
    newRemainingAmount: number;
    oldStatus: string;
    newStatus: string;
  }> {
    const auditSummary = await this.getTransactionAuditHistory(transactionId);

    const transaction = await this.db.getFirstAsync<any>(
      `SELECT paidAmount, remainingAmount, amount, status, type, paymentMethod FROM transactions WHERE id = ?`,
      [transactionId]
    );

    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const oldPaidAmount = Number(transaction.paidAmount || 0);
    const oldRemainingAmount = Number(transaction.remainingAmount || 0);
    const oldStatus = transaction.status;

    const newPaidAmount = auditSummary.calculatedPaidAmount;
    const newRemainingAmount = auditSummary.calculatedRemainingAmount;

    // Calculate new status
    const { TransactionCalculationService } = await import(
      "../calculations/TransactionCalculationService"
    );
    const statusResult =
      TransactionCalculationService.calculateTransactionStatus(
        transaction.type,
        transaction.paymentMethod,
        Number(transaction.amount),
        newPaidAmount,
        newRemainingAmount
      );

    const newStatus = statusResult.status;

    // Only update if there are changes
    const needsUpdate =
      Math.abs(oldPaidAmount - newPaidAmount) > 0.01 ||
      Math.abs(oldRemainingAmount - newRemainingAmount) > 0.01 ||
      oldStatus !== newStatus;

    if (needsUpdate) {
      await this.db.runAsync(
        `UPDATE transactions 
         SET paidAmount = ?, remainingAmount = ?, status = ?, updatedAt = ? 
         WHERE id = ?`,
        [
          newPaidAmount,
          newRemainingAmount,
          newStatus,
          new Date().toISOString(),
          transactionId,
        ]
      );

      // Log the reconciliation
      await this.createAuditEntry(
        transaction.customerId || "",
        "status_change",
        0,
        {
          sourceTransactionId: transactionId,
          metadata: {
            action: "audit_reconciliation",
            oldPaidAmount,
            newPaidAmount,
            oldRemainingAmount,
            newRemainingAmount,
            oldStatus,
            newStatus,
          },
          withinTransaction: true,
        }
      );
    }

    return {
      updated: needsUpdate,
      oldPaidAmount,
      newPaidAmount,
      oldRemainingAmount,
      newRemainingAmount,
      oldStatus,
      newStatus,
    };
  }

  /**
   * Batch reconcile all transactions for a customer
   */
  async reconcileCustomerTransactions(customerId: string): Promise<{
    processedCount: number;
    updatedCount: number;
    errors: string[];
  }> {
    const transactions = await this.db.getAllAsync<{ id: string }>(
      `SELECT id FROM transactions WHERE customerId = ? AND isDeleted = 0`,
      [customerId]
    );

    let processedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (const transaction of transactions) {
      try {
        const result = await this.reconcileTransactionFromAudit(transaction.id);
        processedCount++;
        if (result.updated) {
          updatedCount++;
        }
      } catch (error) {
        errors.push(
          `Failed to reconcile transaction ${transaction.id}: ${error}`
        );
      }
    }

    return {
      processedCount,
      updatedCount,
      errors,
    };
  }
}
