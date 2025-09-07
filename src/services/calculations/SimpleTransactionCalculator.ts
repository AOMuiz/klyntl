/**
 * Simplified Transaction Calculator for Nigerian SMEs
 *
 * Contains only the essential calculation methods needed for core business operations.
 * No complex verification, reconciliation, or enterprise-level features.
 */

export interface SimpleTransactionStatus {
  status: "pending" | "partial" | "completed";
  paidAmount: number;
  remainingAmount: number;
  percentagePaid: number;
}

export interface SimpleDebtImpact {
  change: number;
  isIncrease: boolean;
  isDecrease: boolean;
}

/**
 * Simple calculation service for Nigerian SME transactions
 */
export class SimpleTransactionCalculator {
  /**
   * Calculate transaction status - simplified to 3 states only
   */
  static calculateStatus(
    type: string,
    totalAmount: number,
    paidAmount: number,
    remainingAmount: number
  ): SimpleTransactionStatus {
    const paid = Number(paidAmount || 0);
    const remaining = Number(remainingAmount || 0);
    const total = Number(totalAmount || 0);

    // Normalize to handle kobo precision
    const normalizedPaid = Math.round(paid);
    const normalizedRemaining = Math.round(remaining);
    const normalizedTotal = Math.round(total);

    const percentagePaid =
      total > 0 ? (normalizedPaid / normalizedTotal) * 100 : 0;

    let status: SimpleTransactionStatus["status"] = "pending";

    // Simple status logic
    if (type === "payment" || type === "refund") {
      status = "completed"; // Payments/refunds are always completed
    } else if (normalizedRemaining <= 0) {
      status = "completed"; // Fully paid
    } else if (normalizedPaid > 0) {
      status = "partial"; // Partially paid
    } else {
      status = "pending"; // Not paid yet
    }

    return {
      status,
      paidAmount: normalizedPaid,
      remainingAmount: normalizedRemaining,
      percentagePaid: Math.round(percentagePaid * 100) / 100,
    };
  }

  /**
   * Calculate initial amounts for transaction creation
   */
  static calculateInitialAmounts(
    type: string,
    paymentMethod: string,
    amount: number,
    providedPaidAmount?: number
  ): { paidAmount: number; remainingAmount: number; paymentMethod: string } {
    const totalAmount = Number(amount || 0);

    if (type === "credit") {
      // Credit always starts unpaid
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
        // Sale on credit - starts unpaid
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
        // Cash/bank/POS - fully paid immediately
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
   * Calculate debt impact - simplified
   */
  static calculateDebtImpact(
    type: string,
    paymentMethod: string,
    amount: number,
    appliedToDebt?: boolean
  ): SimpleDebtImpact {
    let change = 0;

    if (type === "sale" && paymentMethod === "credit") {
      // Sale on credit increases debt
      change = Number(amount || 0);
    } else if (type === "sale" && paymentMethod === "mixed") {
      // Mixed payment - only remaining amount increases debt
      // This will be calculated by the caller based on paidAmount
      change = 0; // Will be set by caller
    } else if (type === "credit") {
      // Credit transaction increases debt
      change = Number(amount || 0);
    } else if (type === "payment" && appliedToDebt) {
      // Payment applied to debt decreases debt
      change = -Number(amount || 0);
    } else if (type === "refund") {
      // Refund reduces debt
      change = -Number(amount || 0);
    }

    return {
      change: Math.abs(change),
      isIncrease: change > 0,
      isDecrease: change < 0,
    };
  }

  /**
   * Calculate customer balance impact - simplified
   */
  static calculateCustomerBalanceImpact(
    type: string,
    paymentMethod: string,
    amount: number,
    remainingAmount: number,
    appliedToDebt?: boolean
  ): {
    debtChange: number;
    creditChange: number;
  } {
    const txAmount = Number(amount || 0);
    const remaining = Number(remainingAmount || 0);

    let debtChange = 0;
    let creditChange = 0;

    if (
      type === "sale" &&
      (paymentMethod === "credit" || paymentMethod === "mixed")
    ) {
      // Sale on credit or mixed payment increases debt by remaining amount
      debtChange = remaining;
    } else if (type === "credit") {
      // Credit transaction increases debt
      debtChange = txAmount;
    } else if (type === "payment") {
      if (appliedToDebt) {
        // Payment applied to debt reduces debt
        debtChange = -txAmount;
      } else {
        // Payment for future service creates credit
        creditChange = txAmount;
      }
    } else if (type === "refund") {
      // Refund reduces debt or increases credit
      debtChange = -txAmount;
    }

    return {
      debtChange,
      creditChange,
    };
  }

  /**
   * Handle overpayment scenario
   */
  static handleOverpayment(
    paymentAmount: number,
    currentDebt: number
  ): {
    debtCleared: number;
    creditCreated: number;
  } {
    if (paymentAmount > currentDebt) {
      return {
        debtCleared: currentDebt,
        creditCreated: paymentAmount - currentDebt,
      };
    }

    return {
      debtCleared: paymentAmount,
      creditCreated: 0,
    };
  }

  /**
   * Validate mixed payment amounts
   */
  static validateMixedPayment(
    totalAmount: number,
    cashAmount: number,
    creditAmount: number = 0
  ): { isValid: boolean; error?: string } {
    const total = Number(totalAmount || 0);
    const cash = Number(cashAmount || 0);
    const credit = Number(creditAmount || 0);

    if (cash < 0 || credit < 0) {
      return { isValid: false, error: "Payment amounts cannot be negative" };
    }

    if (Math.abs(cash + credit - total) > 0.01) {
      return {
        isValid: false,
        error: "Payment amounts must equal total amount",
      };
    }

    if (cash >= total) {
      return {
        isValid: false,
        error: "For mixed payments, cash amount must be less than total",
      };
    }

    return { isValid: true };
  }

  /**
   * Convert Naira to Kobo for precision
   */
  static toKobo(nairaAmount: number): number {
    return Math.round(nairaAmount * 100);
  }

  /**
   * Convert Kobo to Naira for display
   */
  static toNaira(koboAmount: number): number {
    return Math.round(koboAmount) / 100;
  }
}
