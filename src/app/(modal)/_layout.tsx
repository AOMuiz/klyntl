import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Stack } from "expo-router";

export default function ModalLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <Stack
      screenOptions={{
        presentation: "modal",
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
        name="store"
        options={{
          headerShown: false, // Let the store layout handle its own header
        }}
      />
      <Stack.Screen
        name="customer"
        options={{
          headerShown: false, // Let the customer layout handle its own header
        }}
      />
      <Stack.Screen
        name="transaction"
        options={{
          headerShown: false, // Let the transaction layout handle its own header
        }}
      />
    </Stack>
  );
}
