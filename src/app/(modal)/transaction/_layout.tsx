import { ModalCloseButton } from "@/components/ui/ModalCloseButton";
import { Stack } from "expo-router";

export default function ModalTransactionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#F5F5F5",
        },
        headerTitleAlign: "center",
        headerLeft: () => <ModalCloseButton variant="icon" iconName="xmark" />,
      }}
    >
      <Stack.Screen
        name="add"
        options={{
          title: "Add Transaction",
          presentation: "modal",
          headerLeft: () => (
            <ModalCloseButton
              variant="cancel"
              text="Cancel"
              textColor="#FF3B30"
            />
          ),
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          title: "Edit Transaction",
          presentation: "modal",
          headerLeft: () => (
            <ModalCloseButton variant="text" text="Done" textColor="#007AFF" />
          ),
        }}
      />
    </Stack>
  );
}
