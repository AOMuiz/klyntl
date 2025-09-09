/**
 * Simplified Transaction Calculation Service for Nigerian SMEs
 *
 * This service now wraps SimpleTransactionCalculator and provides additional
 * utility methods for transaction verification and audit management.
 *
 * Use SimpleTransactionCalculator directly for basic operations.
 */

import { Transaction } from "@/types/transaction";
import { SimplePaymentAudit } from "../database/service/SimplePaymentService";
import { SimpleTransactionCalculator } from "./SimpleTransactionCalculator";

export interface TransactionStatus {
  status: "pending" | "partial" | "completed" | "cancelled" | "overdue";
  paidAmount: number;
  remainingAmount: number;
  percentagePaid: number;
}

export interface DebtImpact {
  before: number;
  after: number;
  change: number;
  isIncrease: boolean;
  isDecrease: boolean;
  noChange: boolean;
}

export interface TransactionVerification {
  isConsistent: boolean;
  storedTotal: number;
  computedTotal: number;
  difference: number;
  issues: string[];
  recommendations: string[];
}

export interface PaymentBreakdown {
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  auditTotal: number;
  verification: TransactionVerification;
  paymentHistory: PaymentHistoryEntry[];
}

export interface PaymentHistoryEntry {
  id: string;
  date: string;
  amount: number;
  type: string;
  source: string;
  description: string;
}

/**
 * Enhanced calculation service that wraps SimpleTransactionCalculator
 */
export class TransactionCalculationService {
  /**
   * Calculate transaction status based on amounts and payment method
   * @deprecated Use SimpleTransactionCalculator.calculateStatus() directly
   */
  static calculateTransactionStatus(
    type: string,
    paymentMethod: string,
    totalAmount: number,
    paidAmount: number,
    remainingAmount: number,
    dueDate?: string
  ): TransactionStatus {
    // Delegate to SimpleTransactionCalculator for consistency
    const result = SimpleTransactionCalculator.calculateStatus(
      type,
      totalAmount,
      paidAmount,
      remainingAmount
    );

    // Add overdue logic that SimpleTransactionCalculator doesn't handle
    // Note: SimpleTransactionCalculator only supports "pending" | "partial" | "completed"
    // Keep the calculated status and handle overdue logic at the UI level
    let finalStatus = result.status;
    // Remove overdue status assignment since it's not supported by SimpleTransactionCalculator

    return {
      status: finalStatus,
      paidAmount: result.paidAmount,
      remainingAmount: result.remainingAmount,
      percentagePaid: result.percentagePaid,
    };
  }

  /**
   * Calculate correct paid/remaining amounts for transaction creation
   * @deprecated Use SimpleTransactionCalculator.calculateInitialAmounts() directly
   */
  static calculateInitialAmounts(
    type: string,
    paymentMethod: string,
    amount: number,
    providedPaidAmount?: number,
    providedRemainingAmount?: number
  ): { paidAmount: number; remainingAmount: number; paymentMethod: string } {
    // Delegate to SimpleTransactionCalculator
    return SimpleTransactionCalculator.calculateInitialAmounts(
      type,
      paymentMethod,
      amount,
      providedPaidAmount
    );
  }

  /**
   * Calculate debt impact of a transaction on customer balance
   * @deprecated Use SimpleTransactionCalculator.calculateDebtImpact() directly
   */
  static calculateDebtImpact(
    transaction: Transaction,
    currentBalance: number
  ): DebtImpact {
    const before = Number(currentBalance || 0);

    // Use SimpleTransactionCalculator for consistent logic
    const impact = SimpleTransactionCalculator.calculateDebtImpact(
      transaction.type,
      transaction.paymentMethod || "cash",
      transaction.amount,
      transaction.appliedToDebt
    );

    // Convert to signed change value
    const change = impact.isDecrease ? -impact.change : impact.change;
    const after = Math.max(0, before + change);

    return {
      before,
      after,
      change: Math.abs(change),
      isIncrease: impact.isIncrease,
      isDecrease: impact.isDecrease,
      noChange: !impact.isIncrease && !impact.isDecrease,
    };
  }

  /**
   * Verify transaction data consistency
   */
  static verifyTransactionConsistency(
    transaction: Transaction,
    auditHistory: SimplePaymentAudit[] = []
  ): TransactionVerification {
    const issues: string[] = [];
    const recommendations: string[] = [];

    const totalAmount = Number(transaction.amount || 0);
    const storedPaid = Number(transaction.paidAmount || 0);
    const storedRemaining = Number(transaction.remainingAmount || 0);
    const storedTotal = storedPaid + storedRemaining;

    // Calculate simple verification from stored amounts (SimplePaymentAudit doesn't track per-transaction data)
    const computedPaid = storedPaid;
    const computedRemaining = storedRemaining;
    const computedTotal = computedPaid + computedRemaining;

    // Check for basic inconsistencies
    const tolerance = 0.01; // Allow for floating point precision

    if (Math.abs(storedTotal - totalAmount) > tolerance) {
      issues.push(
        `Stored amounts (₦${storedTotal}) don't match total amount (₦${totalAmount})`
      );
      recommendations.push(
        "Recalculate paidAmount and remainingAmount based on total"
      );
    }

    if (storedPaid > totalAmount) {
      issues.push(
        `Paid amount (₦${storedPaid}) exceeds total amount (₦${totalAmount})`
      );
      recommendations.push("Cap paid amount at total amount");
    }

    if (storedRemaining < 0) {
      issues.push(`Remaining amount is negative (₦${storedRemaining})`);
      recommendations.push("Set remaining amount to zero or positive value");
    }

    const difference = Math.abs(storedTotal - computedTotal);

    return {
      isConsistent: issues.length === 0,
      storedTotal,
      computedTotal,
      difference,
      issues,
      recommendations,
    };
  }

  /**
   * Generate payment breakdown with audit verification
   * Simplified for SimplePaymentAudit structure
   */
  static generatePaymentBreakdown(
    transaction: Transaction,
    auditHistory: SimplePaymentAudit[] = []
  ): PaymentBreakdown {
    const totalAmount = Number(transaction.amount || 0);
    const storedPaid = Number(transaction.paidAmount || 0);

    // Convert audit history to payment history entries (simplified)
    const paymentHistory: PaymentHistoryEntry[] = auditHistory
      .map((audit) => ({
        id: audit.id,
        date: audit.created_at,
        amount: Number(audit.amount || 0),
        type: audit.type,
        source: audit.customer_id,
        description: this.getAuditDescription(audit),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // For simplified audit, use stored values
    const paidAmount = storedPaid;
    const remainingAmount = Math.max(0, totalAmount - paidAmount);

    const verification = this.verifyTransactionConsistency(
      transaction,
      auditHistory
    );

    return {
      totalAmount,
      paidAmount,
      remainingAmount,
      auditTotal: storedPaid, // Use stored value since audit doesn't track per-transaction
      verification,
      paymentHistory,
    };
  }

  /**
   * Get human-readable description for audit entry
   * Simplified for SimplePaymentAudit structure
   */
  private static getAuditDescription(audit: SimplePaymentAudit): string {
    const amount = Number(audit.amount || 0);

    switch (audit.type) {
      case "payment":
        return `Payment: ₦${amount.toLocaleString()}`;
      case "overpayment":
        return `Overpayment: ₦${amount.toLocaleString()}`;
      case "credit_used":
        return `Credit used: ₦${amount.toLocaleString()}`;
      case "balance_consolidation":
        return `Balance consolidated: ₦${amount.toLocaleString()}`;
      default:
        return `${audit.type}: ₦${amount.toLocaleString()}`;
    }
  }

  /**
   * Calculate customer balance impact from transaction
   * @deprecated Use SimpleTransactionCalculator.calculateCustomerBalanceImpact() directly
   */
  static calculateCustomerBalanceImpact(
    transaction: Transaction,
    currentOutstandingBalance: number = 0,
    currentCreditBalance: number = 0
  ): {
    outstandingBalanceChange: number;
    creditBalanceChange: number;
    newOutstandingBalance: number;
    newCreditBalance: number;
    impactType:
      | "debt_increase"
      | "debt_decrease"
      | "credit_increase"
      | "credit_decrease"
      | "no_change";
  } {
    // Use SimpleTransactionCalculator for consistent calculation
    const impact = SimpleTransactionCalculator.calculateCustomerBalanceImpact(
      transaction.type,
      transaction.paymentMethod || "cash",
      transaction.amount,
      transaction.remainingAmount || 0,
      transaction.appliedToDebt
    );

    const newOutstandingBalance = Math.max(
      0,
      currentOutstandingBalance + impact.debtChange
    );
    const newCreditBalance = Math.max(
      0,
      currentCreditBalance + impact.creditChange
    );

    // Determine impact type
    let impactType:
      | "debt_increase"
      | "debt_decrease"
      | "credit_increase"
      | "credit_decrease"
      | "no_change" = "no_change";
    if (impact.debtChange > 0) impactType = "debt_increase";
    else if (impact.debtChange < 0) impactType = "debt_decrease";
    else if (impact.creditChange > 0) impactType = "credit_increase";
    else if (impact.creditChange < 0) impactType = "credit_decrease";

    return {
      outstandingBalanceChange: impact.debtChange,
      creditBalanceChange: impact.creditChange,
      newOutstandingBalance,
      newCreditBalance,
      impactType,
    };
  }
}
