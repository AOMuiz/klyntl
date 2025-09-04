import {
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
} from "@/types/customer";
import { CustomerFilters, SortOptions } from "@/types/filters";
import {
  IBaseRepository,
  IFilteredRepository,
  IPaginatedRepository,
  ISortableRepository,
} from "./IBaseRepository";

// ===== CUSTOMER REPOSITORY INTERFACE =====
// Defines the contract for customer-specific operations
// Extends base repository with customer-specific methods

export interface ICustomerRepository
  extends IBaseRepository<Customer>,
    IFilteredRepository<Customer, CustomerFilters>,
    IPaginatedRepository<Customer>,
    ISortableRepository<Customer, SortOptions> {
  // Customer-specific query methods
  findByPhone(phone: string): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  findByCompany(company: string): Promise<Customer[]>;

  // Advanced customer queries
  findActiveCustomers(days?: number): Promise<Customer[]>;
  findInactiveCustomers(days?: number): Promise<Customer[]>;
  getTopCustomers(limit?: number): Promise<Customer[]>;
  findBusinessCustomers(): Promise<Customer[]>;
  findIndividualCustomers(): Promise<Customer[]>;

  // Customer relationship operations
  updateTotals(customerIds: string[]): Promise<void>;
  recalculateCustomerStats(customerId: string): Promise<void>;

  // Bulk operations
  createBulk(customers: CreateCustomerInput[]): Promise<Customer[]>;
  updateBulk(
    updates: { id: string; data: UpdateCustomerInput }[]
  ): Promise<void>;
  deleteBulk(customerIds: string[]): Promise<void>;

  // Customer analytics
  getCustomerStats(): Promise<{
    total: number;
    recentlyAdded: number;
    withTransactions: number;
    totalCustomers: number;
    activeCustomers: number;
    businessCustomers: number;
    individualCustomers: number;
    averageSpending: number;
  }>;

  // Search and filtering
  findWithFilters(
    filters?: CustomerFilters,
    searchQuery?: string,
    page?: number,
    pageSize?: number,
    sort?: SortOptions
  ): Promise<Customer[]>;
  search(query: string): Promise<Customer[]>;
  findByContactSource(source: string): Promise<Customer[]>;
  findByPreferredContactMethod(method: string): Promise<Customer[]>;
}
