import { CreateCustomerInput, UpdateCustomerInput } from "@/types/customer";
import { CreateProductInput, UpdateProductInput } from "@/types/product";
import {
  CreateTransactionInput,
  UpdateTransactionInput,
} from "@/types/transaction";

// New IValidationService for centralized validation
export interface IValidationService {
  validateCustomer(
    data: CreateCustomerInput | UpdateCustomerInput
  ): Promise<void>;
  validateProduct(data: CreateProductInput | UpdateProductInput): Promise<void>;
  validateTransaction(
    data: CreateTransactionInput | UpdateTransactionInput
  ): Promise<void>;
  validateStoreConfig(data: any): Promise<void>;
}
