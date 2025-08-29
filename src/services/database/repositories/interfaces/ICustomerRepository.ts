import { Customer } from "@/types/customer";
import { CustomerFilters, SortOptions } from "@/types/filters";
import { IBaseRepository } from "./IBaseRepository";

export interface ICustomerRepository extends IBaseRepository<Customer> {
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
}
