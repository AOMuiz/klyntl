// Enhanced ICustomerRepository
import {
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
} from "@/types/customer";
import { CustomerFilters, SortOptions } from "@/types/filters";
import { IBaseRepository } from "./IBaseRepository";

export interface ICustomerRepository extends IBaseRepository<Customer> {
  // Existing methods
  findByPhone(phone: string): Promise<Customer | null>;
  findWithFilters(
    searchQuery?: string,
    filters?: CustomerFilters,
    sort?: SortOptions,
    page?: number,
    pageSize?: number
  ): Promise<Customer[]>;
  getCount(searchQuery?: string, filters?: CustomerFilters): Promise<number>;
  updateTotals(customerIds: string[]): Promise<void>;

  // New methods needed for proper validation and business logic
  validateCreate(data: CreateCustomerInput): Promise<void>;
  validateUpdate(id: string, data: UpdateCustomerInput): Promise<void>;
  createWithValidation(data: CreateCustomerInput): Promise<Customer>;
  updateWithValidation(id: string, data: UpdateCustomerInput): Promise<void>;

  // Enhanced query methods
  findActiveCustomers(activeDays?: number): Promise<Customer[]>;
  findInactiveCustomers(activeDays?: number): Promise<Customer[]>;
  findByCompany(company: string): Promise<Customer[]>;
  searchCustomers(searchQuery: string, limit?: number): Promise<Customer[]>;

  // Business logic methods
  markAsContacted(id: string, contactDate?: Date | string): Promise<void>;
  getCustomerStats(id: string): Promise<{
    totalTransactions: number;
    totalSpent: number;
    averageTransaction: number;
    firstPurchase?: string;
    lastPurchase?: string;
  }>;
}
