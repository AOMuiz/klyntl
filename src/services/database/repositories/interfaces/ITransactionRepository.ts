import {
  CreateTransactionInput,
  Transaction,
  UpdateTransactionInput,
} from "@/types/transaction";
import { IBaseRepository, IPaginatedRepository } from "./IBaseRepository";

// ===== TRANSACTION REPOSITORY INTERFACE =====
// Defines the contract for transaction-specific operations

export interface ITransactionRepository
  extends IBaseRepository<Transaction>,
    IPaginatedRepository<Transaction> {
  // Transaction-specific query methods
  findByCustomerId(customerId: string): Promise<Transaction[]>;
  findByType(type: string): Promise<Transaction[]>;
  findByDateRange(startDate: string, endDate: string): Promise<Transaction[]>;
  findByAmountRange(
    minAmount: number,
    maxAmount: number
  ): Promise<Transaction[]>;

  // Customer-related transaction queries
  findByCustomerAndDateRange(
    customerId: string,
    startDate: string,
    endDate: string
  ): Promise<Transaction[]>;

  // Transaction analytics
  getTotalByCustomer(customerId: string): Promise<number>;
  getTotalByType(type: string): Promise<number>;
  getTotalByDateRange(startDate: string, endDate: string): Promise<number>;
  getAverageTransactionAmount(): Promise<number>;

  // Revenue calculations
  getRevenueByPeriod(startDate: string, endDate: string): Promise<number>;
  getRevenueByCustomer(customerId: string): Promise<number>;
  getRevenueByType(type: string): Promise<number>;

  // Transaction statistics
  getTransactionStats(): Promise<{
    totalTransactions: number;
    totalRevenue: number;
    averageAmount: number;
    salesCount: number;
    refundCount: number;
    paymentCount: number;
  }>;

  // Daily/Monthly aggregations
  getDailyTransactions(date: string): Promise<Transaction[]>;
  getMonthlyTransactions(year: number, month: number): Promise<Transaction[]>;
  getDailyRevenue(date: string): Promise<number>;
  getMonthlyRevenue(year: number, month: number): Promise<number>;

  // Bulk operations
  createBulk(transactions: CreateTransactionInput[]): Promise<Transaction[]>;
  updateBulk(
    updates: { id: string; data: UpdateTransactionInput }[]
  ): Promise<void>;
  deleteBulk(transactionIds: string[]): Promise<void>;

  // Advanced queries
  findLargeTransactions(threshold: number): Promise<Transaction[]>;
  findRecentTransactions(days: number): Promise<Transaction[]>;
  findTransactionsByDescription(description: string): Promise<Transaction[]>;

  // All transactions (for analytics)
  getAllTransactions(): Promise<Transaction[]>;
}
