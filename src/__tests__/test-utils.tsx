/**
 * Test utilities for React Native Testing Library
 */

import { NavigationContainer } from "@react-navigation/native";
import { render, RenderOptions } from "@testing-library/react-native";
import React from "react";
import { KlyntlThemeProvider } from "../components/ThemeProvider";

// Custom render function that includes providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <KlyntlThemeProvider forcedTheme="light">
      <NavigationContainer>{children}</NavigationContainer>
    </KlyntlThemeProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react-native";
export { customRender as render };

// Mock data generators
export const mockCustomer = {
  id: "cust_123",
  name: "John Doe",
  phone: "+2348012345678",
  email: "john@example.com",
  address: "123 Lagos Street, VI, Lagos",
  totalSpent: 50000,
  lastPurchase: "2024-01-15T10:30:00Z",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-15T10:30:00Z",
};

export const mockTransaction = {
  id: "txn_123",
  customerId: "cust_123",
  amount: 25000,
  description: "Product purchase",
  date: "2024-01-15T10:30:00Z",
  type: "sale" as const,
};

export const createMockCustomers = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockCustomer,
    id: `cust_${index + 1}`,
    name: `Customer ${index + 1}`,
    phone: `+23480123456${index.toString().padStart(2, "0")}`,
    totalSpent: (index + 1) * 10000,
  }));
};

export const createMockTransactions = (count: number, customerId: string) => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockTransaction,
    id: `txn_${index + 1}`,
    customerId,
    amount: (index + 1) * 5000,
    date: new Date(2024, 0, index + 1).toISOString(),
  }));
};

// Mock navigation object
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  replace: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  isFocused: jest.fn(() => true),
  canGoBack: jest.fn(() => true),
  getId: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
};

// Database test helpers
export const mockDatabaseService = {
  createCustomer: jest.fn(),
  getCustomers: jest.fn(),
  updateCustomer: jest.fn(),
  deleteCustomer: jest.fn(),
  createTransaction: jest.fn(),
  getTransactions: jest.fn(),
  getAnalytics: jest.fn(),
};

// Wait for async operations to complete
export const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
