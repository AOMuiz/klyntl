import { KlyntlThemeProvider } from "@/components/ThemeProvider";
import { useColorScheme } from "@/hooks/useColorScheme";
import { DatabaseProvider } from "@/services/database/context";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import "react-native-reanimated";

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
    <DatabaseProvider databaseName="klyntl.db">
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
              }}
            />
            <Stack.Screen
              name="customer/[id]"
              options={{
                title: "Customer Details",
              }}
            />
            <Stack.Screen
              name="transaction/add"
              options={{
                title: "Add Transaction",
                presentation: "modal",
              }}
            />
            <Stack.Screen name="+not-found" />
          </Stack>
        </ThemeProvider>
      </KlyntlThemeProvider>
    </DatabaseProvider>
  );
}
