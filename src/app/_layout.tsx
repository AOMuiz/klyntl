import { KlyntlThemeProvider } from "@/components/ThemeProvider";
import { useColorScheme } from "@/hooks/useColorScheme";
import { DatabaseProvider } from "@/services/database/context";
import { queryClient } from "@/services/query-client";
import useOnboardingStore from "@/stores/onboardingStore";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";
import "react-native-reanimated";

import { en, registerTranslation } from "react-native-paper-dates";
registerTranslation("en", en);

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <DatabaseProvider
        databaseName="klyntl.db"
        onError={(error) => {
          console.error("Database error in app:", error);
        }}
      >
        <AppLayout />
      </DatabaseProvider>
    </QueryClientProvider>
  );
}

function AppLayout() {
  const { hasSeenOnboarding, setHasSeenOnboarding } = useOnboardingStore();
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    // Inter font family for modern, professional look
    Inter: Inter_400Regular,
    "Inter-Medium": Inter_500Medium,
    "Inter-SemiBold": Inter_600SemiBold,
    "Inter-Bold": Inter_700Bold,
    // Keep SpaceMono for compatibility
    SpaceMono: require("assets/fonts/SpaceMono-Regular.ttf"),
  });

  // Wait for fonts AND onboarding flag to be known before rendering navigation stack.
  if (!loaded) return null;

  const clearOnboardingFlag = async () => {
    setHasSeenOnboarding(false);
    Alert.alert(
      "Dev: onboarding cleared",
      "You can now revisit the onboarding."
    );
  };

  return (
    <KlyntlThemeProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          {/* Public routes - always available */}
          <Stack.Screen
            name="onboarding"
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />

          <Stack.Screen
            name="welcome"
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />

          <Stack.Screen
            name="auth"
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />

          {/* Protected routes - require onboarding completion */}
          <Stack.Protected guard={hasSeenOnboarding}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/* Modal presentations */}
            <Stack.Screen
              name="(modal)"
              options={{
                presentation: "modal",
                headerShown: false,
              }}
            />

            {/* Customer management routes - only detail view */}
            <Stack.Screen
              name="customer"
              options={{
                headerShown: false,
                title: "Customer Management",
              }}
            />
          </Stack.Protected>

          {/* 404 page */}
          <Stack.Screen
            name="+not-found"
            options={{
              title: "Not Found",
              headerShown: true,
            }}
          />
        </Stack>

        {__DEV__ && (
          <TouchableOpacity
            onPress={clearOnboardingFlag}
            style={styles.devButton}
            accessibilityLabel="Clear onboarding flag"
          >
            <Text style={styles.devButtonText}>Clear Onboarding</Text>
          </TouchableOpacity>
        )}
      </ThemeProvider>
    </KlyntlThemeProvider>
  );
}

const styles = StyleSheet.create({
  devButton: {
    position: "absolute",
    left: 12,
    bottom: 28,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 9999,
  },
  devButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});
