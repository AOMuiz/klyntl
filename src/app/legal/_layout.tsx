import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Stack } from "expo-router";

export default function LegalLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          color: colors.text,
        },
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen
        name="privacy"
        options={{
          headerBackVisible: true,
          headerBackTitle: "Back",
          //   headerShown: false, // Let the store layout handle its own header
          title: "Privacy Policy",
        }}
      />
      <Stack.Screen
        name="terms"
        options={{
          headerBackVisible: true,
          headerBackTitle: "Back",
          //   headerShown: false, // Let the customer layout handle its own header
          title: "Terms of Service",
        }}
      />
    </Stack>
  );
}
