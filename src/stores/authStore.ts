import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  phone?: string;
  name?: string;
  businessName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    phone?: string,
    name?: string,
    businessName?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
}

type AuthStore = AuthState & AuthActions;

const AUTH_STORAGE_KEY = "@klyntl_auth";

// Simple password hashing for demo purposes
// In production, use proper hashing like bcrypt
const hashPassword = (password: string): string => {
  // This is just for demo - use proper hashing in production
  return btoa(password + "klyntl_salt");
};

const verifyPassword = (password: string, hashedPassword: string): boolean => {
  return hashPassword(password) === hashedPassword;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          // Get stored users
          const storedUsers = await AsyncStorage.getItem("@klyntl_users");
          const users = storedUsers ? JSON.parse(storedUsers) : [];

          // Find user by email
          const user = users.find((u: any) => u.email === email);

          if (!user) {
            throw new Error("User not found");
          }

          // Verify password
          if (!verifyPassword(password, user.password)) {
            throw new Error("Invalid password");
          }

          // Remove password from user object before storing in state
          const { password: _, ...userWithoutPassword } = user;

          set({
            user: userWithoutPassword,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Login failed",
          });
          throw error;
        }
      },

      register: async (
        email: string,
        password: string,
        phone?: string,
        name?: string,
        businessName?: string
      ) => {
        set({ isLoading: true, error: null });

        try {
          // Get stored users
          const storedUsers = await AsyncStorage.getItem("@klyntl_users");
          const users = storedUsers ? JSON.parse(storedUsers) : [];

          // Check if user already exists
          const existingUser = users.find((u: any) => u.email === email);
          if (existingUser) {
            throw new Error("User already exists");
          }

          // Create new user
          const newUser = {
            id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            email,
            phone,
            name,
            businessName,
            password: hashPassword(password),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Save user to storage
          users.push(newUser);
          await AsyncStorage.setItem("@klyntl_users", JSON.stringify(users));

          // Remove password from user object before storing in state
          const { password: _, ...userWithoutPassword } = newUser;

          set({
            user: userWithoutPassword,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error ? error.message : "Registration failed",
          });
          throw error;
        }
      },

      logout: async () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string) => set({ error }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user and isAuthenticated
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Auth hook for components
export const useAuth = () => {
  const store = useAuthStore();
  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    login: store.login,
    register: store.register,
    logout: store.logout,
    clearError: store.clearError,
  };
};
