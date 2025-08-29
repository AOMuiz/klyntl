import { Transaction } from "@/types/transaction";
import { IBaseRepository } from "./IBaseRepository";

export interface ITransactionRepository extends IBaseRepository<Transaction> {
  findByCustomerId(customerId: string): Promise<Transaction[]>;
  getCustomerTotal(customerId: string): Promise<number>;
  findByDateRange(startDate: string, endDate: string): Promise<Transaction[]>;
  findByType(type: Transaction["type"]): Promise<Transaction[]>;
  getRecentTransactions(limit?: number): Promise<Transaction[]>;
}
