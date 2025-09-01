import { KlyntlThemeProvider } from "@/components/ThemeProvider";
import { useColorScheme } from "@/hooks/useColorScheme";
import { DatabaseProvider } from "@/services/database/context";
import { queryClient } from "@/services/query-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";
import "react-native-reanimated";

import { en, registerTranslation } from "react-native-paper-dates";
registerTranslation("en", en);

const ONBOARDING_KEY = "hasSeenOnboarding";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("assets/fonts/SpaceMono-Regular.ttf"),
  });

  // we keep two pieces of state:
  // - hasSeenOnboarding is a boolean guard for Stack.Protected
  // - flagLoaded avoids rendering until we know the persisted value (prevents immediate redirect)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(false);
  const [flagLoaded, setFlagLoaded] = useState(false);

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

  // Wait for fonts AND onboarding flag to be known before rendering navigation stack.
  if (!loaded || !flagLoaded) return null;

  const clearOnboardingFlag = async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      setHasSeenOnboarding(false);
      Alert.alert(
        "Dev: onboarding cleared",
        "You can now revisit the onboarding."
      );
    } catch {
      // ignore errors
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <DatabaseProvider
        databaseName="klyntl.db"
        onError={(error) => {
          console.error("Database error in app:", error);
        }}
      >
        <KlyntlThemeProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack>
              {/* Public routes - always available */}
              <Stack.Screen
                name="onboarding"
                options={{
                  headerShown: false,
                  gestureEnabled: false,
                }}
              />

              {/* Protected routes - require onboarding completion */}
              <Stack.Protected guard={hasSeenOnboarding}>
                {/* Main tab navigation */}
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

                {/* 404 page */}
                <Stack.Screen
                  name="+not-found"
                  options={{
                    title: "Not Found",
                    headerShown: true,
                  }}
                />
              </Stack.Protected>
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
      </DatabaseProvider>
    </QueryClientProvider>
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
  devButtonText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
