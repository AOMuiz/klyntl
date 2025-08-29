import {
  CreateTransactionInput,
  Transaction,
  UpdateTransactionInput,
} from "@/types/transaction";
import { SQLiteDatabase } from "expo-sqlite";
import {
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "../../service/utilService";
import { ValidationService } from "../../service/ValidationService";
import { ITransactionRepository } from "../interfaces/ITransactionRepository";
import { BaseRepository } from "./BaseRepository";

export class TransactionRepository
  extends BaseRepository<Transaction>
  implements ITransactionRepository
{
  private validationService: ValidationService;

  constructor(db: SQLiteDatabase, config?: any) {
    super(db, "transactions", config);
    this.validationService = new ValidationService(db);
  }

  protected mapToEntity(record: any): Transaction {
    return {
      id: record.id,
      customerId: record.customerId,
      amount: record.amount,
      description: record.description || undefined,
      date: record.date,
      type: record.type,
    };
  }

  protected generateId(): string {
    return `txn_${crypto.randomUUID()}`;
  }

  protected async validateCreateData(
    entity: Omit<Transaction, "id">
  ): Promise<void> {
    await this.validationService.validateTransaction(
      entity as CreateTransactionInput
    );

    // Verify customer exists
    const customerExists = await this.db.getFirstAsync(
      "SELECT id FROM customers WHERE id = ? LIMIT 1",
      [entity.customerId]
    );

    if (!customerExists) {
      throw new ValidationError(
        `Customer with ID ${entity.customerId} does not exist`,
        "customerId"
      );
    }
  }

  protected async validateUpdateData(
    id: string,
    entity: Partial<Transaction>
  ): Promise<void> {
    await this.validationService.validateTransaction(
      entity as UpdateTransactionInput
    );
  }

  protected getCreateQuery(): string {
    return `
      INSERT INTO transactions (id, customerId, amount, description, date, type)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
  }

  protected getUpdateQuery(): string {
    return `
      UPDATE transactions SET
        customerId = ?, amount = ?, description = ?, date = ?, type = ?
      WHERE id = ?
    `;
  }

  protected getCreateParams(transaction: Omit<Transaction, "id">): any[] {
    const id = this.generateId();

    return [
      id,
      transaction.customerId,
      transaction.amount,
      transaction.description ?? null,
      transaction.date,
      transaction.type,
    ];
  }

  protected getUpdateParams(transaction: Partial<Transaction>): any[] {
    return [
      transaction.customerId,
      transaction.amount,
      transaction.description ?? null,
      transaction.date,
      transaction.type,
    ];
  }

  // Existing interface methods
  async findByCustomerId(customerId: string): Promise<Transaction[]> {
    if (!customerId?.trim()) {
      throw new ValidationError("Customer ID is required", "customerId");
    }

    try {
      const query =
        "SELECT * FROM transactions WHERE customerId = ? ORDER BY date DESC";
      const results = await this.db.getAllAsync(query, [customerId]);
      return results.map((record) => this.mapToEntity(record));
    } catch (error) {
      throw new DatabaseError("findByCustomerId", error as Error);
    }
  }

  async getCustomerTotal(customerId: string): Promise<number> {
    if (!customerId?.trim()) {
      throw new ValidationError("Customer ID is required", "customerId");
    }

    try {
      const result = await this.db.getFirstAsync<{ total: number }>(
        `SELECT COALESCE(SUM(
          CASE 
            WHEN type = 'sale' THEN amount 
            WHEN type = 'refund' THEN -amount
            ELSE 0 
          END
        ), 0) as total FROM transactions WHERE customerId = ?`,
        [customerId]
      );

      return result?.total || 0;
    } catch (error) {
      throw new DatabaseError("getCustomerTotal", error as Error);
    }
  }

  async findByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Transaction[]> {
    try {
      const query = `
        SELECT * FROM transactions 
        WHERE date >= ? AND date <= ? 
        ORDER BY date DESC
      `;

      const results = await this.db.getAllAsync(query, [startDate, endDate]);
      return results.map((record) => this.mapToEntity(record));
    } catch (error) {
      throw new DatabaseError("findByDateRange", error as Error);
    }
  }

  async findByType(type: Transaction["type"]): Promise<Transaction[]> {
    try {
      const query =
        "SELECT * FROM transactions WHERE type = ? ORDER BY date DESC";
      const results = await this.db.getAllAsync(query, [type]);
      return results.map((record) => this.mapToEntity(record));
    } catch (error) {
      throw new DatabaseError("findByType", error as Error);
    }
  }

  async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    try {
      const query = "SELECT * FROM transactions ORDER BY date DESC LIMIT ?";
      const results = await this.db.getAllAsync(query, [limit]);
      return results.map((record) => this.mapToEntity(record));
    } catch (error) {
      throw new DatabaseError("getRecentTransactions", error as Error);
    }
  }

  // New validation methods
  async validateCreate(data: CreateTransactionInput): Promise<void> {
    await this.validationService.validateTransaction(data);
  }

  async validateUpdate(
    id: string,
    data: UpdateTransactionInput
  ): Promise<void> {
    if (!(await this.exists(id))) {
      throw new NotFoundError("Transaction", id);
    }
    await this.validateUpdateData(id, data as Partial<Transaction>);
  }

  async createWithValidation(
    data: CreateTransactionInput
  ): Promise<Transaction> {
    await this.validateCreate(data);
    return this.create(data as Omit<Transaction, "id">);
  }

  async updateWithValidation(
    id: string,
    data: UpdateTransactionInput
  ): Promise<void> {
    await this.validateUpdate(id, data);
    return this.update(id, data as Partial<Transaction>);
  }

  // Enhanced analytics methods
  async getTransactionStats(
    customerId?: string,
    dateRange?: { start: string; end: string }
  ): Promise<{
    totalAmount: number;
    transactionCount: number;
    averageAmount: number;
    salesTotal: number;
    refundTotal: number;
  }> {
    try {
      let query = `
        SELECT 
          COUNT(*) as transactionCount,
          COALESCE(SUM(amount), 0) as totalAmount,
          COALESCE(SUM(CASE WHEN type = 'sale' THEN amount ELSE 0 END), 0) as salesTotal,
          COALESCE(SUM(CASE WHEN type = 'refund' THEN amount ELSE 0 END), 0) as refundTotal
        FROM transactions WHERE 1=1
      `;

      const params: any[] = [];

      if (customerId) {
        query += " AND customerId = ?";
        params.push(customerId);
      }

      if (dateRange) {
        query += " AND date >= ? AND date <= ?";
        params.push(dateRange.start, dateRange.end);
      }

      const result = await this.db.getFirstAsync<{
        transactionCount: number;
        totalAmount: number;
        salesTotal: number;
        refundTotal: number;
      }>(query, params);

      return {
        totalAmount: result?.totalAmount || 0,
        transactionCount: result?.transactionCount || 0,
        averageAmount: result?.transactionCount
          ? (result.totalAmount || 0) / result.transactionCount
          : 0,
        salesTotal: result?.salesTotal || 0,
        refundTotal: result?.refundTotal || 0,
      };
    } catch (error) {
      throw new DatabaseError("getTransactionStats", error as Error);
    }
  }

  async getCustomerTransactionHistory(
    customerId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    transactions: Transaction[];
    total: number;
    hasMore: boolean;
  }> {
    if (!customerId?.trim()) {
      throw new ValidationError("Customer ID is required", "customerId");
    }

    try {
      const [transactions, totalResult] = await Promise.all([
        this.db.getAllAsync(
          "SELECT * FROM transactions WHERE customerId = ? ORDER BY date DESC LIMIT ? OFFSET ?",
          [customerId, limit, offset]
        ),
        this.db.getFirstAsync<{ total: number }>(
          "SELECT COUNT(*) as total FROM transactions WHERE customerId = ?",
          [customerId]
        ),
      ]);

      const total = totalResult?.total || 0;

      return {
        transactions: transactions.map((record) => this.mapToEntity(record)),
        total,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      throw new DatabaseError("getCustomerTransactionHistory", error as Error);
    }
  }

  // Revenue and reporting
  async getDailyRevenue(
    days: number
  ): Promise<{ date: string; revenue: number; transactions: number }[]> {
    try {
      const startDate = new Date(
        Date.now() - days * 24 * 60 * 60 * 1000
      ).toISOString();

      const query = `
        SELECT 
          DATE(date) as date,
          COALESCE(SUM(CASE WHEN type = 'sale' THEN amount ELSE 0 END), 0) as revenue,
          COUNT(*) as transactions
        FROM transactions 
        WHERE date >= ? AND type = 'sale'
        GROUP BY DATE(date)
        ORDER BY date ASC
      `;

      const results = await this.db.getAllAsync<{
        date: string;
        revenue: number;
        transactions: number;
      }>(query, [startDate]);

      return results || [];
    } catch (error) {
      throw new DatabaseError("getDailyRevenue", error as Error);
    }
  }

  async getMonthlyRevenue(
    months: number
  ): Promise<{ month: string; revenue: number; transactions: number }[]> {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const query = `
        SELECT 
          strftime('%Y-%m', date) as month,
          COALESCE(SUM(CASE WHEN type = 'sale' THEN amount ELSE 0 END), 0) as revenue,
          COUNT(*) as transactions
        FROM transactions 
        WHERE date >= ? AND type = 'sale'
        GROUP BY strftime('%Y-%m', date)
        ORDER BY month ASC
      `;

      const results = await this.db.getAllAsync<{
        month: string;
        revenue: number;
        transactions: number;
      }>(query, [startDate.toISOString()]);

      return results || [];
    } catch (error) {
      throw new DatabaseError("getMonthlyRevenue", error as Error);
    }
  }

  async getTopCustomersByRevenue(limit: number = 10): Promise<
    {
      customerId: string;
      customerName: string;
      totalRevenue: number;
    }[]
  > {
    try {
      const query = `
        SELECT 
          t.customerId,
          c.name as customerName,
          COALESCE(SUM(CASE WHEN t.type = 'sale' THEN t.amount ELSE 0 END), 0) as totalRevenue
        FROM transactions t
        JOIN customers c ON t.customerId = c.id
        WHERE t.type = 'sale'
        GROUP BY t.customerId, c.name
        ORDER BY totalRevenue DESC
        LIMIT ?
      `;

      const results = await this.db.getAllAsync<{
        customerId: string;
        customerName: string;
        totalRevenue: number;
      }>(query, [limit]);

      return results || [];
    } catch (error) {
      throw new DatabaseError("getTopCustomersByRevenue", error as Error);
    }
  }
}
