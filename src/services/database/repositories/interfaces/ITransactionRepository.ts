// Enhanced ITransactionRepository
import {
  CreateTransactionInput,
  Transaction,
  UpdateTransactionInput,
} from "@/types/transaction";
import { IBaseRepository } from "./IBaseRepository";

export interface ITransactionRepository extends IBaseRepository<Transaction> {
  // Existing methods
  findByCustomerId(customerId: string): Promise<Transaction[]>;
  getCustomerTotal(customerId: string): Promise<number>;
  findByDateRange(startDate: string, endDate: string): Promise<Transaction[]>;
  findByType(type: Transaction["type"]): Promise<Transaction[]>;
  getRecentTransactions(limit?: number): Promise<Transaction[]>;

  // New validation methods
  validateCreate(data: CreateTransactionInput): Promise<void>;
  validateUpdate(id: string, data: UpdateTransactionInput): Promise<void>;
  createWithValidation(data: CreateTransactionInput): Promise<Transaction>;
  updateWithValidation(id: string, data: UpdateTransactionInput): Promise<void>;

  // Enhanced analytics methods
  getTransactionStats(
    customerId?: string,
    dateRange?: { start: string; end: string }
  ): Promise<{
    totalAmount: number;
    transactionCount: number;
    averageAmount: number;
    salesTotal: number;
    refundTotal: number;
  }>;

  // Business logic methods
  getCustomerTransactionHistory(
    customerId: string,
    limit?: number,
    offset?: number
  ): Promise<{
    transactions: Transaction[];
    total: number;
    hasMore: boolean;
  }>;

  // Revenue and reporting
  getDailyRevenue(
    days: number
  ): Promise<{ date: string; revenue: number; transactions: number }[]>;
  getMonthlyRevenue(
    months: number
  ): Promise<{ month: string; revenue: number; transactions: number }[]>;
  getTopCustomersByRevenue(
    limit?: number
  ): Promise<
    { customerId: string; customerName: string; totalRevenue: number }[]
  >;
}
