import { Stack } from "expo-router";

export default function ModalLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: "modal",
        headerShown: true,
        headerStyle: {
          backgroundColor: "#F5F5F5",
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
