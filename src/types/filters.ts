export interface CustomerFilters {
  customerType?: "individual" | "business" | "all";
  spendingRange?: {
    min: number;
    max: number;
  };
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  hasTransactions?: boolean;
  isActive?: boolean;
  contactSource?: "manual" | "imported" | "updated" | "all";
  preferredContactMethod?: "phone" | "email" | "sms" | "all";
}

export interface SortOptions {
  field:
    | "name"
    | "totalSpent"
    | "createdAt"
    | "lastPurchase"
    | "lastContactDate";
  direction: "asc" | "desc";
}

export interface CustomerSearchFilters {
  query?: string;
  filters?: CustomerFilters;
  sort?: SortOptions;
}

// Helper type for building SQL WHERE clauses
export interface FilterQueryParts {
  whereClause: string;
  params: any[];
}

// Predefined filter presets for common use cases
export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filters: CustomerFilters;
  sort?: SortOptions;
}

// Common filter presets
export const CUSTOMER_FILTER_PRESETS: FilterPreset[] = [
  {
    id: "high_value",
    name: "High Value Customers",
    description: "Customers who have spent ₦50,000 or more",
    filters: {
      spendingRange: { min: 50000, max: Number.MAX_SAFE_INTEGER },
      hasTransactions: true,
    },
    sort: { field: "totalSpent", direction: "desc" },
  },
  {
    id: "recent_customers",
    name: "Recent Customers",
    description: "Customers added in the last 30 days",
    filters: {
      dateRange: {
        startDate: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        endDate: new Date().toISOString(),
      },
    },
    sort: { field: "createdAt", direction: "desc" },
  },
  {
    id: "business_customers",
    name: "Business Customers",
    description: "Customers with company information",
    filters: {
      customerType: "business",
    },
    sort: { field: "totalSpent", direction: "desc" },
  },
  {
    id: "inactive_customers",
    name: "Inactive Customers",
    description: "Customers with no purchases in the last 60 days",
    filters: {
      hasTransactions: true,
      isActive: false,
    },
    sort: { field: "lastPurchase", direction: "asc" },
  },
  {
    id: "imported_contacts",
    name: "Imported Contacts",
    description: "Customers imported from device contacts",
    filters: {
      contactSource: "imported",
    },
    sort: { field: "createdAt", direction: "desc" },
  },
];

// Helper function to get a filter preset by ID
export const getFilterPreset = (id: string): FilterPreset | undefined => {
  return CUSTOMER_FILTER_PRESETS.find((preset) => preset.id === id);
};

// Helper function to check if filters are empty
export const areFiltersEmpty = (filters: CustomerFilters): boolean => {
  return (
    Object.keys(filters).length === 0 ||
    Object.values(filters).every(
      (value) =>
        value === undefined ||
        value === "all" ||
        (typeof value === "object" && Object.keys(value).length === 0)
    )
  );
};

// Helper function to build human-readable filter description
export const getFilterDescription = (filters: CustomerFilters): string => {
  const descriptions: string[] = [];

  if (filters.customerType && filters.customerType !== "all") {
    descriptions.push(`${filters.customerType} customers`);
  }

  if (filters.spendingRange) {
    const { min, max } = filters.spendingRange;
    if (min > 0 && max < Number.MAX_SAFE_INTEGER) {
      descriptions.push(
        `spent ₦${min.toLocaleString()} - ₦${max.toLocaleString()}`
      );
    } else if (min > 0) {
      descriptions.push(`spent ₦${min.toLocaleString()}+`);
    } else if (max < Number.MAX_SAFE_INTEGER) {
      descriptions.push(`spent up to ₦${max.toLocaleString()}`);
    }
  }

  if (filters.dateRange) {
    const startDate = new Date(
      filters.dateRange.startDate
    ).toLocaleDateString();
    const endDate = new Date(filters.dateRange.endDate).toLocaleDateString();
    descriptions.push(`added ${startDate} - ${endDate}`);
  }

  if (filters.hasTransactions !== undefined) {
    descriptions.push(
      filters.hasTransactions ? "with purchases" : "without purchases"
    );
  }

  if (filters.isActive !== undefined) {
    descriptions.push(
      filters.isActive ? "active customers" : "inactive customers"
    );
  }

  if (filters.contactSource && filters.contactSource !== "all") {
    descriptions.push(`${filters.contactSource} contacts`);
  }

  if (
    filters.preferredContactMethod &&
    filters.preferredContactMethod !== "all"
  ) {
    descriptions.push(`prefers ${filters.preferredContactMethod}`);
  }

  return descriptions.length > 0 ? descriptions.join(", ") : "All customers";
};
