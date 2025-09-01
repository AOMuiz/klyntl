import { Stack } from "expo-router/stack";

export default function CustomerLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
          title: "Customer Details",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#F5F5F5" },
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          title: "Add Customer",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#F5F5F5" },
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          title: "Edit Customer",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#F5F5F5" },
        }}
      />
    </Stack>
  );
}
