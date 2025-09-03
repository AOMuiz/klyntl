import { CustomerFilters, SortOptions } from "@/types/filters";
import { ProductFilters } from "@/types/product";
import { DatabaseConfig } from "../types";

// ===== QUERY BUILDER SERVICE =====
export class QueryBuilderService {
  constructor(private config: DatabaseConfig) {}

  buildCustomerFilterQuery(filters: CustomerFilters): {
    whereClause: string;
    params: any[];
  } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.customerType && filters.customerType !== "all") {
      if (filters.customerType === "business") {
        conditions.push("company IS NOT NULL AND company != ''");
      } else {
        conditions.push("(company IS NULL OR company = '')");
      }
    }

    if (filters.spendingRange) {
      if (filters.spendingRange.min > 0) {
        conditions.push("totalSpent >= ?");
        params.push(filters.spendingRange.min);
      }
      if (filters.spendingRange.max < Number.MAX_SAFE_INTEGER) {
        conditions.push("totalSpent <= ?");
        params.push(filters.spendingRange.max);
      }
    }

    if (filters.dateRange) {
      conditions.push("createdAt >= ? AND createdAt <= ?");
      params.push(filters.dateRange.startDate, filters.dateRange.endDate);
    }

    if (filters.hasTransactions !== undefined) {
      if (filters.hasTransactions) {
        conditions.push(
          "EXISTS (SELECT 1 FROM transactions WHERE customerId = customers.id)"
        );
      } else {
        conditions.push(
          "NOT EXISTS (SELECT 1 FROM transactions WHERE customerId = customers.id)"
        );
      }
    }

    if (filters.isActive !== undefined) {
      const activeDays = this.config.customerActiveDays;
      const cutoffDate = new Date(
        Date.now() - activeDays * 24 * 60 * 60 * 1000
      ).toISOString();

      if (filters.isActive) {
        conditions.push("lastPurchase >= ?");
        params.push(cutoffDate);
      } else {
        conditions.push("(lastPurchase IS NULL OR lastPurchase < ?)");
        params.push(cutoffDate);
      }
    }

    if (filters.contactSource && filters.contactSource !== "all") {
      conditions.push("contactSource = ?");
      params.push(filters.contactSource);
    }

    if (
      filters.preferredContactMethod &&
      filters.preferredContactMethod !== "all"
    ) {
      conditions.push("preferredContactMethod = ?");
      params.push(filters.preferredContactMethod);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    return { whereClause, params };
  }

  buildProductFilterQuery(filters?: ProductFilters): {
    sql: string;
    params: any[];
  } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters) {
      if (filters.category) {
        conditions.push("category = ?");
        params.push(filters.category);
      }

      if (filters.priceRange) {
        const { min, max } = filters.priceRange;
        // Normalize inverted ranges (handle min > max by swapping)
        if (Number.isFinite(min) && Number.isFinite(max) && min > max) {
          // Swap min and max
          conditions.push("price >= ?");
          params.push(max);
          conditions.push("price <= ?");
          params.push(min);
        } else {
          if (Number.isFinite(min)) {
            conditions.push("price >= ?");
            params.push(min);
          }
          if (Number.isFinite(max)) {
            conditions.push("price <= ?");
            params.push(max);
          }
        }
      }

      if (filters.stockStatus && filters.stockStatus !== "all") {
        switch (filters.stockStatus) {
          case "in_stock":
            conditions.push("stockQuantity > lowStockThreshold");
            break;
          case "low_stock":
            conditions.push(
              "stockQuantity > 0 AND stockQuantity <= lowStockThreshold"
            );
            break;
          case "out_of_stock":
            conditions.push("stockQuantity = 0");
            break;
        }
      }

      // Active status filter
      if (filters.isActive !== undefined) {
        conditions.push("isActive = ?");
        params.push(filters.isActive ? 1 : 0);
      }

      if (filters.searchQuery?.trim()) {
        conditions.push(
          "(name LIKE ? COLLATE NOCASE OR description LIKE ? COLLATE NOCASE OR sku LIKE ? COLLATE NOCASE)"
        );
        const searchPattern = `%${filters.searchQuery.trim()}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }
    }

    return {
      sql: conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "",
      params,
    };
  }

  buildSortClause(
    sort?: SortOptions,
    validFields: string[] = ["name"]
  ): string {
    if (!sort) return `ORDER BY ${validFields[0]} ASC`;

    if (!validFields.includes(sort.field)) {
      console.warn(
        `Invalid sort field: ${sort.field}, defaulting to ${validFields[0]}`
      );
      return `ORDER BY ${validFields[0]} ASC`;
    }

    const direction = sort.direction.toUpperCase() === "DESC" ? "DESC" : "ASC";
    return `ORDER BY ${sort.field} ${direction}`;
  }
}
