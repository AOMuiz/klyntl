import { ModalCloseButton } from "@/components/ui/ModalCloseButton";
import { Stack } from "expo-router";

export default function ModalStoreLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#F5F5F5",
        },
        headerTitleAlign: "center",
        headerLeft: () => <ModalCloseButton />,
      }}
    >
      <Stack.Screen
        name="add"
        options={{
          title: "Add Store Item",
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          title: "Edit Store Item",
        }}
      />
    </Stack>
  );
}
