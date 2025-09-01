import { Stack } from "expo-router/stack";

export default function CustomerLayout() {
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
          headerStyle: { backgroundColor: "#F5F5F5" },
        }}
      />
    </Stack>
  );
}
