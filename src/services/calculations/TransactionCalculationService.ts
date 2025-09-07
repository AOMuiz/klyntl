/**
 * Centralized Transaction Calculation Service
 *
 * This service implements SOLID principles to handle all transaction, payment,
 * and debt calculations in a consistent, auditable manner.
 *
 * Single Responsibility: Each method has one clear purpose
 * Open/Closed: Extensible for new calculation types without modification
 * Liskov Substitution: All methods follow consistent interfaces
 * Interface Segregation: Clean separation of concerns
 * Dependency Inversion: Depends on abstractions, not concrete implementations
 */

import { Transaction } from "@/types/transaction";
import { PaymentAudit } from "../database/service/PaymentService";

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
 * Core calculation service for transactions, payments, and debts
 */
export class TransactionCalculationService {
  /**
   * Calculate transaction status based on amounts and payment method
   */
  static calculateTransactionStatus(
    type: string,
    paymentMethod: string,
    totalAmount: number,
    paidAmount: number,
    remainingAmount: number,
    dueDate?: string
  ): TransactionStatus {
    const paid = Number(paidAmount || 0);
    const remaining = Number(remainingAmount || 0);
    const total = Number(totalAmount || 0);

    // Normalize amounts to handle floating point precision
    const normalizedPaid = Math.round(paid * 100) / 100;
    const normalizedRemaining = Math.round(remaining * 100) / 100;
    const normalizedTotal = Math.round(total * 100) / 100;

    const percentagePaid =
      total > 0 ? (normalizedPaid / normalizedTotal) * 100 : 0;

    let status: TransactionStatus["status"] = "pending";

    // Determine status based on type and payment state
    if (type === "payment") {
      status = "completed"; // Payments are always completed
    } else if (type === "credit") {
      if (normalizedRemaining <= 0) {
        status = "completed";
      } else if (normalizedPaid > 0) {
        status = "partial";
      } else {
        // Check if overdue
        if (dueDate && new Date(dueDate) < new Date()) {
          status = "overdue";
        } else {
          status = "pending";
        }
      }
    } else if (type === "sale") {
      if (paymentMethod === "credit") {
        // Sale on credit - treat like debt
        if (normalizedRemaining <= 0) {
          status = "completed";
        } else if (normalizedPaid > 0) {
          status = "partial";
        } else {
          if (dueDate && new Date(dueDate) < new Date()) {
            status = "overdue";
          } else {
            status = "pending";
          }
        }
      } else {
        // Cash/bank sale - should be completed
        status = "completed";
      }
    }

    return {
      status,
      paidAmount: normalizedPaid,
      remainingAmount: normalizedRemaining,
      percentagePaid: Math.round(percentagePaid * 100) / 100,
    };
  }

  /**
   * Calculate correct paid/remaining amounts for transaction creation
   */
  static calculateInitialAmounts(
    type: string,
    paymentMethod: string,
    amount: number,
    providedPaidAmount?: number,
    providedRemainingAmount?: number
  ): { paidAmount: number; remainingAmount: number; paymentMethod: string } {
    const totalAmount = Number(amount || 0);

    if (type === "credit") {
      // Credit always starts with 0 paid, full amount remaining
      return {
        paidAmount: 0,
        remainingAmount: totalAmount,
        paymentMethod: "credit",
      };
    }

    if (type === "payment") {
      // Payments are always fully paid immediately
      return {
        paidAmount: totalAmount,
        remainingAmount: 0,
        paymentMethod: paymentMethod || "cash",
      };
    }

    if (type === "sale") {
      if (paymentMethod === "credit") {
        // Sale on credit - starts as unpaid debt
        return {
          paidAmount: 0,
          remainingAmount: totalAmount,
          paymentMethod: "credit",
        };
      } else if (
        paymentMethod === "mixed" &&
        providedPaidAmount !== undefined
      ) {
        // Mixed payment - use provided amounts
        const paid = Number(providedPaidAmount || 0);
        const remaining = Math.max(0, totalAmount - paid);
        return {
          paidAmount: paid,
          remainingAmount: remaining,
          paymentMethod: "mixed",
        };
      } else {
        // Cash/bank sale - fully paid immediately
        return {
          paidAmount: totalAmount,
          remainingAmount: 0,
          paymentMethod: paymentMethod || "cash",
        };
      }
    }

    // Default fallback
    return {
      paidAmount: totalAmount,
      remainingAmount: 0,
      paymentMethod: paymentMethod || "cash",
    };
  }

  /**
   * Calculate debt impact of a transaction on customer balance
   */
  static calculateDebtImpact(
    transaction: Transaction,
    currentBalance: number
  ): DebtImpact {
    const { type, paymentMethod, remainingAmount, appliedToDebt, amount } =
      transaction;
    const before = Number(currentBalance || 0);
    let change = 0;

    if (type === "sale" && paymentMethod === "credit") {
      // Sale on credit increases debt
      change = Number(remainingAmount || amount || 0);
    } else if (type === "credit") {
      // Credit transaction increases debt
      change = Number(remainingAmount || amount || 0);
    } else if (type === "payment" && appliedToDebt) {
      // Payment applied to debt decreases debt
      change = -Number(amount || 0);
    }

    const after = Math.max(0, before + change);

    return {
      before,
      after,
      change: Math.abs(change),
      isIncrease: change > 0,
      isDecrease: change < 0,
      noChange: change === 0,
    };
  }

  /**
   * Verify transaction data consistency
   */
  static verifyTransactionConsistency(
    transaction: Transaction,
    auditHistory: PaymentAudit[] = []
  ): TransactionVerification {
    const issues: string[] = [];
    const recommendations: string[] = [];

    const totalAmount = Number(transaction.amount || 0);
    const storedPaid = Number(transaction.paidAmount || 0);
    const storedRemaining = Number(transaction.remainingAmount || 0);
    const storedTotal = storedPaid + storedRemaining;

    // Calculate from audit history
    const auditTotal = auditHistory
      .filter(
        (audit) =>
          audit.source_transaction_id === transaction.id &&
          [
            "payment_allocation",
            "credit_applied_to_sale",
            "partial_payment",
          ].includes(audit.type)
      )
      .reduce((sum, audit) => sum + Number(audit.amount || 0), 0);

    const computedPaid = Math.min(auditTotal || storedPaid, totalAmount);
    const computedRemaining = Math.max(0, totalAmount - computedPaid);
    const computedTotal = computedPaid + computedRemaining;

    // Check for inconsistencies
    const tolerance = 0.01; // Allow for floating point precision

    if (Math.abs(storedTotal - totalAmount) > tolerance) {
      issues.push(
        `Stored amounts (₦${storedTotal}) don't match total amount (₦${totalAmount})`
      );
      recommendations.push(
        "Recalculate paidAmount and remainingAmount based on total"
      );
    }

    if (Math.abs(computedTotal - totalAmount) > tolerance) {
      issues.push(
        `Computed amounts (₦${computedTotal}) don't match total amount (₦${totalAmount})`
      );
      recommendations.push("Review audit history for calculation errors");
    }

    if (auditTotal > 0 && Math.abs(auditTotal - storedPaid) > tolerance) {
      issues.push(
        `Audit total (₦${auditTotal}) doesn't match stored paid amount (₦${storedPaid})`
      );
      recommendations.push("Synchronize stored amounts with audit history");
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
   */
  static generatePaymentBreakdown(
    transaction: Transaction,
    auditHistory: PaymentAudit[] = []
  ): PaymentBreakdown {
    const totalAmount = Number(transaction.amount || 0);
    const storedPaid = Number(transaction.paidAmount || 0);

    // Convert audit history to payment history entries
    const paymentHistory: PaymentHistoryEntry[] = auditHistory
      .filter((audit) => audit.source_transaction_id === transaction.id)
      .map((audit) => ({
        id: audit.id,
        date: audit.created_at,
        amount: Number(audit.amount || 0),
        type: audit.type,
        source: audit.source_transaction_id || "",
        description: this.getAuditDescription(audit),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate audit total
    const auditTotal = paymentHistory
      .filter((entry) =>
        [
          "payment_allocation",
          "credit_applied_to_sale",
          "partial_payment",
        ].includes(entry.type)
      )
      .reduce((sum, entry) => sum + entry.amount, 0);

    // Use audit-based calculations if available, otherwise fall back to stored values
    const paidAmount =
      auditTotal > 0 ? Math.min(auditTotal, totalAmount) : storedPaid;
    const remainingAmount = Math.max(0, totalAmount - paidAmount);

    const verification = this.verifyTransactionConsistency(
      transaction,
      auditHistory
    );

    return {
      totalAmount,
      paidAmount,
      remainingAmount,
      auditTotal,
      verification,
      paymentHistory,
    };
  }

  /**
   * Get human-readable description for audit entry
   */
  private static getAuditDescription(audit: PaymentAudit): string {
    const amount = Number(audit.amount || 0);
    const metadata = audit.metadata
      ? typeof audit.metadata === "string"
        ? JSON.parse(audit.metadata)
        : audit.metadata
      : {};

    switch (audit.type) {
      case "payment_allocation":
        return `Payment allocation of ₦${amount.toLocaleString()}`;
      case "credit_applied_to_sale":
        return `Credit applied: ₦${amount.toLocaleString()}`;
      case "partial_payment":
        return `Partial payment: ₦${amount.toLocaleString()}`;
      case "over_payment":
        return `Overpayment: ₦${amount.toLocaleString()} (${
          metadata.reason || "excess amount"
        })`;
      case "credit_used":
        return `Credit used: ₦${amount.toLocaleString()}`;
      case "status_change":
        return `Status changed from ${metadata.oldStatus || "unknown"} to ${
          metadata.newStatus || "unknown"
        }`;
      default:
        return `${audit.type}: ₦${amount.toLocaleString()}`;
    }
  }

  /**
   * Calculate customer balance impact from transaction
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
    const { type, paymentMethod, amount, remainingAmount, appliedToDebt } =
      transaction;
    const txAmount = Number(amount || 0);
    const remaining = Number(remainingAmount || 0);

    let outstandingBalanceChange = 0;
    let creditBalanceChange = 0;
    let impactType:
      | "debt_increase"
      | "debt_decrease"
      | "credit_increase"
      | "credit_decrease"
      | "no_change" = "no_change";

    if (type === "sale" && paymentMethod === "credit") {
      // Sale on credit increases outstanding debt
      outstandingBalanceChange = remaining;
      impactType = "debt_increase";
    } else if (type === "credit") {
      // Credit transaction increases outstanding debt
      outstandingBalanceChange = remaining;
      impactType = "debt_increase";
    } else if (type === "payment") {
      if (appliedToDebt) {
        // Payment applied to debt reduces outstanding balance
        outstandingBalanceChange = -txAmount;
        impactType = "debt_decrease";
      } else {
        // Payment not applied to debt might create credit
        creditBalanceChange = txAmount;
        impactType = "credit_increase";
      }
    }

    const newOutstandingBalance = Math.max(
      0,
      currentOutstandingBalance + outstandingBalanceChange
    );
    const newCreditBalance = Math.max(
      0,
      currentCreditBalance + creditBalanceChange
    );

    return {
      outstandingBalanceChange,
      creditBalanceChange,
      newOutstandingBalance,
      newCreditBalance,
      impactType,
    };
  }
}
