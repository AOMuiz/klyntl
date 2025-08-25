import { Customer } from "./customer";

export interface Analytics {
  totalCustomers: number;
  totalRevenue: number;
  totalTransactions: number;
  topCustomers: Customer[];
}
