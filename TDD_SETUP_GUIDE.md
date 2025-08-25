# TDD Implementation Guide for Klyntl

## Test-Driven Development Setup Complete! 🎉

### What's Been Set Up

1. **Jest Testing Framework** with Expo integration
2. **React Native Testing Library** for component testing
3. **Comprehensive Test Coverage** requirements (70% minimum)
4. **Mock Setup** for external dependencies (SQLite, Contacts, etc.)
5. **Test Utilities** for common testing patterns

### Project Structure

```
src/
├── __tests__/
│   ├── setup.ts                 # Global test configuration
│   └── test-utils.tsx          # Testing utilities and custom render
├── components/
│   ├── CustomerCard.tsx        # Example component
│   └── __tests__/
│       └── CustomerCard.test.tsx
├── services/
│   ├── database.ts             # Database service
│   └── __tests__/
│       └── database.test.ts
├── stores/
│   ├── customerStore.ts        # Zustand store
│   └── __tests__/
│       └── customerStore.test.ts
└── types/
    ├── customer.ts
    ├── transaction.ts
    └── analytics.ts
```

### Available NPM Scripts

```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:ci       # Run tests in CI mode
```

### TDD Workflow Example

Follow the **Red-Green-Refactor** cycle:

#### 1. RED - Write a Failing Test First

```typescript
// src/services/__tests__/customerService.test.ts
describe("CustomerService", () => {
  it("should validate phone numbers correctly", () => {
    const result = validateNigerianPhone("+2348012345678");
    expect(result.isValid).toBe(true);
  });
});
```

#### 2. GREEN - Write Minimal Code to Pass

```typescript
// src/services/customerService.ts
export const validateNigerianPhone = (phone: string) => {
  const regex = /^(\+234|0)[789][01]\d{8}$/;
  return { isValid: regex.test(phone) };
};
```

#### 3. REFACTOR - Improve Code Quality

```typescript
// Enhanced version with better error messages
export interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateNigerianPhone = (phone: string): PhoneValidationResult => {
  if (!phone) {
    return { isValid: false, error: "Phone number is required" };
  }

  const regex = /^(\+234|0)[789][01]\d{8}$/;
  const isValid = regex.test(phone);

  return {
    isValid,
    error: isValid ? undefined : "Invalid Nigerian phone number format",
  };
};
```

### Key Testing Patterns

#### 1. Database Testing

```typescript
// Mock SQLite for consistent testing
jest.mock("expo-sqlite");

// Test database operations
it("should create customer with unique ID", async () => {
  const customerData = { name: "John", phone: "+2348012345678" };
  const result = await databaseService.createCustomer(customerData);

  expect(result.id).toMatch(/^cust_\d+_[a-z0-9]+$/);
  expect(result.name).toBe(customerData.name);
});
```

#### 2. Store Testing with Zustand

```typescript
// Test state management
it("should add customer to store", async () => {
  const { result } = renderHook(() => useCustomerStore());

  await act(async () => {
    await result.current.addCustomer(customerData);
  });

  expect(result.current.customers).toHaveLength(1);
  expect(result.current.error).toBe(null);
});
```

#### 3. Component Testing

```typescript
// Test UI components
it("should render customer card with correct data", () => {
  const { getByTestId } = render(
    <CustomerCard customer={mockCustomer} onPress={mockOnPress} />
  );

  expect(getByTestId("customer-name")).toHaveTextContent("John Doe");
  expect(getByTestId("total-spent")).toHaveTextContent("₦50,000");
});
```

### Test Coverage Goals

The setup enforces minimum 70% coverage across:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Best Practices

1. **Write Tests First** - Always start with a failing test
2. **Test Behavior, Not Implementation** - Focus on what the code should do
3. **Use Descriptive Test Names** - Make intent clear
4. **Arrange-Act-Assert Pattern** - Structure tests consistently
5. **Mock External Dependencies** - Keep tests isolated and fast
6. **Test Edge Cases** - Handle error conditions and boundaries

### Example TDD Session for New Feature

Let's implement a customer search feature using TDD:

```typescript
// 1. RED - Write failing test
describe("Customer Search", () => {
  it("should find customers by partial name match", async () => {
    const customers = await searchCustomers("John");
    expect(customers).toHaveLength(2);
    expect(customers[0].name).toContain("John");
  });
});

// 2. GREEN - Implement minimal solution
export const searchCustomers = async (query: string) => {
  return await databaseService.getCustomers(query);
};

// 3. REFACTOR - Add validation and error handling
export const searchCustomers = async (query: string) => {
  if (!query || query.trim().length < 2) {
    throw new Error("Search query must be at least 2 characters");
  }

  const normalizedQuery = query.trim().toLowerCase();
  return await databaseService.getCustomers(normalizedQuery);
};
```

### Next Steps

1. **Install Dependencies**: Run `npm install` to install testing packages
2. **Run Initial Tests**: Execute `npm test` to verify setup
3. **Start TDD Development**: Create failing tests for your next feature
4. **Maintain Coverage**: Keep tests running to maintain quality

### Debugging Tests

If tests fail:

1. Check mock configurations in `src/__tests__/setup.ts`
2. Verify import paths are correct
3. Ensure async operations are properly awaited
4. Use `console.log` in tests for debugging (but remove before commit)

Ready to start building with confidence! 🚀
