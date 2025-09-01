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
import { Stack, usePathname } from "expo-router";
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

  const pathname = usePathname();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(
    null
  );

  // read persisted flag
  const readOnboardingFlag = async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      setHasSeenOnboarding(value === "true");
    } catch {
      setHasSeenOnboarding(false);
    }
  };

  useEffect(() => {
    // read once on mount
    readOnboardingFlag();
    // also re-check whenever the route path changes (helps after onboarding completes)
  }, []);

  useEffect(() => {
    // re-check when pathname changes (only if we've already loaded flag)
    if (hasSeenOnboarding !== null) {
      readOnboardingFlag();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!loaded || hasSeenOnboarding === null) {
    // wait for fonts and onboarding flag to load to avoid flashes/loops
    return null;
  }

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
              {/* Public onboarding route (always available) */}
              <Stack.Screen
                name="onboarding"
                options={{ headerShown: false }}
              />

              {/* Protected app routes: only available once hasSeenOnboarding === true */}
              <Stack.Protected guard={hasSeenOnboarding}>
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
                    // Hide the root header so the nested customer layout can show its own header
                    headerShown: false,
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
