# Frontend MVP Implementation - Customer & Marketing Module

## MVP Overview & Strategy

### Core MVP Objectives

- **Time to Market:** 3 months from development start
- **Target Users:** 1,000 Nigerian SME owners in Lagos/Abuja
- **Core Value:** Transform customer contacts into business insights
- **Success Metric:** 70% weekly active usage rate

### MVP Feature Scope (Essential Only)

```
✅ Customer Directory (Add, Edit, Search, View)
✅ Basic Transaction Recording (Amount, Date, Customer)
✅ Simple Analytics Dashboard (Total customers, revenue, top customers)
✅ Manual SMS/WhatsApp messaging
✅ Offline-first data storage
✅ Basic online store (5 products max)

❌ Automated marketing campaigns (Post-MVP)
❌ Advanced analytics & RFM analysis (Post-MVP)
❌ Loyalty programs (Post-MVP)
❌ Bulk operations (Post-MVP)
❌ Advanced payment integrations (Post-MVP)
```

## Technical Architecture for MVP

### 1. Technology Stack (Minimal but Scalable)

```typescript
// Core Dependencies
{
  "react-native": "0.72.6",
  "expo": "~49.0.0", // For faster development
  "expo-sqlite": "~11.3.3", // Local database
  "react-query": "^3.39.3", // Data fetching & caching
  "zustand": "^4.4.1", // Lightweight state management
  "react-hook-form": "^7.45.4", // Form handling
  "react-native-paper": "^5.10.6", // UI components
  "expo-contacts": "~12.3.0", // Contact import
  "expo-linking": "~5.0.2", // WhatsApp/SMS links
  "react-native-chart-kit": "^6.12.0" // Simple charts
}

// Development Dependencies
{
  "typescript": "^5.1.3",
  "@types/react-native": "^0.72.2",
  "metro-config": "^0.76.7"
}
```

### 2. Project Structure (MVP Focused)

```
src/
├── components/           # Reusable UI components
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── LoadingSpinner.tsx
│   ├── customer/
│   │   ├── CustomerCard.tsx
│   │   ├── CustomerForm.tsx
│   │   └── CustomerList.tsx
│   └── analytics/
│       ├── StatsCard.tsx
│       └── SimpleChart.tsx
├── screens/              # Main app screens
│   ├── CustomerListScreen.tsx
│   ├── CustomerDetailScreen.tsx
│   ├── AddCustomerScreen.tsx
│   ├── TransactionScreen.tsx
│   ├── AnalyticsScreen.tsx
│   └── StoreScreen.tsx
├── services/             # Business logic
│   ├── database.ts
│   ├── customerService.ts
│   ├── transactionService.ts
│   └── syncService.ts
├── stores/               # State management
│   ├── customerStore.ts
│   ├── transactionStore.ts
│   └── appStore.ts
├── types/                # TypeScript definitions
│   ├── customer.ts
│   ├── transaction.ts
│   └── common.ts
├── utils/                # Helper functions
│   ├── formatters.ts
│   ├── validators.ts
│   └── constants.ts
└── navigation/           # Navigation setup
    └── AppNavigator.tsx
```

## Core Implementation Details

### 1. Database Layer (SQLite for MVP)

```typescript
// services/database.ts
import * as SQLite from "expo-sqlite";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalSpent: number;
  lastPurchase?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  customerId: string;
  amount: number;
  description?: string;
  date: string;
  type: "sale" | "payment" | "refund";
}

class DatabaseService {
  private db: SQLite.WebSQLDatabase;

  constructor() {
    this.db = SQLite.openDatabase("klyntl.db");
    this.initializeTables();
  }

  private initializeTables() {
    this.db.transaction((tx) => {
      // Customers table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT UNIQUE NOT NULL,
          email TEXT,
          address TEXT,
          totalSpent REAL DEFAULT 0,
          lastPurchase TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);

      // Transactions table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          customerId TEXT NOT NULL,
          amount REAL NOT NULL,
          description TEXT,
          date TEXT NOT NULL,
          type TEXT NOT NULL,
          FOREIGN KEY (customerId) REFERENCES customers (id)
        );
      `);

      // Create indexes for performance
      tx.executeSql(
        "CREATE INDEX IF NOT EXISTS idx_customer_phone ON customers(phone);"
      );
      tx.executeSql(
        "CREATE INDEX IF NOT EXISTS idx_customer_name ON customers(name);"
      );
      tx.executeSql(
        "CREATE INDEX IF NOT EXISTS idx_transaction_customer ON transactions(customerId);"
      );
      tx.executeSql(
        "CREATE INDEX IF NOT EXISTS idx_transaction_date ON transactions(date);"
      );
    });
  }

  // Customer operations
  async createCustomer(
    customer: Omit<Customer, "id" | "totalSpent" | "createdAt" | "updatedAt">
  ): Promise<Customer> {
    const id = `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const newCustomer: Customer = {
      ...customer,
      id,
      totalSpent: 0,
      createdAt: now,
      updatedAt: now,
    };

    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          "INSERT INTO customers (id, name, phone, email, address, totalSpent, lastPurchase, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            newCustomer.id,
            newCustomer.name,
            newCustomer.phone,
            newCustomer.email,
            newCustomer.address,
            newCustomer.totalSpent,
            newCustomer.lastPurchase,
            newCustomer.createdAt,
            newCustomer.updatedAt,
          ],
          () => resolve(newCustomer),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getCustomers(searchQuery?: string): Promise<Customer[]> {
    return new Promise((resolve, reject) => {
      let sql = "SELECT * FROM customers ORDER BY name ASC";
      let params: any[] = [];

      if (searchQuery) {
        sql =
          "SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name ASC";
        params = [`%${searchQuery}%`, `%${searchQuery}%`];
      }

      this.db.transaction((tx) => {
        tx.executeSql(
          sql,
          params,
          (_, { rows }) => {
            const customers: Customer[] = [];
            for (let i = 0; i < rows.length; i++) {
              customers.push(rows.item(i));
            }
            resolve(customers);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
    const updatedAt = new Date().toISOString();
    const setClause = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(updates), updatedAt, id];

    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          `UPDATE customers SET ${setClause}, updatedAt = ? WHERE id = ?`,
          values,
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Transaction operations
  async createTransaction(
    transaction: Omit<Transaction, "id">
  ): Promise<Transaction> {
    const id = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTransaction: Transaction = { ...transaction, id };

    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        // Insert transaction
        tx.executeSql(
          "INSERT INTO transactions (id, customerId, amount, description, date, type) VALUES (?, ?, ?, ?, ?, ?)",
          [
            newTransaction.id,
            newTransaction.customerId,
            newTransaction.amount,
            newTransaction.description,
            newTransaction.date,
            newTransaction.type,
          ],
          () => {
            // Update customer total spent if it's a sale
            if (newTransaction.type === "sale") {
              tx.executeSql(
                "UPDATE customers SET totalSpent = totalSpent + ?, lastPurchase = ? WHERE id = ?",
                [
                  newTransaction.amount,
                  newTransaction.date,
                  newTransaction.customerId,
                ]
              );
            }
            resolve(newTransaction);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getTransactions(customerId?: string): Promise<Transaction[]> {
    return new Promise((resolve, reject) => {
      let sql = "SELECT * FROM transactions ORDER BY date DESC";
      let params: any[] = [];

      if (customerId) {
        sql =
          "SELECT * FROM transactions WHERE customerId = ? ORDER BY date DESC";
        params = [customerId];
      }

      this.db.transaction((tx) => {
        tx.executeSql(
          sql,
          params,
          (_, { rows }) => {
            const transactions: Transaction[] = [];
            for (let i = 0; i < rows.length; i++) {
              transactions.push(rows.item(i));
            }
            resolve(transactions);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Analytics operations (simplified for MVP)
  async getAnalytics(): Promise<{
    totalCustomers: number;
    totalRevenue: number;
    totalTransactions: number;
    topCustomers: Customer[];
  }> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        // Get total customers
        tx.executeSql(
          "SELECT COUNT(*) as count FROM customers",
          [],
          (_, { rows }) => {
            const totalCustomers = rows.item(0).count;

            // Get total revenue and transactions
            tx.executeSql(
              'SELECT COUNT(*) as count, SUM(amount) as total FROM transactions WHERE type = "sale"',
              [],
              (_, { rows }) => {
                const totalTransactions = rows.item(0).count || 0;
                const totalRevenue = rows.item(0).total || 0;

                // Get top customers
                tx.executeSql(
                  "SELECT * FROM customers ORDER BY totalSpent DESC LIMIT 5",
                  [],
                  (_, { rows }) => {
                    const topCustomers: Customer[] = [];
                    for (let i = 0; i < rows.length; i++) {
                      topCustomers.push(rows.item(i));
                    }

                    resolve({
                      totalCustomers,
                      totalRevenue,
                      totalTransactions,
                      topCustomers,
                    });
                  }
                );
              }
            );
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
}

export const databaseService = new DatabaseService();
```

### 2. State Management (Zustand - Lightweight)

```typescript
// stores/customerStore.ts
import { create } from "zustand";
import { Customer } from "../types/customer";
import { databaseService } from "../services/database";

interface CustomerStore {
  customers: Customer[];
  loading: boolean;
  searchQuery: string;
  selectedCustomer: Customer | null;

  // Actions
  fetchCustomers: () => Promise<void>;
  searchCustomers: (query: string) => void;
  addCustomer: (
    customer: Omit<Customer, "id" | "totalSpent" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  selectCustomer: (customer: Customer | null) => void;
  importFromContacts: () => Promise<void>;
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: [],
  loading: false,
  searchQuery: "",
  selectedCustomer: null,

  fetchCustomers: async () => {
    set({ loading: true });
    try {
      const customers = await databaseService.getCustomers();
      set({ customers, loading: false });
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      set({ loading: false });
    }
  },

  searchCustomers: async (query: string) => {
    set({ searchQuery: query, loading: true });
    try {
      const customers = await databaseService.getCustomers(query);
      set({ customers, loading: false });
    } catch (error) {
      console.error("Failed to search customers:", error);
      set({ loading: false });
    }
  },

  addCustomer: async (customerData) => {
    try {
      const newCustomer = await databaseService.createCustomer(customerData);
      const { customers } = get();
      set({ customers: [newCustomer, ...customers] });
    } catch (error) {
      console.error("Failed to add customer:", error);
      throw error;
    }
  },

  updateCustomer: async (id: string, updates: Partial<Customer>) => {
    try {
      await databaseService.updateCustomer(id, updates);
      const { customers } = get();
      const updatedCustomers = customers.map((customer) =>
        customer.id === id
          ? { ...customer, ...updates, updatedAt: new Date().toISOString() }
          : customer
      );
      set({ customers: updatedCustomers });
    } catch (error) {
      console.error("Failed to update customer:", error);
      throw error;
    }
  },

  selectCustomer: (customer: Customer | null) => {
    set({ selectedCustomer: customer });
  },

  importFromContacts: async () => {
    try {
      const { Contacts } = await import("expo-contacts");
      const { status } = await Contacts.requestPermissionsAsync();

      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        });

        const { customers } = get();
        const existingPhones = new Set(customers.map((c) => c.phone));

        const newCustomers = data
          .filter(
            (contact) =>
              contact.name &&
              contact.phoneNumbers &&
              contact.phoneNumbers.length > 0
          )
          .map((contact) => ({
            name: contact.name!,
            phone: contact.phoneNumbers![0].number!.replace(/\D/g, ""), // Clean phone number
          }))
          .filter((contact) => !existingPhones.has(contact.phone))
          .slice(0, 50); // Limit to 50 imports at once for MVP

        // Add imported customers
        for (const customerData of newCustomers) {
          try {
            await get().addCustomer(customerData);
          } catch (error) {
            // Skip duplicates and continue
            console.warn("Skipped importing customer:", customerData.name);
          }
        }
      }
    } catch (error) {
      console.error("Failed to import contacts:", error);
      throw error;
    }
  },
}));

// stores/transactionStore.ts
import { create } from "zustand";
import { Transaction } from "../types/transaction";
import { databaseService } from "../services/database";

interface TransactionStore {
  transactions: Transaction[];
  loading: boolean;

  fetchTransactions: (customerId?: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  loading: false,

  fetchTransactions: async (customerId?: string) => {
    set({ loading: true });
    try {
      const transactions = await databaseService.getTransactions(customerId);
      set({ transactions, loading: false });
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      set({ loading: false });
    }
  },

  addTransaction: async (transactionData) => {
    try {
      const newTransaction = await databaseService.createTransaction(
        transactionData
      );
      const { transactions } = get();
      set({ transactions: [newTransaction, ...transactions] });
    } catch (error) {
      console.error("Failed to add transaction:", error);
      throw error;
    }
  },
}));
```

### 3. Core UI Components (React Native Paper + Custom)

```typescript
// components/common/Button.tsx
import React from "react";
import { Button as PaperButton } from "react-native-paper";
import { StyleSheet } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  mode?: "text" | "outlined" | "contained";
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: any;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  mode = "contained",
  disabled = false,
  loading = false,
  icon,
  style,
}) => {
  return (
    <PaperButton
      mode={mode}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      icon={icon}
      style={[styles.button, style]}
      contentStyle={styles.buttonContent}
    >
      {title}
    </PaperButton>
  );
};

const styles = StyleSheet.create({
  button: {
    marginVertical: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

// components/customer/CustomerCard.tsx
import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card, Text, Avatar } from "react-native-paper";
import { Customer } from "../../types/customer";

interface CustomerCardProps {
  customer: Customer;
  onPress: () => void;
  onLongPress?: () => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onPress,
  onLongPress,
}) => {
  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastPurchase = (date?: string) => {
    if (!date) return "No purchases yet";

    const purchaseDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - purchaseDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Avatar.Text
              size={48}
              label={getInitials(customer.name)}
              style={styles.avatar}
            />
            <View style={styles.info}>
              <Text variant="titleMedium" style={styles.name}>
                {customer.name}
              </Text>
              <Text variant="bodySmall" style={styles.phone}>
                {customer.phone}
              </Text>
              <Text variant="bodySmall" style={styles.lastPurchase}>
                {formatLastPurchase(customer.lastPurchase)}
              </Text>
            </View>
            <View style={styles.amount}>
              <Text variant="titleSmall" style={styles.totalSpent}>
                {formatCurrency(customer.totalSpent)}
              </Text>
              <Text variant="bodySmall" style={styles.label}>
                Total Spent
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    marginHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    backgroundColor: "#2E7D32",
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontWeight: "bold",
  },
  phone: {
    color: "#666",
    marginTop: 2,
  },
  lastPurchase: {
    color: "#999",
    marginTop: 2,
  },
  amount: {
    alignItems: "flex-end",
  },
  totalSpent: {
    fontWeight: "bold",
    color: "#2E7D32",
  },
  label: {
    color: "#666",
    marginTop: 2,
  },
});

// components/customer/CustomerForm.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { TextInput, HelperText } from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import { Button } from "../common/Button";

interface CustomerFormData {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

interface CustomerFormProps {
  initialData?: Partial<CustomerFormData>;
  onSubmit: (data: CustomerFormData) => void;
  loading?: boolean;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormData>({
    defaultValues: {
      name: initialData?.name || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      address: initialData?.address || "",
    },
  });

  const validatePhone = (phone: string) => {
    const nigerianPhoneRegex = /^(\+234|0)[789][01]\d{8}$/;
    return (
      nigerianPhoneRegex.test(phone) ||
      "Please enter a valid Nigerian phone number"
    );
  };

  const validateEmail = (email: string) => {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) || "Please enter a valid email address";
  };

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="name"
        rules={{ required: "Customer name is required" }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Customer Name *"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            mode="outlined"
            style={styles.input}
            error={!!errors.name}
          />
        )}
      />
      <HelperText type="error" visible={!!errors.name}>
        {errors.name?.message}
      </HelperText>

      <Controller
        control={control}
        name="phone"
        rules={{
          required: "Phone number is required",
          validate: validatePhone,
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Phone Number *"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            mode="outlined"
            style={styles.input}
            keyboardType="phone-pad"
            placeholder="+234 801 234 5678"
            error={!!errors.phone}
          />
        )}
      />
      <HelperText type="error" visible={!!errors.phone}>
        {errors.phone?.message}
      </HelperText>

      <Controller
        control={control}
        name="email"
        rules={{ validate: validateEmail }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Email Address"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!errors.email}
          />
        )}
      />
      <HelperText type="error" visible={!!errors.email}>
        {errors.email?.message}
      </HelperText>

      <Controller
        control={control}
        name="address"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Address"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={3}
          />
        )}
      />

      <Button
        title={initialData ? "Update Customer" : "Add Customer"}
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        style={styles.submitButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  input: {
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 16,
  },
});
```

### 4. Main Screens Implementation

```typescript
// screens/CustomerListScreen.tsx
import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, Alert } from "react-native";
import { Searchbar, FAB, Text } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { CustomerCard } from "../components/customer/CustomerCard";
import { useCustomerStore } from "../stores/customerStore";
import { Customer } from "../types/customer";

export const CustomerListScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const {
    customers,
    loading,
    searchQuery,
    fetchCustomers,
    searchCustomers,
    importFromContacts,
  } = useCustomerStore();

  const [searchText, setSearchText] = useState("");

  useFocusEffect(
    React.useCallback(() => {
      fetchCustomers();
    }, [fetchCustomers])
  );

  const handleSearch = (query: string) => {
    setSearchText(query);
    if (query.length > 0) {
      searchCustomers(query);
    } else {
      fetchCustomers();
    }
  };

  const handleCustomerPress = (customer: Customer) => {
    navigation.navigate("CustomerDetail", { customer });
  };

  const handleImportContacts = async () => {
    try {
      await importFromContacts();
      Alert.alert("Success", "Contacts imported successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to import contacts. Please try again.");
    }
  };

  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <CustomerCard customer={item} onPress={() => handleCustomerPress(item)} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        No customers yet
      </Text>
      <Text variant="bodyMedium" style={styles.emptySubtitle}>
        Add your first customer to get started
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search customers..."
        onChangeText={handleSearch}
        value={searchText}
        style={styles.searchbar}
      />

      {customers.length === 0 && !loading ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={customers}
          renderItem={renderCustomerItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={fetchCustomers}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate("AddCustomer")}
      />

      <FAB
        icon="account-multiple-plus"
        style={[styles.fab, styles.importFab]}
        onPress={handleImportContacts}
        small
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  searchbar: {
    margin: 16,
  },
  list: {
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: "center",
    color: "#666",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  importFab: {
    bottom: 80,
  },
});

// screens/AddCustomerScreen.tsx
import React from "react";
import { ScrollView, StyleSheet, Alert } from "react-native";
import { CustomerForm } from "../components/customer/CustomerForm";
import { useCustomerStore } from "../stores/customerStore";

export const AddCustomerScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { addCustomer } = useCustomerStore();

  const handleSubmit = async (data: any) => {
    try {
      await addCustomer(data);
      Alert.alert("Success", "Customer added successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to add customer. Please try again.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <CustomerForm onSubmit={handleSubmit} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

// screens/AnalyticsScreen.tsx
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Card, Text } from "react-native-paper";
import { databaseService } from "../services/database";

interface Analytics {
  totalCustomers: number;
  totalRevenue: number;
  totalTransactions: number;
  topCustomers: any[];
}

export const AnalyticsScreen: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await databaseService.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
  };

  if (loading || !analytics) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.statValue}>
              {analytics.totalCustomers}
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>
              Total Customers
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.statValue}>
              {formatCurrency(analytics.totalRevenue)}
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>
              Total Revenue
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.statValue}>
              {analytics.totalTransactions}
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>
              Total Sales
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.statValue}>
              {analytics.totalCustomers > 0
                ? formatCurrency(
                    analytics.totalRevenue / analytics.totalCustomers
                  )
                : "₦0"}
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>
              Avg per Customer
            </Text>
          </Card.Content>
        </Card>
      </View>

      <Card style={styles.topCustomersCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Top Customers
          </Text>
          {analytics.topCustomers.map((customer, index) => (
            <View key={customer.id} style={styles.topCustomerItem}>
              <Text variant="bodyLarge">{customer.name}</Text>
              <Text variant="bodyMedium" style={styles.customerAmount}>
                {formatCurrency(customer.totalSpent)}
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 16,
  },
  statCard: {
    width: "47%",
  },
  statValue: {
    fontWeight: "bold",
    color: "#2E7D32",
  },
  statLabel: {
    color: "#666",
    marginTop: 4,
  },
  topCustomersCard: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  topCustomerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  customerAmount: {
    fontWeight: "bold",
    color: "#2E7D32",
  },
});
```

## MVP Development Timeline

### Week 1-2: Foundation & Setup

```
✅ Project setup with Expo
✅ Basic navigation structure
✅ Database schema implementation
✅ Core type definitions
✅ Basic UI component library
```

### Week 3-4: Customer Management

```
✅ Customer CRUD operations
✅ Contact import functionality
✅ Search and filtering
✅ Customer detail view
✅ Transaction recording
```

### Week 5-6: Analytics & Store

```
✅ Basic analytics dashboard
✅ Simple chart integration
✅ Basic online store setup
✅ Product management (simplified)
✅ Manual messaging links
```

### Week 7-8: Polish & Testing

```
✅ UI/UX refinement
✅ Performance optimization
✅ Error handling
✅ Offline functionality testing
✅ Nigerian market testing
```

### Week 9-12: Beta & Launch

```
✅ Beta testing with 50 Nigerian SMEs
✅ Bug fixes and improvements
✅ App store submission
✅ Initial marketing campaigns
```

## Post-MVP Roadmap (Months 4-12)

### Phase 2: Enhanced Features (Months 4-6)

```
🔄 Automated marketing campaigns
🔄 Advanced customer segmentation
🔄 WhatsApp Business API integration
🔄 Payment gateway integrations
🔄 Inventory management sync
🔄 Multi-location support
```

### Phase 3: Advanced Analytics (Months 7-9)

```
🔄 RFM analysis
🔄 Customer lifetime value calculation
🔄 Predictive analytics
🔄 Custom reporting
🔄 Export capabilities
🔄 Dashboard customization
```

### Phase 4: Enterprise Features (Months 10-12)

```
🔄 Team collaboration
🔄 Role-based permissions
🔄 Advanced integrations
🔄 White-label solutions
🔄 API for third-party developers
🔄 Advanced security features
```

## Performance Considerations for MVP

### 1. Database Optimization

```typescript
// Implement pagination for large customer lists
const ITEMS_PER_PAGE = 20;

// Add database indexes for common queries
tx.executeSql(
  "CREATE INDEX IF NOT EXISTS idx_customer_search ON customers(name, phone);"
);

// Use virtual scrolling for large lists
<FlatList
  data={customers}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
/>;
```

### 2. Memory Management

```typescript
// Implement proper cleanup in useEffect
useEffect(() => {
  const subscription = navigation.addListener("blur", () => {
    // Cleanup when screen loses focus
    setSearchText("");
  });

  return subscription;
}, [navigation]);

// Use React.memo for expensive components
export const CustomerCard = React.memo<CustomerCardProps>(
  ({ customer, onPress }) => {
    // Component implementation
  }
);
```

### 3. Offline-First Architecture

```typescript
// Implement sync queue for offline operations
class SyncQueue {
  private queue: SyncOperation[] = [];

  async addOperation(operation: SyncOperation) {
    this.queue.push(operation);
    if (this.isOnline()) {
      await this.processQueue();
    }
  }

  private async processQueue() {
    while (this.queue.length > 0) {
      const operation = this.queue.shift();
      try {
        await this.executeOperation(operation);
      } catch (error) {
        // Put back at front of queue for retry
        this.queue.unshift(operation);
        break;
      }
    }
  }
}
```

This MVP implementation provides a solid foundation that can be built upon while ensuring quick time to market and validation with Nigerian SME users. The architecture is designed to scale seamlessly into the advanced features planned for post-MVP phases.
