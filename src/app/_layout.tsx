import { KlyntlThemeProvider } from "@/components/ThemeProvider";
import { useColorScheme } from "@/hooks/useColorScheme";
import { DatabaseProvider } from "@/services/database/context";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import "react-native-reanimated";

// Create a stable query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global query defaults
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes by default
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes by default
      refetchOnWindowFocus: false, // Don't refetch on window focus by default
      refetchOnReconnect: true, // Refetch when reconnecting to internet
      refetchOnMount: true, // Refetch when component mounts
    },
    mutations: {
      // Global mutation defaults
      retry: 1,
      retryDelay: 1000,
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <DatabaseProvider
        databaseName="klyntl.db"
        onError={(error) => {
          console.error("Database error in app:", error);
          // You can add user-friendly error handling here
          // For example, show a toast or redirect to an error screen
        }}
      >
        <KlyntlThemeProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="customer/add"
                options={{
                  title: "Add Customer",
                  presentation: "modal",
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="customer/[id]"
                options={{
                  title: "Customer Details",
                  headerBackTitle: "Customers",
                  headerTitleStyle: {
                    fontSize: 18,
                    fontWeight: "600",
                  },
                }}
              />
              <Stack.Screen
                name="transaction/add"
                options={{
                  title: "Add Transaction",
                  presentation: "modal",
                  headerShown: false,
                }}
              />
              <Stack.Screen name="+not-found" />
            </Stack>
          </ThemeProvider>
        </KlyntlThemeProvider>
      </DatabaseProvider>
    </QueryClientProvider>
  );
}
