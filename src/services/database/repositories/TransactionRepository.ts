import {
  CreateTransactionInput,
  Transaction,
  UpdateTransactionInput,
} from "@/types/transaction";
import { generateId } from "@/utils/helpers";
import { SQLiteDatabase } from "expo-sqlite";
import { AuditLogService } from "../service/AuditLogService";
import {
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "../service/utilService";
import { ValidationService } from "../service/ValidationService";
import { CustomerRepository } from "./CustomerRepository";

// ===== TRANSACTION REPOSITORY =====
export class TransactionRepository {
  constructor(
    private db: SQLiteDatabase,
    private auditService: AuditLogService,
    private customerRepo: CustomerRepository
  ) {}

  async create(transactionData: CreateTransactionInput): Promise<Transaction> {
    ValidationService.validateTransactionInput(transactionData);

    try {
      const customer = await this.customerRepo.findById(
        transactionData.customerId
      );
      if (!customer) {
        throw new NotFoundError("Customer", transactionData.customerId);
      }

      const id = generateId("txn");
      const transaction: Transaction = {
        id,
        customerId: transactionData.customerId,
        productId: transactionData.productId,
        amount: transactionData.amount,
        description: transactionData.description || undefined,
        date: transactionData.date,
        type: transactionData.type,
      };

      await this.db.withTransactionAsync(async () => {
        await this.db.runAsync(
          `INSERT INTO transactions (id, customerId, productId, amount, description, date, type) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            transaction.id,
            transaction.customerId,
            transaction.productId || null,
            transaction.amount,
            transaction.description || null,
            transaction.date,
            transaction.type,
          ]
        );

        await this.customerRepo.updateTotals([transaction.customerId]);

        await this.auditService.logEntry({
          tableName: "transactions",
          operation: "CREATE",
          recordId: transaction.id,
          newValues: transaction,
        });
      });

      return transaction;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("create", error as Error);
    }
  }

  async findByCustomer(customerId: string): Promise<Transaction[]> {
    if (!customerId?.trim()) {
      throw new ValidationError("Customer ID is required");
    }

    try {
      return await this.db.getAllAsync<Transaction>(
        "SELECT * FROM transactions WHERE customerId = ? ORDER BY date DESC",
        [customerId]
      );
    } catch (error) {
      throw new DatabaseError("findByCustomer", error as Error);
    }
  }

  async findById(id: string): Promise<Transaction | null> {
    if (!id?.trim()) {
      throw new ValidationError("Transaction ID is required");
    }

    try {
      return await this.db.getFirstAsync<Transaction>(
        "SELECT * FROM transactions WHERE id = ?",
        [id]
      );
    } catch (error) {
      throw new DatabaseError("findById", error as Error);
    }
  }

  async update(id: string, updates: UpdateTransactionInput): Promise<void> {
    if (!id?.trim()) {
      throw new ValidationError("Transaction ID is required");
    }

    ValidationService.validateTransactionInput(updates);

    try {
      const currentTransaction = await this.findById(id);
      if (!currentTransaction) {
        throw new NotFoundError("Transaction", id);
      }

      await this.db.withTransactionAsync(async () => {
        const fields = Object.keys(updates).filter((key) => key !== "id");
        const setClause = fields.map((field) => `${field} = ?`).join(", ");
        const values = fields.map((field) => {
          const value = (updates as any)[field];
          return field === "date" && value
            ? new Date(value).toISOString()
            : value;
        });

        await this.db.runAsync(
          `UPDATE transactions SET ${setClause} WHERE id = ?`,
          [...values, id]
        );
        await this.customerRepo.updateTotals([currentTransaction.customerId]);

        await this.auditService.logEntry({
          tableName: "transactions",
          operation: "UPDATE",
          recordId: id,
          oldValues: currentTransaction,
          newValues: { ...currentTransaction, ...updates },
        });
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("update", error as Error);
    }
  }

  async delete(id: string): Promise<void> {
    if (!id?.trim()) {
      throw new ValidationError("Transaction ID is required");
    }

    try {
      const transaction = await this.findById(id);
      if (!transaction) {
        throw new NotFoundError("Transaction", id);
      }

      await this.db.withTransactionAsync(async () => {
        await this.db.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
        await this.customerRepo.updateTotals([transaction.customerId]);

        await this.auditService.logEntry({
          tableName: "transactions",
          operation: "DELETE",
          recordId: id,
          oldValues: transaction,
        });
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("delete", error as Error);
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      return await this.db.getAllAsync<Transaction>(
        "SELECT * FROM transactions ORDER BY date DESC"
      );
    } catch (error) {
      throw new DatabaseError("getAllTransactions", error as Error);
    }
  }
}
