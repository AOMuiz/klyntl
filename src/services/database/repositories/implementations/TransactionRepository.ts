import { Transaction } from "@/types/transaction";
// import * as Crypto from "expo-crypto";
import { SQLiteDatabase } from "expo-sqlite";
import { DatabaseError } from "../../service";
import { ITransactionRepository } from "../interfaces/ITransactionRepository";
import { BaseRepository } from "./BaseRepository";

export class TransactionRepository
  extends BaseRepository<Transaction>
  implements ITransactionRepository
{
  constructor(db: SQLiteDatabase) {
    super(db, "transactions");
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

  protected getCreateQuery(): string {
    return `
      INSERT INTO transactions (
        id, customerId, amount, description, date, type
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
  }

  protected getUpdateQuery(): string {
    return `
      UPDATE transactions SET
        amount = ?, description = ?, date = ?, type = ?
      WHERE id = ?
    `;
  }

  protected getCreateParams(transaction: Omit<Transaction, "id">): any[] {
    const id = crypto.randomUUID();
    return [
      id,
      transaction.customerId,
      transaction.amount,
      transaction.description || null,
      transaction.date,
      transaction.type,
    ];
  }

  protected getUpdateParams(transaction: Partial<Transaction>): any[] {
    return [
      transaction.amount,
      transaction.description || null,
      transaction.date,
      transaction.type,
    ];
  }

  async findByCustomerId(customerId: string): Promise<Transaction[]> {
    try {
      const query =
        "SELECT * FROM transactions WHERE customerId = ? ORDER BY date DESC";
      const results = await this.db.getAllAsync(query, [customerId]);
      return results.map((record) => this.mapToEntity(record));
    } catch (error) {
      throw new DatabaseError(
        "findByCustomerId",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async getCustomerTotal(customerId: string): Promise<number> {
    try {
      const query = `
        SELECT COALESCE(SUM(
          CASE 
            WHEN type = 'sale' THEN amount 
            WHEN type = 'refund' THEN -amount
            ELSE 0 
          END
        ), 0) as total 
        FROM transactions 
        WHERE customerId = ?
      `;
      const result = await this.db.getFirstAsync<{ total: number }>(query, [
        customerId,
      ]);
      return result?.total || 0;
    } catch (error) {
      throw new DatabaseError(
        "getCustomerTotal",
        error instanceof Error ? error : new Error(String(error))
      );
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
      throw new DatabaseError(
        "findByDateRange",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async findByType(type: Transaction["type"]): Promise<Transaction[]> {
    try {
      const query =
        "SELECT * FROM transactions WHERE type = ? ORDER BY date DESC";
      const results = await this.db.getAllAsync(query, [type]);
      return results.map((record) => this.mapToEntity(record));
    } catch (error) {
      throw new DatabaseError(
        "findByType",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    try {
      const query = `
        SELECT * FROM transactions 
        ORDER BY date DESC 
        LIMIT ?
      `;
      const results = await this.db.getAllAsync(query, [limit]);
      return results.map((record) => this.mapToEntity(record));
    } catch (error) {
      throw new DatabaseError(
        "getRecentTransactions",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
