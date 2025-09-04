import { CreateCustomerInput, Customer } from "../../types/customer";
import { CustomerFilters, SortOptions } from "../../types/filters";
import { CustomerRepository } from "../database/repositories/CustomerRepository";
import { DatabaseConfig } from "../database/types";

// Mock SQLite database
const mockDb = {
  runAsync: jest.fn(),
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  withTransactionAsync: jest.fn(),
  closeAsync: jest.fn(),
};

// Mock services
const mockAuditService = {
  logEntry: jest.fn(),
};

const mockQueryBuilder = {
  buildCustomerFilterQuery: jest.fn(),
};

describe("CustomerRepository", () => {
  let repository: CustomerRepository;
  let config: DatabaseConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    config = {
      customerActiveDays: 60,
      defaultLowStockThreshold: 5,
      defaultPageSize: 20,
      enableAuditLog: false,
      maxBatchSize: 100,
    };

    repository = new CustomerRepository(
      mockDb as any,
      config,
      mockAuditService as any,
      mockQueryBuilder as any
    );
  });

  describe("createCustomer", () => {
    const customerInput: CreateCustomerInput = {
      name: "John Doe",
      phone: "+2348012345678",
      email: "john@example.com",
      address: "123 Lagos Street",
      company: "Tech Corp",
      contactSource: "manual",
      preferredContactMethod: "email",
      birthday: "1990-01-01",
    };

    it("should create a customer successfully", async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

      const result = await repository.createCustomer(customerInput);

      expect(result).toMatchObject({
        name: customerInput.name,
        phone: customerInput.phone,
        email: customerInput.email,
        address: customerInput.address,
        company: customerInput.company,
        contactSource: customerInput.contactSource,
        preferredContactMethod: customerInput.preferredContactMethod,
        birthday: new Date(customerInput.birthday).toISOString(),
        totalSpent: 0,
      });
      expect(result.id).toMatch(/^customer_\d+_[a-z0-9]+$/);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(mockDb.runAsync).toHaveBeenCalled();
      expect(mockAuditService.logEntry).toHaveBeenCalledWith({
        tableName: "customers",
        operation: "CREATE",
        recordId: result.id,
        newValues: result,
      });
    });

    it("should handle creation errors", async () => {
      mockDb.runAsync.mockRejectedValue(new Error("Database error"));

      await expect(repository.createCustomer(customerInput)).rejects.toThrow(
        "Failed to create Customer"
      );
    });

    it("should set default values for optional fields", async () => {
      const minimalInput: CreateCustomerInput = {
        name: "Jane Doe",
        phone: "+2348012345679",
      };

      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

      const result = await repository.createCustomer(minimalInput);

      expect(result.contactSource).toBe("manual");
      expect(result.totalSpent).toBe(0);
      expect(result.birthday).toBeUndefined();
    });
  });

  describe("findById", () => {
    it("should find customer by ID", async () => {
      const mockCustomer: Customer = {
        id: "cust_123",
        name: "John Doe",
        phone: "+2348012345678",
        email: "john@example.com",
        totalSpent: 50000,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockDb.getFirstAsync.mockResolvedValue(mockCustomer);

      const result = await repository.findById("cust_123");

      expect(result).toEqual(mockCustomer);
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        "SELECT * FROM customers WHERE id = ?",
        ["cust_123"]
      );
    });

    it("should return null for non-existent customer", async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await repository.findById("nonexistent");

      expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
      mockDb.getFirstAsync.mockRejectedValue(new Error("Database error"));

      await expect(repository.findById("cust_123")).rejects.toThrow(
        "Failed to find Customer by ID"
      );
    });
  });

  describe("findByPhone", () => {
    it("should find customer by phone", async () => {
      const mockCustomer: Customer = {
        id: "cust_123",
        name: "John Doe",
        phone: "+2348012345678",
        totalSpent: 0,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockDb.getFirstAsync.mockResolvedValue(mockCustomer);

      const result = await repository.findByPhone("+2348012345678");

      expect(result).toEqual(mockCustomer);
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        "SELECT * FROM customers WHERE phone = ?",
        ["+2348012345678"]
      );
    });

    it("should return null for non-existent phone", async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await repository.findByPhone("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("findByEmail", () => {
    it("should find customer by email", async () => {
      const mockCustomer: Customer = {
        id: "cust_123",
        name: "John Doe",
        phone: "+2348012345678",
        email: "john@example.com",
        totalSpent: 0,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockDb.getFirstAsync.mockResolvedValue(mockCustomer);

      const result = await repository.findByEmail("john@example.com");

      expect(result).toEqual(mockCustomer);
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        "SELECT * FROM customers WHERE email = ?",
        ["john@example.com"]
      );
    });

    it("should return null for non-existent email", async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await repository.findByEmail("nonexistent@example.com");

      expect(result).toBeNull();
    });
  });

  describe("findAll", () => {
    const mockCustomers: Customer[] = [
      {
        id: "cust_1",
        name: "Alice Johnson",
        phone: "+2348012345678",
        totalSpent: 0,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "cust_2",
        name: "Bob Wilson",
        phone: "+2348012345679",
        totalSpent: 0,
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      },
    ];

    it("should return all customers without search query", async () => {
      mockDb.getAllAsync.mockResolvedValue(mockCustomers);

      const result = await repository.findAll();

      expect(result).toEqual(mockCustomers);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        "SELECT * FROM customers ORDER BY name ASC",
        []
      );
    });

    it("should filter customers by search query", async () => {
      const searchResults = [mockCustomers[0]];
      mockDb.getAllAsync.mockResolvedValue(searchResults);

      const result = await repository.findAll("Alice");

      expect(result).toEqual(searchResults);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        "SELECT * FROM customers WHERE (name LIKE ? OR phone LIKE ? OR email LIKE ? OR company LIKE ?) ORDER BY name ASC",
        ["%Alice%", "%Alice%", "%Alice%", "%Alice%"]
      );
    });

    it("should handle empty search query", async () => {
      mockDb.getAllAsync.mockResolvedValue(mockCustomers);

      const result = await repository.findAll("");

      expect(result).toEqual(mockCustomers);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        "SELECT * FROM customers ORDER BY name ASC",
        []
      );
    });
  });

  describe("findWithFilters", () => {
    const mockCustomers: Customer[] = [
      {
        id: "cust_1",
        name: "Alice Johnson",
        phone: "+2348012345678",
        company: "Tech Corp",
        totalSpent: 100000,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "cust_2",
        name: "Bob Wilson",
        phone: "+2348012345679",
        totalSpent: 50000,
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      },
    ];

    beforeEach(() => {
      mockQueryBuilder.buildCustomerFilterQuery.mockReturnValue({
        whereClause: 'WHERE company IS NOT NULL AND company != ""',
        params: [],
      });
    });

    it("should filter customers with filters", async () => {
      const filters: CustomerFilters = { customerType: "business" };
      mockDb.getAllAsync.mockResolvedValue([mockCustomers[0]]);

      const result = await repository.findWithFilters(filters);

      expect(result).toEqual([mockCustomers[0]]);
      expect(mockQueryBuilder.buildCustomerFilterQuery).toHaveBeenCalledWith(
        filters
      );
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM customers WHERE company IS NOT NULL AND company != "" ORDER BY name ASC',
        []
      );
    });

    it("should handle search query with filters", async () => {
      const filters: CustomerFilters = { customerType: "business" };
      mockDb.getAllAsync.mockResolvedValue([mockCustomers[0]]);

      const result = await repository.findWithFilters(filters, "Alice");

      expect(result).toEqual([mockCustomers[0]]);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM customers WHERE company IS NOT NULL AND company != "" ORDER BY name ASC',
        []
      );
    });

    it("should handle pagination", async () => {
      const filters: CustomerFilters = { customerType: "business" };
      mockDb.getAllAsync.mockResolvedValue([mockCustomers[0]]);

      const result = await repository.findWithFilters(
        filters,
        undefined,
        1,
        10
      );

      expect(result).toEqual([mockCustomers[0]]);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM customers WHERE company IS NOT NULL AND company != "" ORDER BY name ASC LIMIT ? OFFSET ?',
        [10, 10]
      );
    });

    it("should handle sorting", async () => {
      const filters: CustomerFilters = { customerType: "business" };
      const sort: SortOptions = { field: "totalSpent", direction: "desc" };
      mockDb.getAllAsync.mockResolvedValue([
        mockCustomers[0],
        mockCustomers[1],
      ]);

      const result = await repository.findWithFilters(
        filters,
        undefined,
        undefined,
        undefined,
        sort
      );

      expect(result).toEqual([mockCustomers[0], mockCustomers[1]]);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM customers WHERE company IS NOT NULL AND company != "" ORDER BY totalSpent DESC',
        []
      );
    });

    it("should handle empty filters", async () => {
      mockQueryBuilder.buildCustomerFilterQuery.mockReturnValue({
        whereClause: "",
        params: [],
      });
      mockDb.getAllAsync.mockResolvedValue(mockCustomers);

      const result = await repository.findWithFilters({});

      expect(result).toEqual(mockCustomers);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        "SELECT * FROM customers ORDER BY name ASC",
        []
      );
    });

    it("should handle database errors", async () => {
      mockDb.getAllAsync.mockRejectedValue(new Error("Database error"));

      await expect(repository.findWithFilters({})).rejects.toThrow(
        "Failed to find customers with filters"
      );
    });
  });

  describe("findWithSort", () => {
    const mockCustomers: Customer[] = [
      {
        id: "cust_1",
        name: "Alice Johnson",
        phone: "+2348012345678",
        totalSpent: 100000,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "cust_2",
        name: "Bob Wilson",
        phone: "+2348012345679",
        totalSpent: 50000,
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      },
    ];

    it("should sort customers by specified field and direction", async () => {
      const sort: SortOptions = { field: "totalSpent", direction: "desc" };
      mockDb.getAllAsync.mockResolvedValue([
        mockCustomers[0],
        mockCustomers[1],
      ]);

      const result = await repository.findWithSort(sort);

      expect(result).toEqual([mockCustomers[0], mockCustomers[1]]);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        "SELECT * FROM customers ORDER BY totalSpent DESC",
        []
      );
    });

    it("should handle search query with sorting", async () => {
      const sort: SortOptions = { field: "name", direction: "asc" };
      mockDb.getAllAsync.mockResolvedValue([
        mockCustomers[0],
        mockCustomers[1],
      ]);

      const result = await repository.findWithSort(sort, "Alice");

      expect(result).toEqual([mockCustomers[0], mockCustomers[1]]);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM customers WHERE"),
        expect.arrayContaining(["%Alice%", "%Alice%", "%Alice%", "%Alice%"])
      );
    });

    it("should handle pagination with sorting", async () => {
      const sort: SortOptions = { field: "createdAt", direction: "desc" };
      mockDb.getAllAsync.mockResolvedValue([mockCustomers[1]]);

      const result = await repository.findWithSort(sort, undefined, 0, 1);

      expect(result).toEqual([mockCustomers[1]]);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        "SELECT * FROM customers ORDER BY createdAt DESC LIMIT ? OFFSET ?",
        [1, 0]
      );
    });

    it("should use default sorting when no sort specified", async () => {
      mockDb.getAllAsync.mockResolvedValue(mockCustomers);

      const result = await repository.findWithSort();

      expect(result).toEqual(mockCustomers);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        "SELECT * FROM customers ORDER BY name ASC",
        []
      );
    });
  });

  describe("countWithFilters", () => {
    beforeEach(() => {
      mockQueryBuilder.buildCustomerFilterQuery.mockReturnValue({
        whereClause: "WHERE totalSpent >= ?",
        params: [50000],
      });
    });

    it("should count customers with filters", async () => {
      const filters: CustomerFilters = {
        spendingRange: { min: 50000, max: Number.MAX_SAFE_INTEGER },
      };
      mockDb.getFirstAsync.mockResolvedValue({ count: 5 });

      const result = await repository.countWithFilters(filters);

      expect(result).toBe(5);
      expect(mockQueryBuilder.buildCustomerFilterQuery).toHaveBeenCalledWith(
        filters
      );
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        "SELECT COUNT(*) as count FROM customers WHERE totalSpent >= ?",
        [50000]
      );
    });

    it("should handle search query with filters", async () => {
      const filters: CustomerFilters = {
        spendingRange: { min: 50000, max: Number.MAX_SAFE_INTEGER },
      };
      mockDb.getFirstAsync.mockResolvedValue({ count: 3 });

      const result = await repository.countWithFilters(filters, "John");

      expect(result).toBe(3);
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        "SELECT COUNT(*) as count FROM customers WHERE totalSpent >= ? AND (name LIKE ? OR phone LIKE ? OR email LIKE ? OR company LIKE ?)",
        [50000, "%John%", "%John%", "%John%", "%John%"]
      );
    });

    it("should handle empty filters", async () => {
      mockQueryBuilder.buildCustomerFilterQuery.mockReturnValue({
        whereClause: "",
        params: [],
      });
      mockDb.getFirstAsync.mockResolvedValue({ count: 10 });

      const result = await repository.countWithFilters({});

      expect(result).toBe(10);
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        "SELECT COUNT(*) as count FROM customers",
        []
      );
    });

    it("should return 0 when no results", async () => {
      mockDb.getFirstAsync.mockResolvedValue({ count: 0 });

      const result = await repository.countWithFilters({});

      expect(result).toBe(0);
    });

    it("should handle database errors", async () => {
      mockDb.getFirstAsync.mockRejectedValue(new Error("Database error"));

      await expect(repository.countWithFilters({})).rejects.toThrow(
        "Failed to count customers with filters"
      );
    });
  });

  describe("searchCustomers", () => {
    const mockCustomers: Customer[] = [
      {
        id: "cust_1",
        name: "Alice Johnson",
        phone: "+2348012345678",
        email: "alice@example.com",
        company: "Tech Corp",
        totalSpent: 0,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];

    it("should search customers by query", async () => {
      mockDb.getAllAsync.mockResolvedValue(mockCustomers);

      const result = await repository.searchCustomers("Alice");

      expect(result).toEqual(mockCustomers);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM customers"),
        expect.arrayContaining([
          "%Alice%",
          "%Alice%",
          "%Alice%",
          "%Alice%",
          "Alice",
          "Alice",
          "Alice",
          "Alice%",
          "Alice%",
          "Alice%",
          50,
        ])
      );
    });

    it("should handle empty query", async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      const result = await repository.searchCustomers("");

      expect(result).toEqual([]);
    });

    it("should respect limit parameter", async () => {
      mockDb.getAllAsync.mockResolvedValue(mockCustomers);

      const result = await repository.searchCustomers("Alice", 10);

      expect(result).toEqual(mockCustomers);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("LIMIT ?"),
        expect.arrayContaining([10])
      );
    });

    it("should handle database errors", async () => {
      mockDb.getAllAsync.mockRejectedValue(new Error("Database error"));

      await expect(repository.searchCustomers("test")).rejects.toThrow(
        "Failed to search customers"
      );
    });
  });

  describe("update", () => {
    const updateData = {
      name: "Updated Name",
      email: "updated@example.com",
    };

    it("should update customer successfully", async () => {
      const existingCustomer = {
        id: "cust_123",
        name: "Old Name",
        email: "old@example.com",
        totalSpent: 0,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockDb.getFirstAsync.mockResolvedValue(existingCustomer);
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 0 });

      await repository.update("cust_123", updateData);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        "UPDATE customers SET name = ?, email = ?, updatedAt = ? WHERE id = ?",
        ["Updated Name", "updated@example.com", expect.any(String), "cust_123"]
      );
      expect(mockAuditService.logEntry).toHaveBeenCalled();
    });

    it("should handle non-existent customer", async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      await expect(
        repository.update("nonexistent", updateData)
      ).rejects.toThrow("Customer with ID 'nonexistent' not found");
    });

    it("should handle database errors", async () => {
      mockDb.getFirstAsync.mockResolvedValue({
        id: "cust_123",
        name: "Test",
        totalSpent: 0,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      });
      mockDb.runAsync.mockRejectedValue(new Error("Database error"));

      await expect(repository.update("cust_123", updateData)).rejects.toThrow(
        "Failed to update Customer"
      );
    });
  });

  describe("delete", () => {
    it("should delete customer successfully", async () => {
      const existingCustomer = {
        id: "cust_123",
        name: "Test Customer",
        totalSpent: 0,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockDb.getFirstAsync.mockResolvedValue(existingCustomer);
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 0 });

      await repository.delete("cust_123");

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        "DELETE FROM customers WHERE id = ?",
        ["cust_123"]
      );
      expect(mockAuditService.logEntry).toHaveBeenCalledWith({
        tableName: "customers",
        operation: "DELETE",
        recordId: "cust_123",
        oldValues: existingCustomer,
      });
    });

    it("should handle non-existent customer", async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      await expect(repository.delete("nonexistent")).rejects.toThrow(
        "Customer with ID 'nonexistent' not found"
      );
    });
  });

  describe("findRecentCustomers", () => {
    const mockCustomers: Customer[] = [
      {
        id: "cust_1",
        name: "Recent Customer",
        phone: "+2348012345678",
        totalSpent: 0,
        lastContactDate: "2024-01-15T00:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];

    it("should find recent customers", async () => {
      mockDb.getAllAsync.mockResolvedValue(mockCustomers);

      const result = await repository.findRecentCustomers(5);

      expect(result).toEqual(mockCustomers);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        "SELECT * FROM customers ORDER BY lastContactDate DESC, createdAt DESC LIMIT ?",
        [5]
      );
    });

    it("should use default limit of 10", async () => {
      mockDb.getAllAsync.mockResolvedValue(mockCustomers);

      const result = await repository.findRecentCustomers();

      expect(result).toEqual(mockCustomers);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        "SELECT * FROM customers ORDER BY lastContactDate DESC, createdAt DESC LIMIT ?",
        [10]
      );
    });
  });

  describe("getCustomerStats", () => {
    it("should return customer statistics", async () => {
      mockDb.getFirstAsync
        .mockResolvedValueOnce({ count: 100 }) // total
        .mockResolvedValueOnce({ count: 10 }) // recentlyAdded
        .mockResolvedValueOnce({ count: 25 }) // withTransactions
        .mockResolvedValueOnce({ count: 30 }) // businessCustomers
        .mockResolvedValueOnce({ count: 40 }) // activeCustomers
        .mockResolvedValueOnce({ avg: 75000 }); // averageSpending

      const result = await repository.getCustomerStats();

      expect(result).toEqual({
        total: 100,
        recentlyAdded: 10,
        withTransactions: 25,
        totalCustomers: 100,
        activeCustomers: 40,
        businessCustomers: 30,
        individualCustomers: 70,
        averageSpending: 75000,
      });
    });

    it("should handle database errors", async () => {
      mockDb.getFirstAsync.mockRejectedValue(new Error("Database error"));

      await expect(repository.getCustomerStats()).rejects.toThrow(
        "Failed to get customer stats"
      );
    });
  });

  describe("findBusinessCustomers", () => {
    const mockBusinessCustomers: Customer[] = [
      {
        id: "cust_1",
        name: "Tech Corp",
        phone: "+2348012345678",
        company: "Technology Solutions",
        totalSpent: 0,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];

    it("should find business customers", async () => {
      mockDb.getAllAsync.mockResolvedValue(mockBusinessCustomers);

      const result = await repository.findBusinessCustomers();

      expect(result).toEqual(mockBusinessCustomers);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM customers WHERE company IS NOT NULL AND company != "" ORDER BY company ASC, name ASC'
      );
    });
  });

  describe("findIndividualCustomers", () => {
    const mockIndividualCustomers: Customer[] = [
      {
        id: "cust_1",
        name: "John Doe",
        phone: "+2348012345678",
        totalSpent: 0,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];

    it("should find individual customers", async () => {
      mockDb.getAllAsync.mockResolvedValue(mockIndividualCustomers);

      const result = await repository.findIndividualCustomers();

      expect(result).toEqual(mockIndividualCustomers);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM customers WHERE company IS NULL OR company = "" ORDER BY name ASC'
      );
    });
  });

  describe("findActiveCustomers", () => {
    const mockActiveCustomers: Customer[] = [
      {
        id: "cust_1",
        name: "Active Customer",
        phone: "+2348012345678",
        lastContactDate: new Date().toISOString(),
        totalSpent: 0,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];

    it("should find active customers", async () => {
      mockDb.getAllAsync.mockResolvedValue(mockActiveCustomers);

      const result = await repository.findActiveCustomers(30);

      expect(result).toEqual(mockActiveCustomers);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM customers WHERE lastContactDate >= date("now", "-" || ? || " days") ORDER BY lastContactDate DESC',
        [30]
      );
    });

    it("should use default days of 90", async () => {
      mockDb.getAllAsync.mockResolvedValue(mockActiveCustomers);

      const result = await repository.findActiveCustomers();

      expect(result).toEqual(mockActiveCustomers);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM customers WHERE lastContactDate >= date("now", "-" || ? || " days") ORDER BY lastContactDate DESC',
        [90]
      );
    });
  });

  describe("findInactiveCustomers", () => {
    const mockInactiveCustomers: Customer[] = [
      {
        id: "cust_1",
        name: "Inactive Customer",
        phone: "+2348012345678",
        totalSpent: 0,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];

    it("should find inactive customers", async () => {
      mockDb.getAllAsync.mockResolvedValue(mockInactiveCustomers);

      const result = await repository.findInactiveCustomers(30);

      expect(result).toEqual(mockInactiveCustomers);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM customers WHERE lastContactDate < date("now", "-" || ? || " days") OR lastContactDate IS NULL ORDER BY lastContactDate ASC',
        [30]
      );
    });
  });

  describe("getTopCustomers", () => {
    const mockTopCustomers: Customer[] = [
      {
        id: "cust_1",
        name: "Top Customer",
        phone: "+2348012345678",
        totalSpent: 100000,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];

    it("should get top customers by spending", async () => {
      mockDb.getAllAsync.mockResolvedValue(mockTopCustomers);

      const result = await repository.getTopCustomers(5);

      expect(result).toEqual(mockTopCustomers);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        "SELECT * FROM customers ORDER BY totalSpent DESC LIMIT ?",
        [5]
      );
    });

    it("should use default limit of 10", async () => {
      mockDb.getAllAsync.mockResolvedValue(mockTopCustomers);

      const result = await repository.getTopCustomers();

      expect(result).toEqual(mockTopCustomers);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        "SELECT * FROM customers ORDER BY totalSpent DESC LIMIT ?",
        [10]
      );
    });
  });

  describe("updateTotals", () => {
    it("should update customer totals", async () => {
      const customerId = "cust_123";

      // Mock transaction stats
      mockDb.getFirstAsync.mockResolvedValue({
        total: 50000,
        lastPurchase: "2024-01-15T00:00:00Z",
      });

      await repository.updateTotals([customerId]);

      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining("SUM(amount) as total"),
        [customerId]
      );
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE customers SET"),
        expect.arrayContaining([50000, "2024-01-15T00:00:00Z"])
      );
    });

    it("should handle customers with no transactions", async () => {
      const customerId = "cust_123";
      mockDb.getFirstAsync.mockResolvedValue({
        total: null,
        lastPurchase: null,
      });

      await repository.updateTotals([customerId]);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE customers SET"),
        expect.arrayContaining([0, expect.any(String)]) // Allow any timestamp string
      );
    });
  });

  describe("findByCompany", () => {
    const mockCompanyCustomers: Customer[] = [
      {
        id: "cust_1",
        name: "Employee 1",
        phone: "+2348012345678",
        company: "Tech Corp",
        totalSpent: 0,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];

    it("should find customers by company", async () => {
      mockDb.getAllAsync.mockResolvedValue(mockCompanyCustomers);

      const result = await repository.findByCompany("Tech Corp");

      expect(result).toEqual(mockCompanyCustomers);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        "SELECT * FROM customers WHERE company = ? ORDER BY name ASC",
        ["Tech Corp"]
      );
    });
  });

  describe("findByContactSource", () => {
    const mockSourceCustomers: Customer[] = [
      {
        id: "cust_1",
        name: "Imported Customer",
        phone: "+2348012345678",
        contactSource: "imported",
        totalSpent: 0,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];

    it("should find customers by contact source", async () => {
      mockDb.getAllAsync.mockResolvedValue(mockSourceCustomers);

      const result = await repository.findByContactSource("imported");

      expect(result).toEqual(mockSourceCustomers);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        "SELECT * FROM customers WHERE contactSource = ? ORDER BY name ASC",
        ["imported"]
      );
    });
  });

  describe("findByPreferredContactMethod", () => {
    const mockMethodCustomers: Customer[] = [
      {
        id: "cust_1",
        name: "Email Customer",
        phone: "+2348012345678",
        preferredContactMethod: "email",
        totalSpent: 0,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];

    it("should find customers by preferred contact method", async () => {
      mockDb.getAllAsync.mockResolvedValue(mockMethodCustomers);

      const result = await repository.findByPreferredContactMethod("email");

      expect(result).toEqual(mockMethodCustomers);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        "SELECT * FROM customers WHERE preferredContactMethod = ? ORDER BY name ASC",
        ["email"]
      );
    });
  });

  describe("getBirthdays", () => {
    const mockBirthdayCustomers: Customer[] = [
      {
        id: "cust_1",
        name: "Birthday Person",
        phone: "+2348012345678",
        birthday: "1990-01-01T00:00:00.000Z",
        totalSpent: 0,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];

    it("should find customers with upcoming birthdays", async () => {
      mockDb.getAllAsync.mockResolvedValue(mockBirthdayCustomers);

      const result = await repository.getBirthdays(30);

      expect(result).toEqual(mockBirthdayCustomers);
    });

    it("should use default days of 30", async () => {
      mockDb.getAllAsync.mockResolvedValue(mockBirthdayCustomers);

      const result = await repository.getBirthdays();

      expect(result).toEqual(mockBirthdayCustomers);
    });
  });

  describe("bulk operations", () => {
    const customerInputs: CreateCustomerInput[] = [
      {
        name: "Bulk Customer 1",
        phone: "+2349056789012",
        email: "bulk1@example.com",
      },
      {
        name: "Bulk Customer 2",
        phone: "+2349067890123",
        email: "bulk2@example.com",
      },
    ];

    describe("createBulk", () => {
      it("should create multiple customers", async () => {
        // Mock findByPhone and findByEmail to return null (no duplicates)
        repository.findByPhone = jest.fn().mockResolvedValue(null);
        repository.findByEmail = jest.fn().mockResolvedValue(null);

        mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

        const result = await repository.createBulk(customerInputs);

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe("Bulk Customer 1");
        expect(result[1].name).toBe("Bulk Customer 2");
      });

      it("should handle errors in bulk creation", async () => {
        mockDb.runAsync.mockRejectedValue(new Error("Database error"));

        await expect(repository.createBulk(customerInputs)).rejects.toThrow(
          "Failed to create customers in bulk"
        );
      });
    });

    describe("updateBulk", () => {
      it("should update multiple customers", async () => {
        mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 0 });

        const updates = [
          { id: "cust_1", data: { name: "Updated 1" } },
          { id: "cust_2", data: { name: "Updated 2" } },
        ];

        await repository.updateBulk(updates);

        expect(mockDb.runAsync).toHaveBeenCalledTimes(2);
      });
    });

    describe("deleteBulk", () => {
      it("should delete multiple customers", async () => {
        mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 0 });

        await repository.deleteBulk(["cust_1", "cust_2"]);

        expect(mockDb.runAsync).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("error handling", () => {
    it("should handle validation errors in createCustomer", async () => {
      const invalidInput: CreateCustomerInput = {
        name: "", // Invalid empty name
        phone: "invalid-phone",
      };

      await expect(repository.createCustomer(invalidInput)).rejects.toThrow();
    });

    it("should handle validation errors in update", async () => {
      const existingCustomer = {
        id: "cust_123",
        name: "Test",
        phone: "+2348012345678",
        totalSpent: 0,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockDb.getFirstAsync.mockResolvedValue(existingCustomer);

      const invalidUpdate = {
        phone: "invalid-phone",
      };

      await expect(
        repository.update("cust_123", invalidUpdate)
      ).rejects.toThrow();
    });
  });
});
