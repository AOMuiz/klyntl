import { SQLiteDatabase } from "expo-sqlite";
import { CustomerRepository } from "./implementations/CustomerRepository";
import { ProductRepository } from "./implementations/ProductRepository";
import { StoreConfigRepository } from "./implementations/StoreConfigRepository";
import { TransactionRepository } from "./implementations/TransactionRepository";
import { ICustomerRepository } from "./interfaces/ICustomerRepository";
import { IProductRepository } from "./interfaces/IProductRepository";
import { IStoreConfigRepository } from "./interfaces/IStoreConfigRepository";
import { ITransactionRepository } from "./interfaces/ITransactionRepository";

export class RepositoryFactory {
  private static customerRepository: ICustomerRepository | null = null;
  private static productRepository: IProductRepository | null = null;
  private static transactionRepository: ITransactionRepository | null = null;
  private static storeConfigRepository: IStoreConfigRepository | null = null;

  static getCustomerRepository(db: SQLiteDatabase): ICustomerRepository {
    if (!this.customerRepository) {
      this.customerRepository = new CustomerRepository(db);
    }
    return this.customerRepository;
  }

  static getProductRepository(db: SQLiteDatabase): IProductRepository {
    if (!this.productRepository) {
      this.productRepository = new ProductRepository(db);
    }
    return this.productRepository;
  }

  static getTransactionRepository(db: SQLiteDatabase): ITransactionRepository {
    if (!this.transactionRepository) {
      this.transactionRepository = new TransactionRepository(db);
    }
    return this.transactionRepository;
  }

  static getStoreConfigRepository(db: SQLiteDatabase): IStoreConfigRepository {
    if (!this.storeConfigRepository) {
      this.storeConfigRepository = new StoreConfigRepository(db);
    }
    return this.storeConfigRepository;
  }
}
