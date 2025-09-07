import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Stack } from "expo-router/stack";

export default function CustomerLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          // Show native header for customer details and set a friendly back button label
          headerShown: true,
          headerTitle: "Customer Details",
          headerBackTitle: "Customers",
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            color: colors.text,
          },
          headerTintColor: colors.primary,
        }}
      />
      <Stack.Screen
        name="credit-management"
        options={{
          // Show native header for customer details and set a friendly back button label
          headerShown: true,
          headerTitle: "Credit Management",
          headerBackTitle: "Customers",
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            color: colors.text,
          },
          headerTintColor: colors.primary,
        }}
      />
    </Stack>
  );
}
