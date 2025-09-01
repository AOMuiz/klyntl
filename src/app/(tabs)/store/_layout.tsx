import { Stack } from "expo-router/stack";

export default function StoreLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ headerTitle: "Product" }} />
      <Stack.Screen
        name="edit/[id]"
        options={{ headerTitle: "Edit Product" }}
      />
    </Stack>
  );
}
