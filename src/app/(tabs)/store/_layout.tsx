import { Stack } from "expo-router/stack";

export default function StoreLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ headerTitle: "Product" }} />
      {/* edit/[id] provided by filesystem route; no explicit Stack.Screen required */}
    </Stack>
  );
}
