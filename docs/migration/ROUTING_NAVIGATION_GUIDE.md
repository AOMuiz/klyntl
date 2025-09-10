# Expo Router Navigation & Routing Guide

## Overview

This document provides comprehensive guidance on the routing and navigation structure of the Klyntl app, built with Expo Router. It covers the current architecture, best practices for implementing protected routes, authentication flows, and guidelines for future development.

## Table of Contents

1. [Current Routing Architecture](#current-routing-architecture)
2. [Route Types & Patterns](#route-types--patterns)
3. [Protected Routes Implementation](#protected-routes-implementation)
4. [Authentication Flow](#authentication-flow)
5. [Navigation Best Practices](#navigation-best-practices)
6. [Adding New Routes](#adding-new-routes)
7. [Modal Management](#modal-management)
8. [Deep Linking](#deep-linking)
9. [Testing Navigation](#testing-navigation)

## Current Routing Architecture

### Directory Structure

```
src/app/
├── _layout.tsx                    # Root layout with providers & protected routes
├── +not-found.tsx                # 404 error page
├── onboarding.tsx                # Public onboarding flow
├── (tabs)/                       # Main tab navigation
│   ├── _layout.tsx              # Tab configuration
│   ├── index.tsx                # Home/Dashboard
│   ├── customers.tsx            # Customer list
│   ├── transactions.tsx         # Transaction list
│   ├── analytics.tsx            # Analytics dashboard
│   └── store/                   # Store section
│       ├── _layout.tsx          # Store navigation
│       ├── index.tsx            # Store listing
│       └── [id].tsx             # Store item details
├── (modal)/                     # Modal presentations
│   ├── _layout.tsx              # Modal configuration
│   ├── customer/                # Customer modals
│   │   ├── _layout.tsx          # Customer modal layout
│   │   ├── add.tsx              # Add customer modal
│   │   └── edit/[id].tsx        # Edit customer modal
│   ├── transaction/             # Transaction modals
│   │   ├── _layout.tsx          # Transaction modal layout
│   │   ├── add.tsx              # Add transaction modal
│   │   └── edit/[id].tsx        # Edit transaction modal
│   └── store/                   # Store modals
│       ├── _layout.tsx          # Store modal layout
│       ├── add.tsx              # Add store item modal
│       └── edit/[id].tsx        # Edit store item modal
└── customer/                    # Customer stack routes
    ├── _layout.tsx              # Customer navigation
    └── [id].tsx                 # Customer details
```

### Route Groups

- **`(tabs)`**: Main app navigation with bottom tabs
- **`(modal)`**: Modal presentations for forms and secondary actions
- **`(auth)`**: Future authentication routes (not yet implemented)

## Route Types & Patterns

### 1. Tab Routes

Located in `(tabs)/` - Main navigation screens

```tsx
// Example: src/app/(tabs)/customers.tsx
import { View, Text } from "react-native";

export default function CustomersScreen() {
  return (
    <View>
      <Text>Customers List</Text>
    </View>
  );
}
```

### 2. Modal Routes

Located in `(modal)/` - Forms and secondary actions

```tsx
// Example: src/app/(modal)/customer/add.tsx
import { View, Text } from "react-native";

export default function AddCustomerModal() {
  return (
    <View>
      <Text>Add Customer Form</Text>
    </View>
  );
}
```

### 3. Stack Routes

Regular directories for detail views and nested navigation

```tsx
// Example: src/app/customer/[id].tsx
import { useLocalSearchParams } from "expo-router";

export default function CustomerDetails() {
  const { id } = useLocalSearchParams();

  return (
    <View>
      <Text>Customer Details: {id}</Text>
    </View>
  );
}
```

### 4. Dynamic Routes

Use square brackets for dynamic segments

```tsx
// File: src/app/customer/[id].tsx
// URL: /customer/123
// Params: { id: '123' }

const { id } = useLocalSearchParams<{ id: string }>();
```

### 5. Catch-All Routes

Use triple dots for catch-all segments

```tsx
// File: src/app/blog/[...slug].tsx
// URL: /blog/2024/09/01/my-post
// Params: { slug: ['2024', '09', '01', 'my-post'] }
```

## Protected Routes Implementation

### Current Implementation

The app uses Expo Router's `Stack.Protected` component with AsyncStorage for persistence:

```tsx
// src/app/_layout.tsx
import { Stack } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEY = "hasSeenOnboarding";

export default function RootLayout() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [flagLoaded, setFlagLoaded] = useState(false);

  // Load onboarding status
  const readOnboardingFlag = async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      setHasSeenOnboarding(value === "true");
    } catch {
      setHasSeenOnboarding(false);
    } finally {
      setFlagLoaded(true);
    }
  };

  useEffect(() => {
    readOnboardingFlag();
  }, []);

  // Wait for flag to load before rendering
  if (!loaded || !flagLoaded) return null;

  return (
    <Stack>
      {/* Public routes */}
      <Stack.Screen
        name="onboarding"
        options={{ headerShown: false, gestureEnabled: false }}
      />

      {/* Protected routes */}
      <Stack.Protected guard={hasSeenOnboarding}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(modal)" options={{ headerShown: false }} />
        <Stack.Screen name="customer" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack.Protected>
    </Stack>
  );
}
```

### Advanced Protected Routes

For more complex authentication scenarios:

```tsx
// src/app/_layout.tsx
import { useAuth } from "@/hooks/useAuth";

export default function RootLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return (
    <Stack>
      {/* Public routes */}
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />

      {/* Protected routes */}
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(modal)" />
        {/* Other protected routes */}
      </Stack.Protected>
    </Stack>
  );
}
```

## Authentication Flow

### 1. Auth Hook Implementation

```tsx
// src/hooks/useAuth.ts
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  id: string;
  email: string;
  name: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        // Validate token with your API
        const userData = await validateToken(token);
        setUser(userData);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.signIn(email, password);
      await AsyncStorage.setItem("authToken", response.token);
      setUser(response.user);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      setUser(null);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return {
    user,
    isLoading,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };
}
```

### 2. Auth Layout Structure

```tsx
// src/app/(auth)/_layout.tsx
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
```

### 3. Login Screen Example

```tsx
// src/app/(auth)/login.tsx
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { router } from "expo-router";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, isLoading } = useAuth();

  const handleLogin = async () => {
    const result = await signIn(email, password);
    if (result.success) {
      router.replace("/(tabs)");
    } else {
      // Handle error
      Alert.alert("Login Failed", result.error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <TouchableOpacity
        onPress={handleLogin}
        disabled={isLoading}
        style={styles.button}
      >
        <Text>{isLoading ? "Signing In..." : "Sign In"}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### 4. Route Protection with Auth

```tsx
// src/app/_layout.tsx
import { useAuth } from "@/hooks/useAuth";

export default function RootLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return (
    <Stack>
      {/* Public routes */}
      <Stack.Screen name="(auth)" />

      {/* Protected routes */}
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(modal)" />
        <Stack.Screen name="customer" />
      </Stack.Protected>
    </Stack>
  );
}
```

## Navigation Best Practices

### 1. Navigation Hooks

```tsx
// src/hooks/useNavigation.ts
import { useRouter, useLocalSearchParams, usePathname } from "expo-router";

export function useAppNavigation() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const pathname = usePathname();

  const navigateToCustomer = (customerId: string) => {
    router.push(`/customer/${customerId}`);
  };

  const navigateToAddCustomer = () => {
    router.push("/(modal)/customer/add");
  };

  const navigateToEditCustomer = (customerId: string) => {
    router.push(`/(modal)/customer/edit/${customerId}`);
  };

  const goBack = () => {
    router.back();
  };

  return {
    navigateToCustomer,
    navigateToAddCustomer,
    navigateToEditCustomer,
    goBack,
    params,
    pathname,
  };
}
```

### 2. Type-Safe Navigation

```tsx
// src/types/navigation.ts
export type RootStackParamList = {
  "(tabs)": undefined;
  "(modal)": undefined;
  "customer/[id]": { id: string };
  "(modal)/customer/add": undefined;
  "(modal)/customer/edit/[id]": { id: string };
  // Add more routes as needed
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

### 3. Navigation Guards

```tsx
// src/hooks/useNavigationGuard.ts
import { useRouter } from "expo-router";
import { useEffect } from "react";

export function useNavigationGuard(condition: boolean, redirectTo: string) {
  const router = useRouter();

  useEffect(() => {
    if (!condition) {
      router.replace(redirectTo);
    }
  }, [condition, redirectTo, router]);
}

// Usage in component
export default function ProtectedScreen() {
  useNavigationGuard(isAuthenticated, "/(auth)/login");

  return <View>{/* Protected content */}</View>;
}
```

## Adding New Routes

### 1. Adding a New Tab

```bash
# Create the directory structure
mkdir -p src/app/\(tabs\)/settings

# Create the layout (if needed)
touch src/app/\(tabs\)/settings/_layout.tsx

# Create the screen
touch src/app/\(tabs\)/settings/index.tsx
```

```tsx
// src/app/(tabs)/settings/_layout.tsx
import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Settings" }} />
      <Stack.Screen name="profile" options={{ title: "Profile" }} />
      <Stack.Screen name="preferences" options={{ title: "Preferences" }} />
    </Stack>
  );
}
```

```tsx
// src/app/(tabs)/_layout.tsx
<Tabs.Screen
  name="settings"
  options={{
    title: "Settings",
    tabBarIcon: ({ color }) => (
      <IconSymbol size={28} name="gear" color={color} />
    ),
  }}
/>
```

### 2. Adding a New Modal Route

```bash
# Create the directory structure
mkdir -p src/app/\(modal\)/product

# Create the layout
touch src/app/\(modal\)/product/_layout.tsx

# Create the screens
touch src/app/\(modal\)/product/add.tsx
touch src/app/\(modal\)/product/edit/\[id\].tsx
```

```tsx
// src/app/(modal)/product/_layout.tsx
import { Stack } from "expo-router";
import { ModalCloseButton } from "@/components/ui/ModalCloseButton";

export default function ProductModalLayout() {
  return (
    <Stack
      screenOptions={{
        headerLeft: () => <ModalCloseButton />,
      }}
    >
      <Stack.Screen name="add" options={{ title: "Add Product" }} />
      <Stack.Screen name="edit/[id]" options={{ title: "Edit Product" }} />
    </Stack>
  );
}
```

### 3. Adding a New Stack Route

```bash
# Create the directory structure
mkdir -p src/app/product

# Create the layout
touch src/app/product/_layout.tsx

# Create the screens
touch src/app/product/index.tsx
touch src/app/product/\[id\].tsx
```

```tsx
// src/app/product/_layout.tsx
import { Stack } from "expo-router";

export default function ProductLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Products" }} />
      <Stack.Screen name="[id]" options={{ title: "Product Details" }} />
    </Stack>
  );
}
```

## Modal Management

### Modal Best Practices

1. **Always provide a close button** - Use `ModalCloseButton` component
2. **Handle form state properly** - Prevent accidental data loss
3. **Use appropriate presentation** - `modal` for forms, `transparentModal` for overlays
4. **Manage keyboard** - Handle keyboard appearance/disappearance
5. **Test on different screen sizes** - Ensure proper modal sizing

### Modal Close Button Usage

```tsx
// Basic usage
<ModalCloseButton />

// With confirmation for unsaved changes
<ModalCloseButton
  onPress={() => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  }}
/>

// Different variants
<ModalCloseButton variant="text" text="Close" />
<ModalCloseButton variant="cancel" text="Cancel" textColor="#FF3B30" />
```

## Deep Linking

### 1. Configure Deep Links

```json
// app.json
{
  "expo": {
    "scheme": "klyntl",
    "web": {
      "bundler": "metro"
    }
  }
}
```

### 2. Handle Deep Links

```tsx
// src/hooks/useDeepLink.ts
import { useEffect } from "react";
import { router } from "expo-router";
import * as Linking from "expo-linking";

export function useDeepLink() {
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { path, queryParams } = Linking.parse(event.url);

      if (path === "customer") {
        router.push(`/customer/${queryParams.id}`);
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Handle initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => subscription.remove();
  }, []);
}
```

### 3. Generate Deep Links

```tsx
// src/utils/deepLinks.ts
import * as Linking from "expo-linking";

export const generateCustomerDeepLink = (customerId: string) => {
  return Linking.createURL(`customer`, {
    queryParams: { id: customerId },
  });
};

export const generateTransactionDeepLink = (transactionId: string) => {
  return Linking.createURL(`transaction/${transactionId}`);
};
```

## Testing Navigation

### 1. Unit Tests for Navigation Logic

```tsx
// __tests__/navigation.test.ts
import { renderHook } from "@testing-library/react-native";
import { useRouter } from "expo-router";

describe("Navigation", () => {
  it("navigates to customer details", () => {
    const { result } = renderHook(() => useRouter());

    result.current.push("/customer/123");

    // Assert navigation occurred
    expect(result.current.pathname).toBe("/customer/123");
  });
});
```

### 2. Integration Tests for Route Protection

```tsx
// __tests__/auth-navigation.test.tsx
import { render, screen } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RootLayout from "@/app/_layout";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

describe("Authentication Navigation", () => {
  it("shows login screen when not authenticated", async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <RootLayout />
      </QueryClientProvider>
    );

    // Mock unauthenticated state
    // Assert login screen is shown
    expect(screen.getByText("Login")).toBeTruthy();
  });
});
```

### 3. E2E Tests with Detox

```tsx
// e2e/navigation.e2e.ts
describe("Navigation Flow", () => {
  it("should navigate from home to customer details", async () => {
    await device.launchApp();

    // Navigate to customers tab
    await element(by.id("customers-tab")).tap();

    // Tap on first customer
    await element(by.id("customer-item-0")).tap();

    // Assert customer details screen is shown
    await expect(element(by.id("customer-details"))).toBeVisible();
  });
});
```

## Conclusion

This routing architecture provides a solid foundation for the Klyntl app with:

- **Clear separation** between public and protected routes
- **Scalable structure** using route groups
- **Consistent modal management** with reusable components
- **Type-safe navigation** with proper TypeScript support
- **Authentication integration** ready for expansion
- **Deep linking support** for external navigation
- **Comprehensive testing** strategies

When adding new features, follow these patterns to maintain consistency and scalability. Always consider the user experience and ensure proper navigation guards are in place for protected content.

For more information about Expo Router, refer to the [official documentation](https://docs.expo.dev/router/introduction/).
