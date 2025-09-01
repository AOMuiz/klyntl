# Quick Start: Adding Authentication to Expo Router

## 1. Create Auth Hook

```tsx
// src/hooks/useAuth.ts
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        // Validate token with API
        setUser({ id: "1", email: "user@example.com" });
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    // Implement your sign-in logic
    const mockUser = { id: "1", email };
    setUser(mockUser);
    await AsyncStorage.setItem("authToken", "mock-token");
    return { success: true };
  };

  const signOut = async () => {
    setUser(null);
    await AsyncStorage.removeItem("authToken");
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

## 2. Create Auth Routes

```bash
mkdir -p src/app/\(auth\)
touch src/app/\(auth\)/_layout.tsx
touch src/app/\(auth\)/login.tsx
```

```tsx
// src/app/(auth)/_layout.tsx
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
    </Stack>
  );
}
```

```tsx
// src/app/(auth)/login.tsx
import { useState } from "react";
import { View, TextInput, TouchableOpacity, Text } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { router } from "expo-router";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn } = useAuth();

  const handleLogin = async () => {
    const result = await signIn(email, password);
    if (result.success) {
      router.replace("/(tabs)");
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginBottom: 20 }}
      />
      <TouchableOpacity
        onPress={handleLogin}
        style={{ backgroundColor: "#007AFF", padding: 15, borderRadius: 5 }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## 3. Update Root Layout

```tsx
// src/app/_layout.tsx
import { useAuth } from "@/hooks/useAuth";

export default function RootLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null; // Or loading screen

  return (
    <Stack>
      {/* Public routes */}
      <Stack.Screen name="(auth)" />

      {/* Protected routes */}
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(modal)" options={{ headerShown: false }} />
        <Stack.Screen name="customer" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
```

## 4. Add Sign Out

```tsx
// In any screen, add sign out functionality
import { useAuth } from "@/hooks/useAuth";
import { router } from "expo-router";

export default function SomeScreen() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  return (
    <TouchableOpacity onPress={handleSignOut}>
      <Text>Sign Out</Text>
    </TouchableOpacity>
  );
}
```

## Key Points

1. **Auth Hook**: Manages authentication state
2. **Route Groups**: Use `(auth)` for auth routes
3. **Protected Routes**: Use `Stack.Protected` with auth guard
4. **Navigation**: Redirect based on auth state
5. **Persistence**: Store tokens in AsyncStorage

This provides a complete authentication flow with protected routes!
