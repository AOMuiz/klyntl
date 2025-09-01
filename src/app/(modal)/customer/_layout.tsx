import { ModalCloseButton } from "@/components/ui/ModalCloseButton";
import { Stack } from "expo-router";

export default function ModalCustomerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#F5F5F5",
        },
        headerTitleAlign: "center",
        headerLeft: () => <ModalCloseButton variant="icon" />,
      }}
    >
      <Stack.Screen
        name="add"
        options={{
          title: "Add Customer",
          presentation: "modal",
          headerLeft: () => <ModalCloseButton variant="cancel" text="Cancel" />,
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          title: "Edit Customer",
          presentation: "modal",
          headerLeft: () => <ModalCloseButton variant="text" text="Close" />,
        }}
      />
    </Stack>
  );
}
