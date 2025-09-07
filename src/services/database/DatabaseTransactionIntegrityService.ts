/**
 * Database-Level Transaction Integrity Service
 *
 * This service ensures that all transaction calculations at the database level
 * are consistent with the business rules defined in the app flow document.
 * It verifies that transaction types, payment methods, and debt calculations
 * are properly implemented and maintained.
 */

import {
  PaymentMethod,
  Transaction,
  TransactionType,
} from "@/types/transaction";
import { SQLiteDatabase } from "expo-sqlite";

export interface TransactionIntegrityReport {
  isValid: boolean;
  issues: TransactionIssue[];
  summary: {
    totalTransactions: number;
    inconsistentTransactions: number;
    debtCalculationErrors: number;
    paymentMethodMismatches: number;
    statusCalculationErrors: number;
  };
}

export interface TransactionIssue {
  transactionId: string;
  customerId: string;
  issueType:
    | "debt_calculation"
    | "payment_method"
    | "status_mismatch"
    | "amount_inconsistency";
  description: string;
  expected: any;
  actual: any;
  severity: "low" | "medium" | "high" | "critical";
}

export interface CustomerDebtSummary {
  customerId: string;
  calculatedDebt: number;
  storedDebt: number;
  discrepancy: number;
  transactionCount: number;
  lastUpdate: string;
}

/**
 * Service to verify transaction calculation integrity at the database level
 */
export class DatabaseTransactionIntegrityService {
  constructor(private db: SQLiteDatabase) {}

  /**
   * Comprehensive integrity check of all transactions and debt calculations
   */
  async performFullIntegrityCheck(): Promise<TransactionIntegrityReport> {
    const issues: TransactionIssue[] = [];

    // 1. Verify transaction type and payment method consistency
    const paymentMethodIssues = await this.validateTransactionPaymentMethods();
    issues.push(...paymentMethodIssues);

    // 2. Verify debt calculations match business rules
    const debtCalculationIssues = await this.validateDebtCalculations();
    issues.push(...debtCalculationIssues);

    // 3. Verify transaction status calculations
    const statusIssues = await this.validateTransactionStatuses();
    issues.push(...statusIssues);

    // 4. Verify customer balance consistency
    const balanceIssues = await this.validateCustomerBalances();
    issues.push(...balanceIssues);

    const totalTransactions = await this.getTotalTransactionCount();

    return {
      isValid:
        issues.filter((i) => i.severity === "critical" || i.severity === "high")
          .length === 0,
      issues,
      summary: {
        totalTransactions,
        inconsistentTransactions: new Set(issues.map((i) => i.transactionId))
          .size,
        debtCalculationErrors: issues.filter(
          (i) => i.issueType === "debt_calculation"
        ).length,
        paymentMethodMismatches: issues.filter(
          (i) => i.issueType === "payment_method"
        ).length,
        statusCalculationErrors: issues.filter(
          (i) => i.issueType === "status_mismatch"
        ).length,
      },
    };
  }

  /**
   * Validate that transaction types and payment methods follow business rules
   * Based on the document requirements:
   * - Sale + Cash/Bank/POS: paidAmount = amount, remainingAmount = 0
   * - Sale + Credit: paidAmount = 0, remainingAmount = amount
   * - Sale + Mixed: paidAmount = partial, remainingAmount = amount - partial
   * - Payment: paidAmount = amount, remainingAmount = 0
   * - Credit/Loan: paidAmount = 0, remainingAmount = amount
   */
  async validateTransactionPaymentMethods(): Promise<TransactionIssue[]> {
    const issues: TransactionIssue[] = [];

    const transactions = await this.db.getAllAsync<Transaction>(`
      SELECT id, customerId, type, paymentMethod, amount, paidAmount, remainingAmount, status
      FROM transactions 
      WHERE isDeleted = 0
    `);

    for (const tx of transactions) {
      const expectedAmounts = this.calculateExpectedAmounts(
        tx.type as TransactionType,
        tx.paymentMethod as PaymentMethod,
        tx.amount,
        tx.paidAmount || 0
      );

      // Check paidAmount consistency
      if (Math.abs((tx.paidAmount || 0) - expectedAmounts.paidAmount) > 0.01) {
        issues.push({
          transactionId: tx.id,
          customerId: tx.customerId,
          issueType: "amount_inconsistency",
          description: `Paid amount mismatch for ${tx.type} transaction with ${tx.paymentMethod} payment`,
          expected: expectedAmounts.paidAmount,
          actual: tx.paidAmount || 0,
          severity: "high",
        });
      }

      // Check remainingAmount consistency
      if (
        Math.abs((tx.remainingAmount || 0) - expectedAmounts.remainingAmount) >
        0.01
      ) {
        issues.push({
          transactionId: tx.id,
          customerId: tx.customerId,
          issueType: "amount_inconsistency",
          description: `Remaining amount mismatch for ${tx.type} transaction with ${tx.paymentMethod} payment`,
          expected: expectedAmounts.remainingAmount,
          actual: tx.remainingAmount || 0,
          severity: "high",
        });
      }

      // Check payment method validity for transaction type
      if (
        !this.isValidPaymentMethodForType(
          tx.type as TransactionType,
          tx.paymentMethod as PaymentMethod
        )
      ) {
        issues.push({
          transactionId: tx.id,
          customerId: tx.customerId,
          issueType: "payment_method",
          description: `Invalid payment method ${tx.paymentMethod} for transaction type ${tx.type}`,
          expected: this.getValidPaymentMethodsForType(
            tx.type as TransactionType
          ),
          actual: tx.paymentMethod,
          severity: "medium",
        });
      }
    }

    return issues;
  }

  /**
   * Validate debt calculations based on transaction history
   */
  async validateDebtCalculations(): Promise<TransactionIssue[]> {
    const issues: TransactionIssue[] = [];

    // Get all customers with transactions
    const customers = await this.db.getAllAsync<{
      customerId: string;
      outstandingBalance: number;
    }>(`
      SELECT DISTINCT t.customerId, c.outstandingBalance
      FROM transactions t
      LEFT JOIN customers c ON t.customerId = c.id
      WHERE t.isDeleted = 0
    `);

    for (const customer of customers) {
      const calculatedDebt = await this.calculateCustomerDebtFromTransactions(
        customer.customerId
      );
      const storedDebt = customer.outstandingBalance || 0;

      if (Math.abs(calculatedDebt - storedDebt) > 0.01) {
        issues.push({
          transactionId: "N/A",
          customerId: customer.customerId,
          issueType: "debt_calculation",
          description: `Customer debt calculation mismatch`,
          expected: calculatedDebt,
          actual: storedDebt,
          severity: "critical",
        });
      }
    }

    return issues;
  }

  /**
   * Validate transaction statuses are correctly calculated
   */
  async validateTransactionStatuses(): Promise<TransactionIssue[]> {
    const issues: TransactionIssue[] = [];

    const transactions = await this.db.getAllAsync<Transaction>(`
      SELECT id, customerId, type, paymentMethod, amount, paidAmount, remainingAmount, status
      FROM transactions 
      WHERE isDeleted = 0
    `);

    for (const tx of transactions) {
      const expectedStatus = this.calculateExpectedStatus(
        tx.type as TransactionType,
        tx.paymentMethod as PaymentMethod,
        tx.amount,
        tx.paidAmount || 0,
        tx.remainingAmount || 0
      );

      if (tx.status !== expectedStatus) {
        issues.push({
          transactionId: tx.id,
          customerId: tx.customerId,
          issueType: "status_mismatch",
          description: `Transaction status mismatch`,
          expected: expectedStatus,
          actual: tx.status,
          severity: "medium",
        });
      }
    }

    return issues;
  }

  /**
   * Validate customer balances are consistent with transaction history
   */
  async validateCustomerBalances(): Promise<TransactionIssue[]> {
    const issues: TransactionIssue[] = [];

    const customers = await this.db.getAllAsync<{
      id: string;
      outstandingBalance: number;
      creditBalance: number;
    }>(`SELECT id, outstandingBalance, creditBalance FROM customers`);

    for (const customer of customers) {
      const calculatedBalances =
        await this.calculateCustomerBalancesFromTransactions(customer.id);

      // Check outstanding balance
      if (
        Math.abs(
          (customer.outstandingBalance || 0) -
            calculatedBalances.outstandingBalance
        ) > 0.01
      ) {
        issues.push({
          transactionId: "N/A",
          customerId: customer.id,
          issueType: "debt_calculation",
          description: `Customer outstanding balance mismatch`,
          expected: calculatedBalances.outstandingBalance,
          actual: customer.outstandingBalance || 0,
          severity: "critical",
        });
      }

      // Check credit balance
      if (
        Math.abs(
          (customer.creditBalance || 0) - calculatedBalances.creditBalance
        ) > 0.01
      ) {
        issues.push({
          transactionId: "N/A",
          customerId: customer.id,
          issueType: "debt_calculation",
          description: `Customer credit balance mismatch`,
          expected: calculatedBalances.creditBalance,
          actual: customer.creditBalance || 0,
          severity: "high",
        });
      }
    }

    return issues;
  }

  /**
   * Calculate expected amounts based on transaction type and payment method
   * Following the business rules from the document
   */
  private calculateExpectedAmounts(
    type: TransactionType,
    paymentMethod: PaymentMethod,
    totalAmount: number,
    actualPaidAmount: number
  ): { paidAmount: number; remainingAmount: number } {
    switch (type) {
      case "sale":
        switch (paymentMethod) {
          case "cash":
          case "bank_transfer":
          case "pos_card":
            return { paidAmount: totalAmount, remainingAmount: 0 };
          case "credit":
            return { paidAmount: 0, remainingAmount: totalAmount };
          case "mixed":
            return {
              paidAmount: actualPaidAmount,
              remainingAmount: totalAmount - actualPaidAmount,
            };
          default:
            return { paidAmount: totalAmount, remainingAmount: 0 };
        }

      case "payment":
        return { paidAmount: totalAmount, remainingAmount: 0 };

      case "credit":
        return { paidAmount: 0, remainingAmount: totalAmount };

      case "refund":
        return { paidAmount: totalAmount, remainingAmount: 0 };

      default:
        return { paidAmount: totalAmount, remainingAmount: 0 };
    }
  }

  /**
   * Calculate expected transaction status
   */
  private calculateExpectedStatus(
    type: TransactionType,
    paymentMethod: PaymentMethod,
    totalAmount: number,
    paidAmount: number,
    remainingAmount: number
  ): string {
    if (type === "payment" || type === "refund") {
      return "completed";
    }

    if (paymentMethod === "credit" || remainingAmount > 0) {
      return paidAmount > 0 ? "partial" : "pending";
    }

    if (paidAmount >= totalAmount) {
      return "completed";
    }

    return "pending";
  }

  /**
   * Check if payment method is valid for transaction type
   */
  private isValidPaymentMethodForType(
    type: TransactionType,
    paymentMethod: PaymentMethod
  ): boolean {
    switch (type) {
      case "sale":
        return [
          "cash",
          "bank_transfer",
          "pos_card",
          "credit",
          "mixed",
        ].includes(paymentMethod);
      case "payment":
        return ["cash", "bank_transfer", "pos_card"].includes(paymentMethod);
      case "credit":
        return paymentMethod === "credit";
      case "refund":
        return ["cash", "bank_transfer", "pos_card"].includes(paymentMethod);
      default:
        return false;
    }
  }

  /**
   * Get valid payment methods for transaction type
   */
  private getValidPaymentMethodsForType(
    type: TransactionType
  ): PaymentMethod[] {
    switch (type) {
      case "sale":
        return ["cash", "bank_transfer", "pos_card", "credit", "mixed"];
      case "payment":
        return ["cash", "bank_transfer", "pos_card"];
      case "credit":
        return ["credit"];
      case "refund":
        return ["cash", "bank_transfer", "pos_card"];
      default:
        return [];
    }
  }

  /**
   * Calculate customer debt from transaction history
   */
  private async calculateCustomerDebtFromTransactions(
    customerId: string
  ): Promise<number> {
    const transactions = await this.db.getAllAsync<{
      type: string;
      remainingAmount: number;
      amount: number;
      paidAmount: number;
    }>(
      `
      SELECT type, remainingAmount, amount, paidAmount
      FROM transactions 
      WHERE customerId = ? AND isDeleted = 0
    `,
      [customerId]
    );

    let debt = 0;

    for (const tx of transactions) {
      if (tx.type === "sale" || tx.type === "credit") {
        // Sales and credits increase debt
        debt += tx.remainingAmount || 0;
      } else if (tx.type === "payment") {
        // Payments reduce debt (but this should be handled by updating remainingAmount on debts)
        // Payment transactions themselves don't contribute to debt
      } else if (tx.type === "refund") {
        // Refunds can reduce debt if applied to outstanding balance
        debt -= tx.amount || 0;
      }
    }

    return Math.max(0, debt);
  }

  /**
   * Calculate customer balances from transaction history
   */
  private async calculateCustomerBalancesFromTransactions(
    customerId: string
  ): Promise<{
    outstandingBalance: number;
    creditBalance: number;
  }> {
    const outstandingBalance = await this.calculateCustomerDebtFromTransactions(
      customerId
    );

    // Calculate credit balance from payment audit records
    const creditBalance = await this.db.getFirstAsync<{ total: number }>(
      `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payment_audit 
      WHERE customer_id = ? AND type IN ('over_payment', 'credit_note')
    `,
      [customerId]
    );

    return {
      outstandingBalance,
      creditBalance: creditBalance?.total || 0,
    };
  }

  /**
   * Get total transaction count
   */
  private async getTotalTransactionCount(): Promise<number> {
    const result = await this.db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(*) as count FROM transactions WHERE isDeleted = 0
    `);
    return result?.count || 0;
  }

  /**
   * Generate a detailed customer debt summary
   */
  async generateCustomerDebtSummary(
    customerId: string
  ): Promise<CustomerDebtSummary> {
    const calculatedDebt = await this.calculateCustomerDebtFromTransactions(
      customerId
    );

    const customer = await this.db.getFirstAsync<{
      outstandingBalance: number;
    }>(
      `
      SELECT outstandingBalance FROM customers WHERE id = ?
    `,
      [customerId]
    );

    const transactionCount = await this.db.getFirstAsync<{ count: number }>(
      `
      SELECT COUNT(*) as count FROM transactions WHERE customerId = ? AND isDeleted = 0
    `,
      [customerId]
    );

    const lastUpdate = await this.db.getFirstAsync<{ lastUpdate: string }>(
      `
      SELECT MAX(date) as lastUpdate FROM transactions WHERE customerId = ? AND isDeleted = 0
    `,
      [customerId]
    );

    const storedDebt = customer?.outstandingBalance || 0;

    return {
      customerId,
      calculatedDebt,
      storedDebt,
      discrepancy: Math.abs(calculatedDebt - storedDebt),
      transactionCount: transactionCount?.count || 0,
      lastUpdate: lastUpdate?.lastUpdate || "",
    };
  }

  /**
   * Fix inconsistent debt calculations
   */
  async repairCustomerDebtCalculations(): Promise<{
    customersFixed: number;
    totalDiscrepancyResolved: number;
  }> {
    const customers = await this.db.getAllAsync<{ id: string }>(`
      SELECT DISTINCT customerId as id FROM transactions WHERE isDeleted = 0
    `);

    let customersFixed = 0;
    let totalDiscrepancyResolved = 0;

    await this.db.withTransactionAsync(async () => {
      for (const customer of customers) {
        const summary = await this.generateCustomerDebtSummary(customer.id);

        if (summary.discrepancy > 0.01) {
          await this.db.runAsync(
            `
            UPDATE customers 
            SET outstandingBalance = ? 
            WHERE id = ?
          `,
            [summary.calculatedDebt, customer.id]
          );

          customersFixed++;
          totalDiscrepancyResolved += summary.discrepancy;
        }
      }
    });

    return { customersFixed, totalDiscrepancyResolved };
  }
}
